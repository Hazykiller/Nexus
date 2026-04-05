import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { runWriteQuery } from '@/lib/neo4j';
import { encryptAtRest, hashForLookup } from '@/lib/security/dbEncryption';

/**
 * Developer utility: wipes the entire database and seeds test accounts.
 * Visit /api/dev/reseed in your browser to run it.
 * All accounts use password: Password123!
 */
export async function GET() {
  try {
    // Wipe everything
    await runWriteQuery('MATCH (n) DETACH DELETE n');

    const hashedPassword = await bcrypt.hash('Password123!', 12);

    const personas = [
      { name: 'Admin Boss', email: 'admin@vertex.social', username: 'admin', dob: '1999-01-01', isAdmin: true, isRestricted: false },
      { name: 'Adult User One', email: 'adult1@vertex.social', username: 'adult1', dob: '2000-01-01', isAdmin: false, isRestricted: false },
      { name: 'Adult User Two', email: 'adult2@vertex.social', username: 'adult2', dob: '1998-05-15', isAdmin: false, isRestricted: false },
      { name: 'Teen User', email: 'teen1@vertex.social', username: 'teen1', dob: '2010-01-01', isAdmin: false, isRestricted: true },
    ];

    for (const p of personas) {
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
           isAdmin: $isAdmin,
           verified: true,
           createdAt: datetime(),
           updatedAt: datetime(),
           privacy: 'public',
           avatar: '',
           coverPhoto: '',
           bio: ''
         })`,
        {
          id: uuidv4(),
          emailHash: hashForLookup(p.email),
          encryptedEmail: encryptAtRest(p.email),
          username: p.username,
          name: p.name,
          password: hashedPassword,
          dob: encryptAtRest(p.dob),
          isRestricted: p.isRestricted,
          isAdmin: p.isAdmin,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database wiped and reseeded!',
      accounts: [
        { email: 'admin@vertex.social', password: 'Password123!', role: 'Admin' },
        { email: 'adult1@vertex.social', password: 'Password123!', role: 'User' },
        { email: 'adult2@vertex.social', password: 'Password123!', role: 'User' },
        { email: 'teen1@vertex.social', password: 'Password123!', role: 'Restricted (teen)' },
      ],
    });
  } catch (error: any) {
    console.error('Reseed error:', error);
    return NextResponse.json({ error: error.message || 'Reseed failed' }, { status: 500 });
  }
}
