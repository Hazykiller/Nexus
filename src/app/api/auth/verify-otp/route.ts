import { NextRequest, NextResponse } from 'next/server';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { hashForLookup } from '@/lib/security/dbEncryption';

/**
 * OTP Verification Route
 * Accepts the master bypass code 000000 or a real OTP.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    const emailHash = hashForLookup(email);

    // If NOT the master bypass, validate the real OTP
    if (otp !== '000000') {
      const user = await runSingleQuery<{ otp: string; otpExpiresAt: number }>(
        'MATCH (u:User {emailHash: $emailHash}) RETURN u.otp AS otp, u.otpExpiresAt AS otpExpiresAt',
        { emailHash }
      );

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (user.otp !== otp) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }
      if (Date.now() > user.otpExpiresAt) {
        return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
      }
    }

    // Mark as verified
    const result = await runSingleQuery<{ id: string }>(
      `MATCH (u:User {emailHash: $emailHash})
       SET u.verified = true, u.otp = null, u.otpExpiresAt = null
       RETURN u.id AS id`,
      { emailHash }
    );

    if (!result || !result.id) {
      return NextResponse.json({ error: 'User not found. Please register again.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Account verified. You can now sign in.' }, { status: 200 });
  } catch (error: any) {
    console.error('OTP Verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
