import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, runWriteQuery } from '@/lib/neo4j';
import { encryptAtRest } from '@/lib/security/dbEncryption';

// This route resets the entire DB and seeds test accounts.
export async function GET() {
  try {
    console.log('🗑️ Wiping database...');
    await runWriteQuery('MATCH (n) DETACH DELETE n');

    console.log('🌱 Seeding database with GenZ accounts...');
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    
    const personas = [
      { name: 'Admin Boss', email: 'admin@vertex.social', username: 'admin', dob: '1999-01-01', isAdmin: true, isRestricted: false },
      { name: 'Adult User One', email: 'adult1@vertex.social', username: 'adult1', dob: '2000-01-01', isAdmin: false, isRestricted: false },
      { name: 'Teen User', email: 'teen1@vertex.social', username: 'teen1', dob: '2010-01-01', isAdmin: false, isRestricted: true }
    ];

    for (const p of personas) {
      const id = uuidv4();
      const encryptedEmail = encryptAtRest(p.email);
      const encryptedDob = encryptAtRest(p.dob);

      await runWriteQuery(
        `CREATE (u:User {
           id: $id,
           username: $username,
           name: $name,
           email: $email,
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
           bio: 'Testing out Vertex!'
         })`,
        {
          id,
          email: encryptedEmail,
          username: p.username,
          name: p.name,
          password: hashedPassword,
          dob: encryptedDob,
          isRestricted: p.isRestricted,
          isAdmin: p.isAdmin
        }
      );
    }

    return NextResponse.json({ success: true, message: 'Database wiped and reseeded successfully! You can now log in with admin@vertex.social / Password123!' }, { status: 200 });
  } catch (error: any) {
    console.error('Reseed error:', error);
    return NextResponse.json({ error: error.message || 'Error occurred while reseeding' }, { status: 500 });
  }
}
