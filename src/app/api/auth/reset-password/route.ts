import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { hashForLookup } from '@/lib/security/dbEncryption';
import { logSecurityEvent } from '@/lib/security/security';

/**
 * Reset Password — Validates the reset token and updates the password.
 * Token is verified by re-hashing the raw token and comparing against stored hash.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json({ error: 'Token, email, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Re-hash the token to compare against stored hash
    const tokenHash = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback')
      .update(token)
      .digest('hex');

    const emailHash = hashForLookup(email);

    // Find user with matching token hash and valid expiry
    const user = await runSingleQuery<{ id: string; resetTokenExpiry: string }>(
      `MATCH (u:User {emailHash: $emailHash, resetTokenHash: $tokenHash})
       WHERE u.resetTokenExpiry > datetime()
       RETURN u.id AS id, toString(u.resetTokenExpiry) AS resetTokenExpiry`,
      { emailHash, tokenHash }
    );

    if (!user) {
      return NextResponse.json({
        error: 'Invalid or expired reset link. Please request a new one.'
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear the reset token
    await runWriteQuery(
      `MATCH (u:User {id: $userId})
       SET u.password = $hashedPassword,
           u.resetTokenHash = null,
           u.resetTokenExpiry = null`,
      { userId: user.id, hashedPassword }
    );

    // Log the security event
    await logSecurityEvent(
      'forbidden_action',
      `Password reset completed successfully for user ${user.id}`,
      user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
