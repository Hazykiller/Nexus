'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, AlertTriangle, UserX, UserCheck, Bot, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FlaggedPost {
  postId: string;
  content: string;
  createdAt: string;
  reason: string;
  username: string;
  riskScore: number;
}

interface RiskyUser {
  userId: string;
  username: string;
  name: string;
  riskScore: number;
}

export default function ModerationDashboard() {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningManual, setRunningManual] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, usersRes] = await Promise.all([
        fetch('/api/admin/moderation?action=flagged-posts'),
        fetch('/api/admin/moderation?action=risky-users')
      ]);
      const postsData = await postsRes.json();
      const usersData = await usersRes.json();
      
      if (postsData.success) setFlaggedPosts(postsData.data);
      if (usersData.success) setRiskyUsers(usersData.data);
    } catch (e) {
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const handlePurgePost = async (postId: string) => {
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      if (res.ok) {
        toast.success('Post securely purged from database');
        setFlaggedPosts(prev => prev.filter(p => p.postId !== postId));
      }
    } catch {
      toast.error('Failed to purge post');
    }
  };

  const triggerManualModeration = async () => {
    setRunningManual(true);
    try {
      const res = await fetch('/api/cron/moderation');
      const data = await res.json();
      if (data.success) {
         toast.success('AI Moderation cycle complete. Refreshing data...');
         fetchData();
      } else {
         toast.error(data.error || 'Failed to run moderation');
      }
    } catch (e) {
      toast.error('Network error triggering moderation');
    } finally {
      setRunningManual(false);
    }
  };

  const getRiskLabel = (score: number) => {
    if (score >= 3) return <span className="text-red-500 font-bold flex items-center gap-1"><UserX className="w-4 h-4"/> Suspended (Level 3)</span>;
    if (score >= 2) return <span className="text-orange-500 font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> High Risk (Level 2)</span>;
    if (score >= 1) return <span className="text-yellow-500 font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Warned (Level 1)</span>;
    return <span className="text-emerald-500 font-bold flex items-center gap-1"><UserCheck className="w-4 h-4"/> Safe (Level 0)</span>;
  };

  if (loading) return <div className="p-8 text-white">Engaging Security Console...</div>;

  return (
    <div className="p-3 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-8 gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
          <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">Auto-Moderation AI</h1>
        </div>
        <button
          onClick={triggerManualModeration}
          disabled={runningManual}
          className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 text-sm"
        >
          {runningManual ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
          {runningManual ? 'Scanning Network...' : 'Run Scan Now'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risky Users Panel */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Active Threat Actors</h2>
          <div className="space-y-4">
            {riskyUsers.length === 0 ? (
              <p className="text-gray-500 text-sm">No risky users detected in the network.</p>
            ) : (
              riskyUsers.map(u => (
                <div key={u.userId} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-white font-semibold">{u.name}</p>
                    <p className="text-gray-400 text-sm">@{u.username}</p>
                  </div>
                  <div>
                    {getRiskLabel(u.riskScore)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Flagged Posts Panel */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">AI-Intercepted Content</h2>
          <div className="space-y-4 relative">
            {flaggedPosts.length === 0 ? (
              <p className="text-gray-500 text-sm">Network stream is currently clean.</p>
            ) : (
              flaggedPosts.map(p => (
                <div key={p.postId} className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl relative group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-red-400 font-bold text-sm tracking-wide">@{p.username}</p>
                    <button 
                      onClick={() => handlePurgePost(p.postId)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-1 bg-black/50 rounded-lg absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      title="Permanently Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">"{p.content}"</p>
                  <div className="p-2 border-l-2 border-red-500 bg-red-500/10 text-red-300 text-xs font-mono">
                    {p.reason}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
