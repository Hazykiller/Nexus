import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runWriteQuery } from '@/lib/neo4j';
import { logSecurityEvent } from '@/lib/security';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Strict Admin Authorization Check
    const isAdmin = (session?.user as any)?.isAdmin;
    if (!isAdmin) {
      await logSecurityEvent(
        'forbidden_action',
        'Attempted node deletion without admin clearance',
        (session?.user as any)?.id
      );
      return NextResponse.json(
        { error: 'Forbidden: Maximum Security Clearance Required' }, 
        { status: 403 }
      );
    }

    const { targetId, nodeType } = await req.json();

    if (!targetId || !nodeType) {
      return NextResponse.json({ error: 'Target ID and Node Type are required' }, { status: 400 });
    }

    // Sanitize nodeType strictly to prevent Cypher injection
    const allowedTypes = ['User', 'Post', 'Comment'];
    if (!allowedTypes.includes(nodeType)) {
      return NextResponse.json({ error: 'Invalid node type for moderation' }, { status: 400 });
    }

    // Execute the deletion
    const query = `MATCH (n:${nodeType} {id: $targetId}) DETACH DELETE n RETURN true as deleted`;
    
    console.log(`[ADMIN ACTION] Executing authoritative wipe on ${nodeType} ID: ${targetId}`);
    
    await runWriteQuery(query, { targetId }) as unknown as any[];

    return NextResponse.json({ success: true, message: `${nodeType} permanently removed from the graph.` });
  } catch (error) {
    console.error('Admin Moderation Error:', error);
    return NextResponse.json({ error: 'Internal server error during moderation' }, { status: 500 });
  }
}
