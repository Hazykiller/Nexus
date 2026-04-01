import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runWriteQuery } from '@/lib/neo4j';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.id as string;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (userId === id) return NextResponse.json({ error: 'Cannot add yourself to close friends' }, { status: 400 });

    await runWriteQuery(
      `MATCH (me:User {id: $userId})
       MATCH (u:User {id: $id})
       MERGE (me)-[r:CLOSE_FRIEND]->(u)
       SET r.createdAt = datetime()
       RETURN r`,
      { userId, id }
    );

    return NextResponse.json({ success: true, message: 'Added to Close Friends' });
  } catch (error) {
    console.error('Close friend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.id as string;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await runWriteQuery(
      `MATCH (me:User {id: $userId})-[r:CLOSE_FRIEND]->(u:User {id: $id})
       DELETE r`,
      { userId, id }
    );

    return NextResponse.json({ success: true, message: 'Removed from Close Friends' });
  } catch (error) {
    console.error('Remove close friend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
