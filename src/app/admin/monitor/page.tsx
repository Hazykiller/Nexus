'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Server, Database, Shield, Cloud, 
  RefreshCw, AlertTriangle, CheckCircle, TrendingUp,
  Cpu, MemoryStick, Clock, Wifi, Globe
} from 'lucide-react';

interface MonitorData {
  timestamp: string;
  responseTimeMs: number;
  system: {
    uptimeSeconds: number;
    uptimeFormatted: string;
    memoryUsedMB: number;
    memoryTotalMB: number;
    memUsagePercent: number;
    cpuCount: number;
  };
  database: {
    status: string;
    latencyMs: number;
    stats: { users: number; posts: number; securityEvents: number };
  };
  security: {
    recentAlerts: Array<{ type: string; details: string; timestamp: string }>;
    alertCount24h: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  cloud: {
    provider: string;
    region: string;
    deploymentUrl: string;
    nodeVersion: string;
    platform: string;
    environment: string;
  };
}

const THREAT_COLORS: Record<string, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-red-400',
};

const THREAT_BG: Record<string, string> = {
  LOW: 'border-emerald-500/30 bg-emerald-500/5',
  MEDIUM: 'border-amber-500/30 bg-amber-500/5',
  HIGH: 'border-red-500/30 bg-red-500/10',
};

export default function CloudMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [history, setHistory] = useState<number[]>([]);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/monitor');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setHistory(prev => [...prev.slice(-19), json.responseTimeMs]);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error('Monitor fetch error', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  const threatLevel = data?.security.threatLevel ?? 'LOW';

  return (
    <div className="min-h-screen bg-[#050508] text-white p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Cloud Monitoring
            </h1>
          </div>
          <p className="text-gray-500 text-xs md:text-sm ml-12 hidden sm:block">
            Real-time performance, logging & tracing — Vercel Edge + Neo4j AuraDB
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh 
                ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' 
                : 'border-white/10 text-gray-400 bg-white/5'
            }`}
          >
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
          <button
            onClick={fetchMetrics}
            disabled={isLoading}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Last refresh */}
      <p className="text-xs text-gray-600">
        Last updated: {lastRefresh.toLocaleTimeString()} &nbsp;·&nbsp; Auto-refresh every 15s
      </p>

      {/* Response Time Sparkline */}
      {history.length > 1 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Activity className="w-4 h-4 text-cyan-400" />
              API Response Time (last {history.length} probes)
            </div>
            <span className="text-cyan-400 font-mono text-sm font-bold">
              {history[history.length - 1]}ms
            </span>
          </div>
          <div className="flex items-end gap-1 h-16">
            {history.map((v, i) => {
              const max = Math.max(...history, 1);
              const pct = (v / max) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-cyan-500 to-blue-500 opacity-80 transition-all"
                  style={{ height: `${Math.max(pct, 4)}%` }}
                  title={`${v}ms`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Uptime */}
        <MetricCard
          icon={<Clock className="w-5 h-5 text-indigo-400" />}
          label="Uptime"
          value={data?.system.uptimeFormatted ?? '—'}
          sub="Server runtime"
          color="indigo"
        />
        {/* Memory */}
        <MetricCard
          icon={<MemoryStick className="w-5 h-5 text-violet-400" />}
          label="Memory"
          value={`${data?.system.memUsagePercent ?? 0}%`}
          sub={`${data?.system.memoryUsedMB ?? 0} / ${data?.system.memoryTotalMB ?? 0} MB`}
          color="violet"
        />
        {/* DB Latency */}
        <MetricCard
          icon={<Database className="w-5 h-5 text-emerald-400" />}
          label="DB Latency"
          value={`${data?.database.latencyMs ?? 0}ms`}
          sub="Neo4j AuraDB"
          color="emerald"
        />
        {/* CPU Cores */}
        <MetricCard
          icon={<Cpu className="w-5 h-5 text-amber-400" />}
          label="CPU Cores"
          value={String(data?.system.cpuCount ?? '—')}
          sub={data?.cloud.environment ?? 'loading...'}
          color="amber"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cloud Environment */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">Cloud Environment</span>
          </div>
          {data ? (
            <div className="space-y-3 text-sm">
              <InfoRow label="Provider" value={data.cloud.provider} />
              <InfoRow label="Region" value={data.cloud.region} />
              <InfoRow label="Node.js" value={data.cloud.nodeVersion} />
              <InfoRow label="Platform" value={data.cloud.platform} />
              <InfoRow label="Deployment" value={data.cloud.deploymentUrl} truncate />
            </div>
          ) : (
            <Skeleton />
          )}
        </div>

        {/* Database Stats */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">Database Health</span>
            </div>
            {data && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> {data.database.status}
              </span>
            )}
          </div>
          {data ? (
            <div className="space-y-3">
              <StatBar label="Users" value={data.database.stats.users} max={100} color="cyan" />
              <StatBar label="Posts" value={data.database.stats.posts} max={500} color="violet" />
              <StatBar label="Security Events" value={data.database.stats.securityEvents} max={50} color="red" />
              <InfoRow label="Query Latency" value={`${data.database.latencyMs}ms`} />
            </div>
          ) : (
            <Skeleton />
          )}
        </div>

        {/* Security Telemetry */}
        <div className={`rounded-2xl border p-5 space-y-4 ${THREAT_BG[threatLevel]}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-gray-200 uppercase tracking-wider">Security Telemetry</span>
            </div>
            {data && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${THREAT_COLORS[threatLevel]} border-current/30 bg-current/10`}>
                {threatLevel} RISK
              </span>
            )}
          </div>
          {data ? (
            <div className="space-y-3">
              <InfoRow label="Alerts (24h)" value={String(data.security.alertCount24h)} />
              <div className="space-y-2 mt-2">
                {data.security.recentAlerts.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No alerts in the last 24 hours ✓</p>
                ) : (
                  data.security.recentAlerts.slice(0, 4).map((a, i) => (
                    <div key={i} className="rounded-lg bg-white/5 border border-white/5 p-2 text-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="font-semibold text-amber-300">{a.type}</span>
                      </div>
                      <p className="text-gray-400 truncate">{a.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <Skeleton />
          )}
        </div>
      </div>

      {/* Footer Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-600 pt-4 border-t border-white/5">
        <Wifi className="w-3.5 h-3.5" />
        <span>Vertex Cloud Monitoring — Experiment #9: Cloud Monitoring & Performance Optimization</span>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function MetricCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span></div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );
}

function InfoRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-200 font-medium text-right ${truncate ? 'truncate max-w-[140px]' : ''}`}>{value}</span>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500',
    violet: 'bg-violet-500',
    red: 'bg-red-500',
  };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-200 font-semibold">{value}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-3 bg-white/5 rounded-full" style={{ width: `${60 + i * 10}%` }} />
      ))}
    </div>
  );
}
