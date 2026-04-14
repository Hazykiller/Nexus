'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: string;
  details: string;
  userId: string;
  createdAt: string;
}

const SEVERITY_COLORS: Record<string, { badge: string; dot: string }> = {
  forbidden_action: { badge: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
  moderation_breach: { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  unauthorized_access: { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
};

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/security-events');
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchEvents, 10000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchEvents]);

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
  const guardBotEvents = events.filter(e => e.details.includes('GuardBot'));

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-400" /> Security Log
          </h1>
          <p className="text-gray-400 text-sm mt-1">Live audit trail of all security events</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-gray-400 bg-white/5'
            }`}
          >
            {autoRefresh ? '● Live (10s)' : '○ Paused'}
          </button>
          <button onClick={fetchEvents} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Forbidden Actions</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{events.filter(e => e.type === 'forbidden_action').length}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">GuardBot Actions</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{guardBotEvents.length}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Events</span>
          </div>
          <p className="text-2xl font-bold text-indigo-400">{events.length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
        {['all', 'forbidden_action', 'moderation_breach', 'unauthorized_access'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === f ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {f === 'all' ? 'All Events' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Events feed */}
      <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-500 text-sm">Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">No events found ✓ Platform is clean</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(event => {
              const colors = SEVERITY_COLORS[event.type] || SEVERITY_COLORS.forbidden_action;
              const isGuardBot = event.details.includes('GuardBot');
              return (
                <div key={event.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-all">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                        {event.type.replace('_', ' ')}
                      </span>
                      {isGuardBot && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">
                          🤖 GuardBot
                        </span>
                      )}
                      <span className="text-xs text-gray-600">
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : '—'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{event.details}</p>
                    {event.userId && event.userId !== 'anonymous' && (
                      <p className="text-xs text-gray-600 mt-0.5">User: {event.userId}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
