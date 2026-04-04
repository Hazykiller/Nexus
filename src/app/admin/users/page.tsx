'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, ShieldCheck, ShieldOff, UserCheck, Ban, Trash2,
  KeyRound, RefreshCw, Crown, Users, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  verified: boolean;
  isAdmin: boolean;
  banned?: boolean;
  isRestricted?: boolean;
  createdAt: string;
  postCount: number;
}

const ACTION_CONFIRM: Record<string, string> = {
  delete_user: 'DELETE this user permanently? This cannot be undone.',
  ban: 'BAN this user?',
  promote_admin: 'PROMOTE this user to Admin?',
  demote_admin: 'DEMOTE this admin?',
  reset_password: 'RESET PASSWORD for this user?',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionUser, setActionUser] = useState<{ id: string; action: string; name: string } | null>(null);
  const [isActing, setIsActing] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const performAction = async () => {
    if (!actionUser) return;
    setIsActing(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionUser.action, targetUserId: actionUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Action completed');
        if (data.tempPassword) toast.info(`Temp password: ${data.tempPassword}`, { duration: 15000 });
        await fetchUsers();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } finally {
      setIsActing(false);
      setActionUser(null);
    }
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> User Manager
          </h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} users loaded</p>
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by username or name..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      {/* User Table */}
      <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0">
          {/* Header row */}
          <div className="col-span-5 grid grid-cols-[auto_1fr_auto_auto_auto] px-4 py-3 bg-white/5 border-b border-white/8 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="w-36">User</div>
            <div>Details</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-20 text-center">Posts</div>
            <div className="w-48 text-right">Actions</div>
          </div>

          {isLoading ? (
            <div className="col-span-5 py-16 text-center text-gray-500 text-sm">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="col-span-5 py-16 text-center text-gray-500 text-sm">No users found</div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                className="col-span-5 grid grid-cols-[auto_1fr_auto_auto_auto] px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-all items-center"
              >
                {/* Avatar + name */}
                <div className="w-36 flex items-center gap-2.5">
                  <div className="relative">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.isAdmin && (
                      <Crown className="absolute -top-1 -right-1 w-3 h-3 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{user.email}</p>
                  {user.isRestricted && (
                    <span className="text-xs text-amber-500">⚠ Restricted (13-18)</span>
                  )}
                </div>

                {/* Status badges */}
                <div className="w-24 flex flex-wrap gap-1 justify-center">
                  {user.verified ? (
                    <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-2.5 h-2.5" /> OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-2.5 h-2.5" /> Unverified
                    </span>
                  )}
                  {user.banned && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Banned</span>
                  )}
                </div>

                {/* Post count */}
                <div className="w-20 text-center">
                  <span className="text-sm font-semibold text-gray-300">{user.postCount}</span>
                </div>

                {/* Actions */}
                <div className="w-48 flex items-center justify-end gap-1 flex-wrap">
                  {!user.verified && (
                    <ActionBtn icon={UserCheck} label="Verify" color="emerald" onClick={() => setActionUser({ id: user.id, action: 'force_verify', name: user.name })} />
                  )}
                  {user.isAdmin ? (
                    <ActionBtn icon={ShieldOff} label="Demote" color="amber" onClick={() => setActionUser({ id: user.id, action: 'demote_admin', name: user.name })} />
                  ) : (
                    <ActionBtn icon={ShieldCheck} label="Promote" color="indigo" onClick={() => setActionUser({ id: user.id, action: 'promote_admin', name: user.name })} />
                  )}
                  {user.banned ? (
                    <ActionBtn icon={CheckCircle} label="Unban" color="cyan" onClick={() => setActionUser({ id: user.id, action: 'unban', name: user.name })} />
                  ) : (
                    <ActionBtn icon={Ban} label="Ban" color="red" onClick={() => setActionUser({ id: user.id, action: 'ban', name: user.name })} />
                  )}
                  <ActionBtn icon={KeyRound} label="Reset PW" color="violet" onClick={() => setActionUser({ id: user.id, action: 'reset_password', name: user.name })} />
                  <ActionBtn icon={Trash2} label="Delete" color="red" onClick={() => setActionUser({ id: user.id, action: 'delete_user', name: user.name })} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {actionUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Confirm Admin Action</h2>
            <p className="text-gray-400 text-sm mb-1">
              {ACTION_CONFIRM[actionUser.action] || 'Confirm this action?'}
            </p>
            <p className="text-indigo-400 font-semibold text-sm mb-6">Target: {actionUser.name}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setActionUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={performAction}
                disabled={isActing}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all"
              >
                {isActing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
  const colorMap: Record<string, string> = {
    emerald: 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30',
    amber: 'hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30',
    indigo: 'hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30',
    red: 'hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30',
    cyan: 'hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30',
    violet: 'hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/30',
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-lg border border-transparent text-gray-500 transition-all ${colorMap[color]}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
