require('dotenv').config();
const neo4j = require('neo4j-driver');

async function testConnection() {
  const URI = process.env.NEO4J_URI;
  const USER = process.env.NEO4J_USERNAME;
  const PASSWORD = process.env.NEO4J_PASSWORD;

  console.log('Connecting to:', URI);

  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();

  try {
    const result = await session.run('RETURN 1 AS connected');
    console.log('Connected successfully:', result.records[0].get('connected').toInt() === 1);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

testConnection();
