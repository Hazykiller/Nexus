import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { encryptAtRest } from '@/lib/security/dbEncryption';
import { sendOtpEmail } from '@/lib/security/mail';

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password, dob } = await req.json();

    if (!name || !username || !email || !password || !dob) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check existing user
    const encryptedEmail = encryptAtRest(email);
    const existingResult = await runSingleQuery<{ u: { verified: boolean } }>(
      'MATCH (u:User) WHERE u.email = $email OR u.username = $username RETURN u',
      { email: encryptedEmail, username }
    );

    if (existingResult && existingResult.u) {
      if (existingResult.u.verified) {
        return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });
      } else {
        // User exists but has not verified their email. Delete the old unverified record to allow fresh registration.
        await runWriteQuery(
          'MATCH (u:User) WHERE (u.email = $email OR u.username = $username) AND u.verified = false DETACH DELETE u',
          { email: encryptedEmail, username }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();
    
    // Vertex Airtight: Calculate and Validate Age
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      return NextResponse.json({ error: 'Vertex is for age 13 and above only.' }, { status: 403 });
    }

    const isRestricted = age < 18;
    const encryptedDob = encryptAtRest(dob);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tier = isRestricted ? '13-18 Restricted' : '18+ Full Access';
    
    // Vertex Professional Mailer (Resend Integration)
    await sendOtpEmail(email, otp, tier);

    await runWriteQuery(
      `CREATE (u:User {
        id: $id,
        email: $email,
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
        otp: $otp,
        otpExpiresAt: timestamp() + 900000,
        createdAt: datetime(),
        updatedAt: datetime()
      })`,
      { id, email: encryptedEmail, username, name, password: hashedPassword, dob: encryptedDob, isRestricted, otp }
    );

    return NextResponse.json({ success: true, message: 'OTP sent', email }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Check for Neo4j specific errors (e.g., SessionExpired from paused free tier)
    if (error.message && error.message.includes('SessionExpired')) {
      return NextResponse.json({ error: 'Database is waking up. Please try again in a few seconds.' }, { status: 503 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
