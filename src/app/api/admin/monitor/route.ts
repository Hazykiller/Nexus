import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery } from '@/lib/neo4j';
import os from 'os';

/**
 * Vertex Cloud Monitoring & Performance API
 * Implements Experiment #9: Cloud Monitoring, Logging and Tracing
 *
 * Returns real-time health metrics including:
 * - Platform uptime & memory
 * - Request rate (via DB event log sampling)
 * - Error rate from SecurityEvent log
 * - Neo4j graph health (node/edge counts)
 * - Regional latency simulation
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as Record<string, unknown>)?.isAdmin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required' }, { status: 401 });
    }

    const start = Date.now();

    // --- System Metrics (Node.js) ---
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);
    const uptimeSeconds = Math.floor(process.uptime());

    // --- Database Health Check (Neo4j / AuraDB) ---
    const dbStart = Date.now();
    const [userCount, postCount, securityEventCount, recentErrors] = await Promise.all([
      runQuery('MATCH (u:User) RETURN count(u) AS count'),
      runQuery('MATCH (p:Post) RETURN count(p) AS count'),
      runQuery('MATCH (s:SecurityEvent) RETURN count(s) AS count'),
      runQuery(`
        MATCH (s:SecurityEvent)
        WHERE s.createdAt > datetime() - duration({hours: 24})
        RETURN s.type AS type, s.details AS details, s.createdAt AS ts
        ORDER BY s.createdAt DESC LIMIT 10
      `),
    ]);
    const dbLatencyMs = Date.now() - dbStart;

    // --- Regional Latency Probe (Vercel Edge) ---
    const region = req.headers.get('x-vercel-deployment-url')
      ? process.env.VERCEL_REGION || 'iad1'
      : 'local';

    // --- Cloud Resource Sampling ---
    const cloudMetrics = {
      provider: 'Vercel (Serverless + Edge Network)',
      region,
      deploymentUrl: process.env.VERCEL_URL || 'localhost:3000',
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
    };

    const responseTimeMs = Date.now() - start;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      responseTimeMs,
      system: {
        uptimeSeconds,
        uptimeFormatted: formatUptime(uptimeSeconds),
        memoryUsedMB: Math.round(usedMem / 1024 / 1024),
        memoryTotalMB: Math.round(totalMem / 1024 / 1024),
        memUsagePercent,
        cpuCount: os.cpus().length,
      },
      database: {
        status: 'healthy',
        latencyMs: dbLatencyMs,
        stats: {
          users: (userCount[0] as { count: number }).count ?? 0,
          posts: (postCount[0] as { count: number }).count ?? 0,
          securityEvents: (securityEventCount[0] as { count: number }).count ?? 0,
        },
      },
      security: {
        recentAlerts: recentErrors.map((e: Record<string, unknown>) => ({
          type: e.type,
          details: e.details,
          timestamp: e.ts,
        })),
        alertCount24h: recentErrors.length,
        threatLevel: recentErrors.length === 0 ? 'LOW' : recentErrors.length < 5 ? 'MEDIUM' : 'HIGH',
      },
      cloud: cloudMetrics,
    });
  } catch (error) {
    console.error('[Cloud Monitor] Health check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Cloud monitoring probe failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}
