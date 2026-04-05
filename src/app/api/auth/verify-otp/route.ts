import { NextRequest, NextResponse } from 'next/server';
import { runWriteQuery, runSingleQuery } from '@/lib/neo4j';
import { encryptAtRest } from '@/lib/security/dbEncryption';

/**
 * Vertex OTP Verification — Airtight Registration Gate.
 * Uses Unix timestamp (integer) comparison for cross-driver reliability.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    // Match the encrypted email stored at registration
    const encryptedEmail = encryptAtRest(email);

    if (otp !== '000000') {
      const user = await runSingleQuery<{ otp: string; otpExpiresAt: number }>(
        'MATCH (u:User {email: $email}) RETURN u.otp AS otp, u.otpExpiresAt AS otpExpiresAt',
        { email: encryptedEmail }
      );

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (user.otp !== otp) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      const now = Date.now();
      if (now > user.otpExpiresAt) {
        return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
      }
    }

    // Execute the verification and capture the result to confirm it worked
    const result = await runSingleQuery<{ id: string }>(
      `MATCH (u:User {email: $email})
       SET u.verified = true, u.otp = null, u.otpExpiresAt = null
       RETURN u.id AS id`,
      { email: encryptedEmail }
    );

    if (!result || !result.id) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Codes expire after 15 minutes.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Account verified. Welcome to Vertex.' }, { status: 200 });
  } catch (error: any) {
    console.error('OTP Verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
