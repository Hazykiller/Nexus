import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runQuery } from '@/lib/neo4j';

async function isAdminAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const valid = process.env.ADMIN_SESSION_TOKEN || 'vertex-admin-secret-token-2025';
  return token === valid;
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthorized())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query 1: User nodes with explicit property projection
    const userNodes = await runQuery(`
      MATCH (u:User)
      RETURN u.id AS id, coalesce(u.username, u.name, u.id) AS name
    `);

    // Query 2: Post nodes with explicit property projection
    const postNodes = await runQuery(`
      MATCH (p:Post)
      RETURN p.id AS id, substring(coalesce(p.content, 'Post'), 0, 20) AS name
    `);

    // Query 3: Security Events for monitoring
    const securityNodes = await runQuery(`
      MATCH (s:SecurityEvent)
      RETURN s.id AS id, s.type AS type, s.details AS details
    `);

    // Query 3: All edges with explicit source/target IDs
    const edges = await runQuery(`
      MATCH (u1:User)-[f:FOLLOWS]->(u2:User)
      WHERE u1.id IS NOT NULL AND u2.id IS NOT NULL
      RETURN u1.id AS source, u2.id AS target, 'FOLLOWS' AS type
      UNION ALL
      MATCH (u:User)-[:CREATED]->(p:Post)
      WHERE u.id IS NOT NULL AND p.id IS NOT NULL
      RETURN u.id AS source, p.id AS target, 'CREATED' AS type
      UNION ALL
      MATCH (u:User)-[:LIKES]->(p:Post)
      WHERE u.id IS NOT NULL AND p.id IS NOT NULL
      RETURN u.id AS source, p.id AS target, 'LIKES' AS type
    `);

    const nodes = [
      ...(userNodes as any[])
        .filter((u: any) => u.id != null)
        .map((u: any) => ({ id: String(u.id), label: 'User', name: String(u.name || u.id) })),
      ...(postNodes as any[])
        .filter((p: any) => p.id != null)
        .map((p: any) => ({ id: String(p.id), label: 'Post', name: String(p.name || 'Post') })),
      ...(securityNodes as any[])
        .filter((s: any) => s.id != null)
        .map((s: any) => ({ id: String(s.id), label: 'SecurityEvent', name: String(s.type || 'Alert') })),
    ];

    const links = (edges as any[])
      .filter((e: any) => e.source != null && e.target != null)
      .map((e: any) => ({
        source: String(e.source),
        target: String(e.target),
        label: String(e.type),
      }));

    return NextResponse.json({ success: true, data: { nodes, links } });
  } catch (error) {
    console.error('Graph API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
