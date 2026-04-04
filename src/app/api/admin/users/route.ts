import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery, runWriteQuery } from '@/lib/neo4j';
import { decryptAtRest } from '@/lib/security/dbEncryption';
import { logSecurityEvent } from '@/lib/security/security';
import bcrypt from 'bcryptjs';

/** Vertex Admin — User Management API */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as Record<string, unknown>)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const results = await runQuery(`
    MATCH (u:User)
    WHERE $search = '' OR u.username CONTAINS $search OR u.name CONTAINS $search
    OPTIONAL MATCH (u)-[:CREATED]->(p:Post)
    RETURN u.id AS id,
           u.username AS username,
           u.name AS name,
           u.email AS email,
           u.avatar AS avatar,
           u.verified AS verified,
           u.isAdmin AS isAdmin,
           u.banned AS banned,
           u.isRestricted AS isRestricted,
           u.createdAt AS createdAt,
           COUNT(p) AS postCount
    ORDER BY u.createdAt DESC
    LIMIT 100
  `, { search });

  const users = (results as Record<string, unknown>[]).map(u => ({
    ...u,
    email: u.email ? (() => { try { return decryptAtRest(u.email as string); } catch { return '***'; } })() : '',
  }));

  return NextResponse.json({ success: true, data: users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const adminId = (session?.user as Record<string, unknown>)?.id as string;
  if (!(session?.user as Record<string, unknown>)?.isAdmin) {
    await logSecurityEvent('forbidden_action', 'Non-admin attempted user management action', adminId);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { action, targetUserId } = await req.json();

  if (!action || !targetUserId) {
    return NextResponse.json({ error: 'action and targetUserId required' }, { status: 400 });
  }

  // Prevent self-targeting
  if (targetUserId === adminId) {
    return NextResponse.json({ error: 'Cannot perform actions on your own account' }, { status: 400 });
  }

  let cypher = '';
  let logMessage = '';

  switch (action) {
    case 'promote_admin':
      cypher = `MATCH (u:User {id: $targetUserId}) SET u.isAdmin = true`;
      logMessage = `Promoted user ${targetUserId} to Admin`;
      break;
    case 'demote_admin':
      cypher = `MATCH (u:User {id: $targetUserId}) SET u.isAdmin = false`;
      logMessage = `Demoted user ${targetUserId} from Admin`;
      break;
    case 'force_verify':
      cypher = `MATCH (u:User {id: $targetUserId}) SET u.verified = true, u.otp = null, u.otpExpiresAt = null`;
      logMessage = `Force-verified user ${targetUserId}`;
      break;
    case 'ban':
      cypher = `MATCH (u:User {id: $targetUserId}) SET u.banned = true`;
      logMessage = `Banned user ${targetUserId}`;
      break;
    case 'unban':
      cypher = `MATCH (u:User {id: $targetUserId}) SET u.banned = false`;
      logMessage = `Unbanned user ${targetUserId}`;
      break;
    case 'delete_user':
      cypher = `MATCH (u:User {id: $targetUserId}) DETACH DELETE u`;
      logMessage = `Permanently deleted user ${targetUserId}`;
      break;
    case 'reset_password':
      const tempPw = Math.random().toString(36).slice(-8).toUpperCase() + '!7';
      const hashed = await bcrypt.hash(tempPw, 12);
      await runWriteQuery(`MATCH (u:User {id: $targetUserId}) SET u.password = $hashed, u.mustChangePassword = true`, { targetUserId, hashed });
      await logSecurityEvent('moderation_breach', logMessage || `Admin reset password for ${targetUserId}`, adminId);
      return NextResponse.json({ success: true, tempPassword: tempPw });
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  await runWriteQuery(cypher, { targetUserId });
  await logSecurityEvent('moderation_breach', logMessage, adminId);

  return NextResponse.json({ success: true, message: logMessage });
}
