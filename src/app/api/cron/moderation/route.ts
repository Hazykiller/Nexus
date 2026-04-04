import { NextRequest, NextResponse } from 'next/server';
import { runQuery, runWriteQuery } from '@/lib/neo4j';
import { runGuardBot } from '@/lib/security/guardbot';
import { logSecurityEvent } from '@/lib/security/security';

/**
 * Vertex GuardBot — Scheduled Cron Sweep Endpoint.
 *
 * Scans all posts created in the last 24 hours that haven't been moderated yet.
 * HIGH/CRITICAL posts are auto-deleted and logged.
 * MEDIUM posts are flagged for admin review.
 *
 * Protected by CRON_SECRET header (set in Vercel env vars).
 * Triggered by Vercel Cron — see vercel.json.
 *
 * On Hobby plan: runs once daily.
 * Can also be triggered manually by hitting GET /api/cron/moderation with Authorization header.
 */
export async function GET(req: NextRequest) {
  // Security: Only callable by Vercel Cron or with the secret header
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron attempt blocked' }, { status: 401 });
  }

  const startTime = Date.now();
  let scanned = 0, deleted = 0, flagged = 0;

  try {
    // Get all posts from last 24h that haven't been reviewed
    const posts = await runQuery(`
      MATCH (u:User)-[:CREATED]->(p:Post)
      WHERE p.createdAt > datetime() - duration({hours: 24})
        AND (p.guardScanned IS NULL OR p.guardScanned = false)
        AND p.content IS NOT NULL AND p.content <> ''
      RETURN p.id AS id, p.content AS content, u.id AS userId
      LIMIT 500
    `);

    for (const row of posts as Array<{ id: string; content: string; userId: string }>) {
      scanned++;
      const result = runGuardBot(row.content);

      if (result.shouldDelete) {
        // Auto-delete the post
        await runWriteQuery(
          `MATCH (p:Post {id: $postId}) DETACH DELETE p`,
          { postId: row.id }
        );

        await logSecurityEvent(
          'moderation_breach',
          `[GuardBot Cron] AUTO-DELETED ${result.severity} post ${row.id}: ${result.reason}`,
          row.userId
        );
        deleted++;
      } else if (result.shouldWarn) {
        // Flag for admin review
        await runWriteQuery(
          `MATCH (p:Post {id: $postId}) SET p.needsReview = true, p.reviewReason = $reason`,
          { postId: row.id, reason: result.reason }
        );

        await logSecurityEvent(
          'moderation_breach',
          `[GuardBot Cron] FLAGGED post ${row.id} for review: ${result.reason}`,
          row.userId
        );
        flagged++;
      }

      // Mark as scanned
      await runWriteQuery(
        `MATCH (p:Post {id: $postId}) SET p.guardScanned = true`,
        { postId: row.id }
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(`[GuardBot Cron] Sweep complete: ${scanned} scanned, ${deleted} deleted, ${flagged} flagged in ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      elapsed: `${elapsed}ms`,
      stats: { scanned, deleted, flagged },
    });
  } catch (error) {
    console.error('[GuardBot Cron] Sweep failed:', error);
    return NextResponse.json({ error: 'Cron sweep failed' }, { status: 500 });
  }
}
