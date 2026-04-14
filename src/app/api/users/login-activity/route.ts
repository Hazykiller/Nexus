import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';

/**
 * Login Activity API — Returns the user's recent login sessions.
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
