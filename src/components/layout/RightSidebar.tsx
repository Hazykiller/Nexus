'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Hash, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User, Hashtag } from '@/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function RightSidebar() {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followingLoading, setFollowingLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const usersRes = await fetch('/api/recommendations/users').then((r) => r.json());
        setSuggestedUsers(usersRes.data?.slice(0, 5) || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleFollow = async (userId: string) => {
    setFollowingLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      if (res.ok) {
        setFollowingIds((prev) => new Set(prev).add(userId));
        toast.success('Following!');
        // Remove from suggestions after a short delay for visual feedback
        setTimeout(() => {
          setSuggestedUsers((prev) => prev.filter((u) => u.id !== userId));
          // Refresh suggestions
          fetch('/api/recommendations/users')
            .then((r) => r.json())
            .then((data) => {
              const newUsers = (data.data || []).filter(
                (u: User) => !followingIds.has(u.id) && u.id !== userId
              );
              setSuggestedUsers(newUsers.slice(0, 5));
            })
            .catch(() => {});
        }, 800);
      }
    } catch {
      toast.error('Failed to follow');
    } finally {
      setFollowingLoading(null);
    }
  };

  return (
    <aside className="hidden xl:block w-[320px] shrink-0">
      <div className="fixed w-[300px] top-4 space-y-5 pr-4">
        {/* Suggested Users */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-sm">Suggested for you</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-24 mb-1.5" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length > 0 ? (
            <div className="space-y-3">
              {suggestedUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 group">
                  <Link href={`/profile/${u.username}`}>
                    <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-cyan-500/30 transition-all">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white text-xs">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${u.username}`} className="text-sm font-medium hover:underline truncate block">
                      {u.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                  </div>
                  <Button
                    variant={followingIds.has(u.id) ? 'secondary' : 'outline'}
                    size="sm"
                    className="text-xs px-3 h-7 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={() => handleFollow(u.id)}
                    disabled={followingLoading === u.id || followingIds.has(u.id)}
                  >
                    {followingLoading === u.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : followingIds.has(u.id) ? (
                      'Following'
                    ) : (
                      'Follow'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No suggestions yet</p>
          )}
        </div>



        {/* Footer */}
        <div className="px-1 text-[11px] text-muted-foreground leading-relaxed">
          <p>© 2024 Vertex. Built with Next.js & Neo4j</p>
        </div>
      </div>
    </aside>
  );
}
