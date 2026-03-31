import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;

    // Try friends-of-friends first
    let results = await runQuery(
      `MATCH (me:User {id: $userId})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(rec:User)
       WHERE rec.id <> $userId
         AND NOT (me)-[:FOLLOWS]->(rec)
         AND NOT (me)-[:BLOCKED]->(rec)
       RETURN DISTINCT rec, count(*) AS score
       ORDER BY score DESC LIMIT 10`,
      { userId }
    );

    // If not enough results, fall back to all users the current user doesn't follow
    if (results.length < 5) {
      const existingIds = results.map((r) => (r.rec as Record<string, unknown>).id as string);
      const fallback = await runQuery(
        `MATCH (me:User {id: $userId}), (rec:User)
         WHERE rec.id <> $userId
           AND NOT (me)-[:FOLLOWS]->(rec)
           AND NOT (me)-[:BLOCKED]->(rec)
           AND NOT rec.id IN $existingIds
         RETURN rec, 0 AS score
         ORDER BY rec.createdAt DESC LIMIT $limit`,
        { userId, existingIds, limit: 10 - results.length }
      );
      results = [...results, ...fallback];
    }

    const users = results.map((r) => {
      const u = r.rec as Record<string, unknown>;
      delete u.password;
      return { ...u, score: r.score };
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
