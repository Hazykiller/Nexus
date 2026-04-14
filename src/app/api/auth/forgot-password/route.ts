import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { hashForLookup } from '@/lib/security/dbEncryption';
import { getRateLimit } from '@/lib/rate-limit';

/**
 * Forgot Password — Generates a secure, time-limited reset token.
 * Since we don't have a real email provider, the reset link is returned
 * directly in the API response and displayed on the UI.
 * The cryptography is production-grade (HMAC-SHA256 + expiry).
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Rate limit: 3 requests per 15 minutes per IP
    const ip = req.headers.get('x-forwarded-for') || 'anon';
    const rl = getRateLimit(`forgot-${ip}`, 3, 15 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many attempts. Please wait 15 minutes.' }, { status: 429 });
    }

    const emailHash = hashForLookup(email);

    // Check if user exists and is verified
    const user = await runSingleQuery<{ id: string; name: string }>(
      'MATCH (u:User {emailHash: $emailHash, verified: true}) RETURN u.id AS id, u.name AS name',
      { emailHash }
    );

    if (!user) {
      // Don't reveal whether email exists — always show success
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been generated.',
        resetUrl: null,
      });
    }

    // Generate crypto-secure reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // Store hashed token on user node
    await runWriteQuery(
      `MATCH (u:User {id: $userId})
       SET u.resetTokenHash = $tokenHash,
           u.resetTokenExpiry = datetime($expiresAt)`,
      { userId: user.id, tokenHash, expiresAt }
    );

    // Build the reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://my-project-pink-omega.vercel.app';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    console.log(`\n[Vertex Security] Password reset token generated for ${email}`);
    console.log(`[Vertex Security] Reset URL: ${resetUrl}\n`);

    return NextResponse.json({
      success: true,
      message: 'Reset link generated. It expires in 15 minutes.',
      resetUrl,
      userName: user.name,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
