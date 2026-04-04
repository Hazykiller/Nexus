import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runWriteQuery } from '@/lib/neo4j';
import bcrypt from 'bcryptjs';
import { logSecurityEvent } from '@/lib/security/security';

/**
 * Airtight Admin Recovery API.
 * Allows a verified Administrator to reset a user's password in case of account loss.
 * Every recovery action is logged as a SecurityEvent for audit-readiness.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.isAdmin;

    if (!isAdmin) {
      await logSecurityEvent(
        'forbidden_action',
        'Unauthorized attempt to trigger account recovery',
        (session?.user as any)?.id
      );
      return NextResponse.json({ error: 'Maximum Security Clearance Required' }, { status: 403 });
    }

    const { targetUserId, newTemporaryPassword } = await req.json();

    if (!targetUserId || !newTemporaryPassword) {
      return NextResponse.json({ error: 'Missing target user or password' }, { status: 400 });
    }

    // Hash the new temporary password
    const hashedPassword = await bcrypt.hash(newTemporaryPassword, 12);

    // Update the user's password in Neo4j
    await runWriteQuery(
      `MATCH (u:User {id: $targetUserId})
       SET u.password = $hashedPassword,
           u.mustChangePassword = true,
           u.lastRecoveredAt = datetime()`,
      { targetUserId, hashedPassword }
    );

    await logSecurityEvent(
      'moderation_breach',
      `Admin initiated successful password recovery for User ${targetUserId}`,
      (session?.user as any)?.id
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Account recovered successfully. User will be prompted to change password on next login.' 
    });
  } catch (error) {
    console.error('Account recovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
