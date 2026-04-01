const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function wipeDatabase() {
  const session = driver.session();
  console.log('Starting maximum security database wipe...');
  try {
    // Delete all nodes and relationships
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('✅ Database wiped completely.');
  } catch (e) {
    console.error(`⚠️ Wipe failed:`, e.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

wipeDatabase();
