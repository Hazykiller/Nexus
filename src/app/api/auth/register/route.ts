import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { encryptAtRest } from '@/lib/dbEncryption';

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password } = await req.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check existing user
    const encryptedEmail = encryptAtRest(email);
    const existing = await runSingleQuery(
      'MATCH (u:User) WHERE u.email = $email OR u.username = $username RETURN u',
      { email: encryptedEmail, username }
    );

    if (existing) {
      return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log OTP for development (since no SMTP is set up yet)
    console.log(`\n========================================`);
    console.log(`🔐 SECURE OTP FOR ${email}: ${otp}`);
    console.log(`========================================\n`);

    await runWriteQuery(
      `CREATE (u:User {
        id: $id,
        email: $email,
        username: $username,
        name: $name,
        password: $password,
        avatar: '',
        coverPhoto: '',
        bio: '',
        website: '',
        location: '',
        dob: '',
        privacy: 'public',
        verified: false,
        isAdmin: false,
        otp: $otp,
        otpExpiresAt: datetime() + duration({minutes: 15}),
        createdAt: datetime(),
        updatedAt: datetime()
      })`,
      { id, email: encryptedEmail, username, name, password: hashedPassword, otp }
    );

    return NextResponse.json({ success: true, message: 'OTP sent', email }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
