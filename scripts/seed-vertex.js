const { runWriteQuery } = require('../src/lib/neo4j');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Vertex 'Airtight' Persona Seeder.
 * Generates 4 distinct test accounts with Tiered Access and encrypted metadata.
 * Passwords for all: 'Password123!'
 */

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = 'vertex-at-rest-secret-2025-01-01'; // Matches src/lib/dbEncryption.ts
const IV_LENGTH = 16;

function encryptAtRest(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function seed() {
  const hashedPassword = await bcrypt.hash('Password123!', 12);
  
  const personas = [
    { name: 'Vertex Admin', email: 'admin@vertex.social', username: 'admin', dob: '1985-01-01', isAdmin: true, isRestricted: false },
    { name: 'Adult User One', email: 'adult1@vertex.social', username: 'adult1', dob: '1990-01-01', isAdmin: false, isRestricted: false },
    { name: 'Adult User Two', email: 'adult2@vertex.social', username: 'adult2', dob: '1992-05-15', isAdmin: false, isRestricted: false },
    { name: 'Adult User Three', email: 'adult3@vertex.social', username: 'adult3', dob: '1988-11-20', isAdmin: false, isRestricted: false },
    { name: 'Adult User Four', email: 'adult4@vertex.social', username: 'adult4', dob: '1994-03-30', isAdmin: false, isRestricted: false },
    { name: 'Teen User One', email: 'teen1@vertex.social', username: 'teen1', dob: '2008-01-01', isAdmin: false, isRestricted: true },
    { name: 'Teen User Two', email: 'teen2@vertex.social', username: 'teen2', dob: '2009-06-12', isAdmin: false, isRestricted: true },
    { name: 'Teen User Three', email: 'teen3@vertex.social', username: 'teen3', dob: '2010-09-05', isAdmin: false, isRestricted: true },
  ];

  console.log('🌱 Seeding Vertex Airtight Personas...');

  for (const p of personas) {
    const id = uuidv4();
    const encryptedEmail = encryptAtRest(p.email);
    const encryptedDob = encryptAtRest(p.dob);

    await runWriteQuery(
      `MERGE (u:User {email: $email})
       ON CREATE SET
         u.id = $id,
         u.username = $username,
         u.name = $name,
         u.password = $password,
         u.dob = $dob,
         u.isRestricted = $isRestricted,
         u.isAdmin = $isAdmin,
         u.verified = true,
         u.createdAt = datetime(),
         u.updatedAt = datetime(),
         u.privacy = 'public',
         u.avatar = '',
         u.coverPhoto = '',
         u.bio = 'Airtight Test Persona'
       RETURN u`,
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
    console.log(`✅ Seeded: ${p.username} (${p.isRestricted ? 'Restricted' : 'Full Access'})`);
  }

  console.log('\n✨ Database Seeding Complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
