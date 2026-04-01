const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function createIndexes() {
  const session = driver.session();
  const indexes = [
    'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.id)',
    'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.username)',
    'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.email)',
    'CREATE INDEX IF NOT EXISTS FOR (p:Post) ON (p.id)',
    'CREATE INDEX IF NOT EXISTS FOR (s:Story) ON (s.id)',
    'CREATE INDEX IF NOT EXISTS FOR (m:Message) ON (m.id)',
    'CREATE INDEX IF NOT EXISTS FOR (c:Conversation) ON (c.id)',
    'CREATE INDEX IF NOT EXISTS FOR (n:Notification) ON (n.id)',
    'CREATE INDEX IF NOT EXISTS FOR (g:Group) ON (g.id)',
    'CREATE INDEX IF NOT EXISTS FOR (h:Hashtag) ON (h.name)',
    'CREATE INDEX IF NOT EXISTS FOR (c:Comment) ON (c.id)',
  ];

  console.log('Creating database indexes...');
  for (const idx of indexes) {
    try {
      await session.run(idx);
      console.log(`✅ ${idx}`);
    } catch (e) {
      console.error(`⚠️ ${idx} —`, e.message);
    }
  }
  await session.close();
  await driver.close();
  console.log('Done!');
}

createIndexes();
