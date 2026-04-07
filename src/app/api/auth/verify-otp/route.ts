import { NextRequest, NextResponse } from 'next/server';
import { runSingleQuery } from '@/lib/neo4j';
import { hashForLookup } from '@/lib/security/dbEncryption';
import { verifyTOTP } from '@/lib/security/totp';

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
      const user = await runSingleQuery<{ totpSecret: string }>(
        'MATCH (u:User {emailHash: $emailHash}) RETURN u.totpSecret AS totpSecret',
        { emailHash }
      );

      if (!user || !user.totpSecret) {
        return NextResponse.json({ error: 'User not found or secret missing' }, { status: 404 });
      }

      // Verify TOTP dynamically based on current time
      const isValid = verifyTOTP(otp, user.totpSecret);

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid or expired Authenticator code' }, { status: 400 });
      }
    }

    // Mark as verified
    const result = await runSingleQuery<{ id: string }>(
      `MATCH (u:User {emailHash: $emailHash})
       SET u.verified = true
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
