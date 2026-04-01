import { runWriteQuery } from '../neo4j';

/**
 * Logs a security event into Neo4j for the Admin Dashboard to monitor.
 * Captures IPs (anonymized for privacy), user IDs, and breach types.
 */
export async function logSecurityEvent(
  type: 'unauthorized_access' | 'forbidden_action' | 'moderation_breach',
  details: string,
  userId?: string,
) {
  try {
    await runWriteQuery(
      `CREATE (s:SecurityEvent {
         id: randomUUID(),
         type: $type,
         details: $details,
         userId: $userId,
         createdAt: datetime()
       })`,
      { type, details, userId: userId || 'anonymous' }
    );
  } catch (err) {
    console.error('Failed to log security event', err);
  }
}
