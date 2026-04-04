import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as Record<string, unknown>)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results = await runQuery(`
    MATCH (s:SecurityEvent)
    RETURN s.id AS id, s.type AS type, s.details AS details,
           s.userId AS userId, s.createdAt AS createdAt
    ORDER BY s.createdAt DESC LIMIT 200
  `);

  return NextResponse.json({ success: true, data: results });
}
