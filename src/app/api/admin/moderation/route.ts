import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery, runWriteQuery } from '@/lib/neo4j';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as Record<string, unknown>).isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'flagged-posts') {
      const results = await runQuery(`
        MATCH (u:User)-[:CREATED]->(p:Post)
        WHERE p.isDeleted = true
        RETURN p.id AS postId, p.content AS content, p.createdAt AS createdAt, p.moderationReason AS reason, u.username AS username, u.riskScore AS riskScore
        ORDER BY p.createdAt DESC
        LIMIT 50
      `);
      return NextResponse.json({ success: true, data: results });
    }

    if (action === 'risky-users') {
      const results = await runQuery(`
        MATCH (u:User)
        WHERE coalesce(u.riskScore, 0) > 0
        RETURN u.id AS userId, u.username AS username, u.name AS name, coalesce(u.riskScore, 0) AS riskScore
        ORDER BY u.riskScore DESC
        LIMIT 50
      `);
      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Moderation API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as Record<string, unknown>).isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

    await runWriteQuery('MATCH (p:Post {id: $postId}) DETACH DELETE p', { postId });
    return NextResponse.json({ success: true });
  } catch(e) {
    return NextResponse.json({ error: 'Failed to purge post' }, { status: 500 });
  }
}
