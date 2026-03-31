import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;

    // Multi-factor Recommendation: Friends-of-Friends + Shared Interactions
    const results = await runQuery(
      `MATCH (me:User {id: $userId})
       
       // 1. Friends of Friends
       OPTIONAL MATCH (me)-[:FOLLOWS]->(:User)-[:FOLLOWS]->(rec1:User)
       WHERE NOT (me)-[:FOLLOWS]->(rec1) AND rec1.id <> $userId AND NOT (me)-[:BLOCKED]->(rec1)
       
       // 2. Shared Interests
       OPTIONAL MATCH (me)-[:LIKES]->(:Post)<-[:LIKES]-(rec2:User)
       WHERE NOT (me)-[:FOLLOWS]->(rec2) AND rec2.id <> $userId AND NOT (me)-[:BLOCKED]->(rec2)
       
       WITH [rec1, rec2] as recs
       UNWIND recs as rec
       WITH rec WHERE rec IS NOT NULL
       
       RETURN rec, COUNT(rec) AS score
       ORDER BY score DESC LIMIT 15`,
      { userId }
    );

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
