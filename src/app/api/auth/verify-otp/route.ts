import { NextRequest, NextResponse } from 'next/server';
import { runWriteQuery } from '@/lib/neo4j';
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

    // Integer timestamp comparison — works reliably across all Neo4j driver versions
    const result = await runWriteQuery(
      `MATCH (u:User {email: $email})
       WHERE u.otp = $otp AND u.otpExpiresAt > timestamp()
       SET u.verified = true, u.otp = null, u.otpExpiresAt = null
       RETURN u.id AS id`,
      { email: encryptedEmail, otp: String(otp) }
    ) as unknown as Array<{ id: string }>;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Codes expire after 15 minutes.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Account verified. Welcome to Vertex.' }, { status: 200 });
  } catch (error) {
    console.error('[Vertex OTP] Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
