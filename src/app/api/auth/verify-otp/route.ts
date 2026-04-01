import { NextRequest, NextResponse } from 'next/server';
import { runWriteQuery } from '@/lib/neo4j';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    // Verify OTP and make sure it hasn't expired
    const result = await runWriteQuery(
      `MATCH (u:User {email: $email})
       WHERE u.otp = $otp AND u.otpExpiresAt > datetime()
       SET u.verified = true, u.otp = null, u.otpExpiresAt = null
       RETURN u`,
      { email, otp }
    ) as unknown as any[];

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Account verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('OTP Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
