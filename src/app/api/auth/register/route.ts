import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { encryptAtRest, hashForLookup } from '@/lib/security/dbEncryption';
// @ts-expect-error otplib types missing but functionality remains fully sound
import { authenticator } from 'otplib';
import { getRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password, dob } = await req.json();

    // 1. Rate Limit Check (10 requests per 10 minutes per IP/identifier)
    // For Vercel Edge/Serverless, we use x-forwarded-for or a fallback identifier
    const ip = req.headers.get('x-forwarded-for') || 'anon-' + email;
    const rateLimit = getRateLimit(ip, 5, 10 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    if (!name || !username || !email || !password || !dob) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Deterministic hash for looking up the email in the database
    const emailHash = hashForLookup(email);

    // Check if a VERIFIED user already exists with this email or username
    const existing = await runSingleQuery<{ verified: boolean; matchType: string }>(
      `MATCH (u:User) WHERE u.emailHash = $emailHash OR u.username = $username
       RETURN u.verified AS verified, 
              CASE WHEN u.emailHash = $emailHash THEN 'email' ELSE 'username' END AS matchType
       LIMIT 1`,
      { emailHash, username }
    );

    if (existing) {
      if (existing.verified) {
        return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });
      } else {
        // Unverified ghost account — wipe it so the user can re-register
        await runWriteQuery(
          'MATCH (u:User) WHERE (u.emailHash = $emailHash OR u.username = $username) AND u.verified = false DETACH DELETE u',
          { emailHash, username }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();

    // Age validation
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    if (age < 13) {
      return NextResponse.json({ error: 'Vertex is for age 13 and above only.' }, { status: 403 });
    }

    const isRestricted = age < 18;
    const encryptedEmail = encryptAtRest(email);
    const encryptedDob = encryptAtRest(dob);

    // Generate Google Authenticator TOTP Secret
    const secret = authenticator.generateSecret();
    const qrCodeUrl = authenticator.keyuri(email, 'Vertex Social Network', secret);

    await runWriteQuery(
      `CREATE (u:User {
        id: $id,
        emailHash: $emailHash,
        email: $encryptedEmail,
        username: $username,
        name: $name,
        password: $password,
        dob: $dob,
        isRestricted: $isRestricted,
        avatar: '',
        coverPhoto: '',
        bio: '',
        website: '',
        location: '',
        privacy: 'public',
        verified: false,
        isAdmin: false,
        totpSecret: $secret,
        createdAt: datetime(),
        updatedAt: datetime()
      })`,
      { id, emailHash, encryptedEmail, username, name, password: hashedPassword, dob: encryptedDob, isRestricted, secret }
    );

    return NextResponse.json({ success: true, message: 'Account skeleton generated', authUrl: qrCodeUrl, email }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.message?.includes('SessionExpired')) {
      return NextResponse.json({ error: 'Database is waking up. Please try again in a few seconds.' }, { status: 503 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
