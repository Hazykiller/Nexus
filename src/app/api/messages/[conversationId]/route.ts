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

    return NextResponse.json({ success: true, data: messages });
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
    const isVerified = (session.user as Record<string, unknown>).verified as boolean;

    if (!isVerified) {
      return NextResponse.json({ error: 'Verification required to send direct messages' }, { status: 403 });
    }

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
       // Check if IT IS a conversation I participate in
       MATCH (me)-[:PARTICIPATES_IN]->(c)
       WITH me, c, other
       // Privacy Logic: If other is private, I MUST follow them to message
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
    // Vertex Airtight: Encrypt the entire metadata bundle if it contains sensitive info
    const payload = JSON.stringify({ content, mediaUrl, sharedPostId });
    const encryptedPayload = encryptMessage(payload);

    // Create message and attach to conversation
    const writeResult = await runQuery(
      `MATCH (me:User {id: $userId})
       MATCH (c:Conversation {id: $conversationId})
       CREATE (msg:Message {
         id: $messageId,
         senderId: $userId,
         content: $content,
         mediaUrl: $mediaUrl,
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
        content: encryptedPayload,
        mediaType: mediaType || 'text',
      }
    );

    const resultingMessage = writeResult[0] ? writeResult[0].msg as Record<string, unknown> : null;
    const sender = writeResult[0] ? writeResult[0].me as Record<string, unknown> : null;
    if (sender) delete sender.password;

    if (resultingMessage && sender) {
      const formattedMessage = {
        ...resultingMessage,
        content: content, // send raw unencrypted text over websocket to active participant
        sender,
      };

      try {
        getPusherServer().trigger(
          channels.conversation(conversationId),
          events.NEW_MESSAGE,
          formattedMessage
        );
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

