import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery, runWriteQuery } from '@/lib/neo4j';
import { getPusherServer, channels, events } from '@/lib/pusher';
import { v4 as uuidv4 } from 'uuid';

import { encryptMessage, decryptMessage } from '@/lib/security/encryption';
import { logSecurityEvent } from '@/lib/security/security';

export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;

    // Verify participation
    const verify = await runQuery(
      `MATCH (u:User {id: $userId})-[:PARTICIPATES_IN]->(c:Conversation {id: $conversationId})
       RETURN c LIMIT 1`,
      { userId, conversationId }
    );
    if (!verify.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Mark all unread messages in this conversation not sent by me as READ
    await runWriteQuery(
      `MATCH (msg:Message)-[:IN_CONVERSATION]->(c:Conversation {id: $conversationId})
       WHERE msg.senderId <> $userId AND NOT (:User {id: $userId})-[:READ]->(msg)
       WITH msg
       MATCH (me:User {id: $userId})
       CREATE (me)-[:READ {at: datetime()}]->(msg)`,
      { userId, conversationId }
    );

    // Fetch messages
    const results = await runQuery(
      `MATCH (msg:Message)-[:IN_CONVERSATION]->(c:Conversation {id: $conversationId})
       MATCH (sender:User {id: msg.senderId})
       RETURN msg, sender
       ORDER BY msg.createdAt ASC LIMIT 500`,
      { conversationId }
    );

    const messages = results.map((r) => {
      const msg = r.msg as Record<string, unknown>;
      const senderData = r.sender as Record<string, unknown>;
      delete senderData.password;

      const decrypted = msg.content ? decryptMessage(msg.content as string) : '{}';
      let parsed = { content: '', mediaUrl: '', sharedPostId: '' };
      try {
        parsed = JSON.parse(decrypted);
      } catch (e) {
        parsed = { content: decrypted, mediaUrl: '', sharedPostId: '' }; // legacy fallback
      }

      return {
        ...msg,
        ...parsed,
        sender: senderData,
      };
    });

    // Fetch partner info explicitly
    const partnerQuery = await runQuery(
      `MATCH (c:Conversation {id: $conversationId})<-[:PARTICIPATES_IN]-(other:User)
       WHERE other.id <> $userId
       RETURN other LIMIT 1`,
      { conversationId, userId }
    );

    const partner = partnerQuery.length ? (partnerQuery[0].other as Record<string, unknown>) : null;
    if (partner) delete partner.password;

    return NextResponse.json({ success: true, data: messages, partner });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;

    const { content, mediaUrl, mediaType, sharedPostId } = await req.json();
    if (!content && !mediaUrl && !sharedPostId) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Verify participation AND Privacy Rules
    const verify = await runQuery(
      `MATCH (me:User {id: $userId})
       MATCH (c:Conversation {id: $conversationId})<-[:PARTICIPATES_IN]-(other:User)
       WHERE other.id <> $userId
       WITH me, c, other
       MATCH (me)-[:PARTICIPATES_IN]->(c)
       WITH me, c, other
       OPTIONAL MATCH (me)-[f:FOLLOWS]->(other)
       RETURN other.privacy as otherPrivacy, f IS NOT NULL as isFollowing LIMIT 1`,
      { userId, conversationId }
    );

    if (!verify.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { otherPrivacy, isFollowing } = verify[0] as any;
    if (otherPrivacy === 'private' && !isFollowing) {
       await logSecurityEvent(
         'forbidden_action',
         `Attempted message to private profile ${conversationId} without follow relationship`,
         userId
       );
       return NextResponse.json({ 
         error: 'This account is private. You must follow them to send messages.' 
       }, { status: 403 });
    }

    const messageId = uuidv4();
    // Encrypt the entire payload bundle
    const payload = JSON.stringify({ content: content || '', mediaUrl: mediaUrl || '', sharedPostId: sharedPostId || '' });
    const encryptedPayload = encryptMessage(payload);

    // Create message node with the encrypted content
    const writeResult = await runQuery(
      `MATCH (me:User {id: $userId})
       MATCH (c:Conversation {id: $conversationId})
       CREATE (msg:Message {
         id: $messageId,
         senderId: $userId,
         content: $encryptedContent,
         mediaType: $mediaType,
         createdAt: datetime()
       })
       CREATE (me)-[:SENT]->(msg)
       CREATE (msg)-[:IN_CONVERSATION]->(c)
       RETURN msg, me`,
      {
        userId,
        conversationId,
        messageId,
        encryptedContent: encryptedPayload,
        mediaType: mediaType || 'text',
      }
    );

    const resultingMessage = writeResult[0] ? writeResult[0].msg as Record<string, unknown> : null;
    const sender = writeResult[0] ? writeResult[0].me as Record<string, unknown> : null;
    if (sender) delete sender.password;

    if (resultingMessage && sender) {
      const formattedMessage = {
        ...resultingMessage,
        content: content || '',
        mediaUrl: mediaUrl || '',
        sender,
      };

      // Real-time push via Pusher
      try {
        const pusher = getPusherServer();
        if (pusher) {
          await pusher.trigger(
            channels.conversation(conversationId),
            events.NEW_MESSAGE,
            formattedMessage
          );
        }
      } catch (pusherErr) {
        console.error('Pusher error:', pusherErr);
      }

      return NextResponse.json({ success: true, data: formattedMessage }, { status: 201 });
    }

    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
