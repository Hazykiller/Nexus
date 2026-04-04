import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';

/**
 * Vertex Constellation API — Personal Ego-Network Graph.
 * Returns the user's social graph: their connections and the connections between them.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;

    // Fetch: you + everyone you follow + everyone who follows you
    const nodeResults = await runQuery(`
      MATCH (me:User {id: $userId})
      OPTIONAL MATCH (me)-[:FOLLOWS]->(following:User)
      OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(me)
      WITH me, COLLECT(DISTINCT following) + COLLECT(DISTINCT follower) AS connections
      UNWIND connections AS conn
      RETURN DISTINCT conn.id AS id, conn.name AS name, conn.username AS username,
             conn.avatar AS avatar, conn.verified AS verified
    `, { userId });

    // Fetch: who among your connections follows each other (2nd-degree links)
    const edgeResults = await runQuery(`
      MATCH (me:User {id: $userId})
      MATCH (me)-[:FOLLOWS]->(a:User)
      MATCH (me)-[:FOLLOWS]->(b:User)
      WHERE a.id < b.id
      MATCH (a)-[:FOLLOWS]->(b)
      RETURN a.id AS source, b.id AS target, 'FOLLOWS' AS type
      LIMIT 200
    `, { userId });

    // My direct edges
    const myFollowingEdges = await runQuery(`
      MATCH (me:User {id: $userId})-[:FOLLOWS]->(u:User)
      RETURN $userId AS source, u.id AS target, 'FOLLOWS' AS type
    `, { userId });

    const myFollowerEdges = await runQuery(`
      MATCH (u:User)-[:FOLLOWS]->(me:User {id: $userId})
      RETURN u.id AS source, $userId AS target, 'FOLLOWS_ME' AS type
    `, { userId });

    // Check mutuals
    const mutualResult = await runQuery(`
      MATCH (me:User {id: $userId})-[:FOLLOWS]->(u:User)-[:FOLLOWS]->(me)
      RETURN u.id AS id
    `, { userId });
    const mutualIds = new Set((mutualResult as Array<{ id: string }>).map(r => r.id));

    const nodes = [
      // Self node
      { id: userId, name: (session.user as Record<string, unknown>).name as string, username: (session.user as Record<string, unknown>).username as string ?? '', self: true, mutual: false },
      // Connection nodes
      ...(nodeResults as Array<Record<string, unknown>>).map(n => ({
        id: String(n.id),
        name: String(n.name || n.username || 'User'),
        username: String(n.username || ''),
        avatar: n.avatar,
        self: false,
        mutual: mutualIds.has(String(n.id)),
      })),
    ];

    const links = [
      ...(myFollowingEdges as Array<Record<string, unknown>>).map(e => ({
        source: String(e.source),
        target: String(e.target),
        type: 'following',
      })),
      ...(myFollowerEdges as Array<Record<string, unknown>>).map(e => ({
        source: String(e.source),
        target: String(e.target),
        type: 'follower',
      })),
      ...(edgeResults as Array<Record<string, unknown>>).map(e => ({
        source: String(e.source),
        target: String(e.target),
        type: 'peer',
      })),
    ];

    return NextResponse.json({
      success: true,
      data: { nodes, links, selfId: userId, mutualCount: mutualIds.size },
    });
  } catch (error) {
    console.error('[Constellation] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
