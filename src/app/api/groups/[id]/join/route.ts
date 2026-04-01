import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery, runWriteQuery } from '@/lib/neo4j';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.userId || userId; // Default to self if no body provided (for legacy join)

    // Vertex Airtight: If someone is being added, confirm the caller is an Admin
    if (targetUserId !== userId) {
      const adminCheck = await runQuery(
        `MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(g:Group {id: $groupId}) RETURN r`,
        { userId, groupId }
      );
      if (!(adminCheck as any[]).length) {
        return NextResponse.json({ error: 'Airtight Security: Only Group Admins can add members.' }, { status: 403 });
      }
    } else {
      // Hard-block spontaneous joins for "Airtight" groups if desired
      // For now, only allow admins to add others.
      return NextResponse.json({ error: 'Airtight Security: Members must be added by a Group Admin.' }, { status: 403 });
    }

    await runWriteQuery(
      `MATCH (u:User {id: $targetUserId}), (g:Group {id: $groupId})
       MERGE (u)-[:MEMBER_OF {role: 'member', joinedAt: datetime()}]->(g)`,
      { targetUserId, groupId }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Join group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.userId || userId;

    // Vertex Airtight: Admin removal logic
    if (targetUserId !== userId) {
      const adminCheck = await runQuery(
        `MATCH (u:User {id: $userId})-[r:MEMBER_OF {role: 'admin'}]->(g:Group {id: $groupId}) RETURN r`,
        { userId, groupId }
      );
      if (!(adminCheck as any[]).length) {
        return NextResponse.json({ error: 'Airtight Security: Only Group Admins can remove members.' }, { status: 403 });
      }
    }

    await runWriteQuery(
      'MATCH (u:User {id: $targetUserId})-[r:MEMBER_OF]->(g:Group {id: $groupId}) DELETE r',
      { targetUserId, groupId }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leave group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
