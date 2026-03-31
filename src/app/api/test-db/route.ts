import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await runQuery('RETURN 1 AS number');
    return NextResponse.json({ success: true, "message": "Database successfully connected", result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error', fullError: error.toString() }, { status: 500 });
  }
}
