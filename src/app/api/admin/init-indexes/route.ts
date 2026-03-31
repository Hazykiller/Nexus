import { NextRequest, NextResponse } from 'next/server';
import { runWriteQuery } from '@/lib/neo4j';

export async function POST(req: NextRequest) {
  try {
    // Simple auth check — only callable with admin token
    const authHeader = req.headers.get('authorization');
    const adminToken = process.env.ADMIN_SESSION_TOKEN;
    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const indexes = [
      'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.id)',
      'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.username)',
      'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.email)',
      'CREATE INDEX IF NOT EXISTS FOR (p:Post) ON (p.id)',
      'CREATE INDEX IF NOT EXISTS FOR (s:Story) ON (s.id)',
      'CREATE INDEX IF NOT EXISTS FOR (m:Message) ON (m.id)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Conversation) ON (c.id)',
      'CREATE INDEX IF NOT EXISTS FOR (n:Notification) ON (n.id)',
      'CREATE INDEX IF NOT EXISTS FOR (g:Group) ON (g.id)',
      'CREATE INDEX IF NOT EXISTS FOR (h:Hashtag) ON (h.name)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Comment) ON (c.id)',
    ];

    const results: string[] = [];
    for (const idx of indexes) {
      try {
        await runWriteQuery(idx);
        results.push(`✅ ${idx}`);
      } catch (e: any) {
        results.push(`⚠️ ${idx} — ${e.message}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Init indexes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
