const neo4j = require('neo4j-driver');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getKey() {
  const secret = process.env.NEXTAUTH_SECRET || 'vertex-fallback-key-dev-only-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptAtRest(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function hashForLookup(text) {
  const secret = process.env.NEXTAUTH_SECRET || 'vertex-fallback-key-dev-only-2026';
  return crypto.createHmac('sha256', secret).update(text.toLowerCase().trim()).digest('hex');
}

async function seed() {
  const session = driver.session();
  const hashedPassword = await bcrypt.hash('Password123!', 12);
  
  const personas = [
    { name: 'Admin Boss', email: 'admin@vertex.social', username: 'admin', dob: '1999-01-01', isAdmin: true, isRestricted: false },
    { name: 'Adult User One', email: 'adult1@vertex.social', username: 'adult1', dob: '2000-01-01', isAdmin: false, isRestricted: false },
    { name: 'Adult User Two', email: 'adult2@vertex.social', username: 'adult2', dob: '1998-05-15', isAdmin: false, isRestricted: false },
    { name: 'Teen User', email: 'teen1@vertex.social', username: 'teen1', dob: '2010-01-01', isAdmin: false, isRestricted: true },
  ];

  console.log('Seeding Vertex test accounts...');

  for (const p of personas) {
    await session.run(
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
    console.log(`  Seeded: ${p.username} (${p.email})`);
  }

  console.log('Done! All accounts use password: Password123!');
  await session.close();
  await driver.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
