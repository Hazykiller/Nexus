import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery, runWriteQuery } from '@/lib/neo4j';

/**
 * Login Activity API
 * GET  — Returns the user's recent login sessions
 * DELETE — Revoke (delete) a specific session by ID
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const activities = await runQuery(
      `MATCH (la:LoginActivity {userId: $userId})
       RETURN la.id AS id, la.ip AS ip, la.userAgent AS userAgent,
              toString(la.createdAt) AS createdAt
       ORDER BY la.createdAt DESC
       LIMIT 20`,
      { userId }
    );

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    console.error('Login activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Only allow deleting own sessions
    await runWriteQuery(
      `MATCH (la:LoginActivity {id: $sessionId, userId: $userId}) DELETE la`,
      { sessionId, userId }
    );

    return NextResponse.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    console.error('Session revocation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
