import { NextRequest, NextResponse } from 'next/server';
import { runSingleQuery } from '@/lib/neo4j';

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    
    // Find exactly the user by username to retrieve their unique ID
    const result = await runSingleQuery<{ id: string }>(
      'MATCH (u:User) WHERE toLower(u.username) = toLower($username) RETURN u.id AS id',
      { username }
    );
    
    if (!result?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: { id: result.id } });
  } catch (error) {
    console.error('By-Username error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
