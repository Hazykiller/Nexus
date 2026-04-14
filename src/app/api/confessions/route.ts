import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery, runWriteQuery } from '@/lib/neo4j';
import { v4 as uuidv4 } from 'uuid';
import { runGuardBot } from '@/lib/security/guardbot';
import { logSecurityEvent } from '@/lib/security/security';

/**
 * Anonymous Confessions API
 * GET — Fetch confessions (last 24h only, author hidden)
 * POST — Create a confession (author encrypted server-side, never exposed)
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const confessions = await runQuery(
      `MATCH (c:Confession)
       WHERE c.createdAt > datetime() - duration({hours: 24})
         AND c.isDeleted <> true
       RETURN c.id AS id, c.content AS content, c.mood AS mood,
              c.likes AS likes, toString(c.createdAt) AS createdAt
       ORDER BY c.createdAt DESC
       LIMIT 50`
    );

    return NextResponse.json({ success: true, data: confessions });
  } catch (error) {
    console.error('Confessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { content, mood } = await req.json();

    if (!content || content.trim().length < 3) {
      return NextResponse.json({ error: 'Confession must be at least 3 characters' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Confession must be under 500 characters' }, { status: 400 });
    }

    // GuardBot moderation — even anonymous posts must obey content rules
    const guardResult = runGuardBot(content);
    if (guardResult.shouldDelete) {
      await logSecurityEvent(
        'moderation_breach',
        `[GuardBot] Blocked anonymous confession: ${guardResult.reason}`,
        userId
      );
      return NextResponse.json({
        error: 'Your confession was blocked by our safety system. Please keep it respectful.'
      }, { status: 400 });
    }

    const id = uuidv4();
    const validMoods = ['💭', '❤️', '😂', '😤', '😢', '🤯', '🔥', '✨'];
    const safeMood = validMoods.includes(mood) ? mood : '💭';

    // Store confession — authorId is stored but NEVER returned to clients
    await runWriteQuery(
      `CREATE (c:Confession {
        id: $id,
        content: $content,
        mood: $mood,
        authorId: $authorId,
        likes: 0,
        isDeleted: false,
        createdAt: datetime()
      })`,
      { id, content: content.trim(), mood: safeMood, authorId: userId }
    );

    return NextResponse.json({
      success: true,
      data: { id, content: content.trim(), mood: safeMood, likes: 0, createdAt: new Date().toISOString() }
    }, { status: 201 });
  } catch (error) {
    console.error('Confession POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confessionId, action } = await req.json();
    if (!confessionId || action !== 'like') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await runWriteQuery(
      `MATCH (c:Confession {id: $confessionId})
       SET c.likes = coalesce(c.likes, 0) + 1`,
      { confessionId }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Confession PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
