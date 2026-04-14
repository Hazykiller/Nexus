'use client';

import { useCallback, useEffect, useState } from 'react';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePost } from '@/components/feed/CreatePost';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { Post } from '@/types';
import Link from 'next/link';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState('0');
  const [hasMore, setHasMore] = useState(true);
  const [selectedAura, setSelectedAura] = useState<string | null>(null);

  const loadPosts = useCallback(async (c: string = '0', append = false, aura: string | null = selectedAura) => {
    try {
      if (append) setLoadingMore(true);
      const res = await fetch(`/api/posts?type=home&cursor=${c}${aura ? `&aura=${aura}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => (append ? [...prev, ...data.data] : data.data));
        setHasMore(data.hasMore);
        if (data.nextCursor) setCursor(data.nextCursor);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // When aura changes, reset posts and load from scratch
    setPosts([]);
    setLoading(true);
    setCursor('0');
    loadPosts('0', false, selectedAura);
  }, [loadPosts, selectedAura]);

  const auras = [
    { id: 'chill', icon: '☕', label: 'Chill', color: 'text-blue-300', bg: 'hover:bg-blue-500/10 hover:border-blue-500/30', active: 'bg-blue-500/20 border-blue-500/50 text-blue-200' },
    { id: 'hype', icon: '🚀', label: 'Hype', color: 'text-orange-400', bg: 'hover:bg-orange-500/10 hover:border-orange-500/30', active: 'bg-orange-500/20 border-orange-500/50 text-orange-200' },
    { id: 'deep', icon: '🧠', label: 'Deep', color: 'text-purple-400', bg: 'hover:bg-purple-500/10 hover:border-purple-500/30', active: 'bg-purple-500/20 border-purple-500/50 text-purple-200' },
    { id: 'sparkle', icon: '✨', label: 'Sparkle', color: 'text-amber-300', bg: 'hover:bg-amber-500/10 hover:border-amber-500/30', active: 'bg-amber-500/20 border-amber-500/50 text-amber-200' },
    { id: 'heartbreak', icon: '💔', label: 'Heartbreak', color: 'text-red-500', bg: 'hover:bg-red-500/10 hover:border-red-500/30', active: 'bg-red-500/20 border-red-500/50 text-red-200' },
  ];

  return (
    <div className="max-w-[600px] mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">
        <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Home Feed</span>
      </h1>

      {/* Aura Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedAura(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
            selectedAura === null 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'border-transparent text-muted-foreground hover:bg-white/5'
          }`}
        >
          All
        </button>
        {auras.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedAura(a.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
              selectedAura === a.id ? a.active : `border-border/50 text-muted-foreground ${a.bg}`
            }`}
          >
            <span>{a.icon}</span>
            <span className={selectedAura === a.id ? a.color : ''}>{a.label}</span>
          </button>
        ))}
      </div>

      <CreatePost onPostCreated={() => loadPosts()} />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={() => loadPosts()} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => loadPosts(cursor, true, selectedAura)}
              disabled={loadingMore}
              className="w-full py-3 text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl mb-2">📡</div>
          <p className="text-lg font-semibold">Your feed is empty</p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Start by creating a post above, or{' '}
            <Link href="/explore" className="text-cyan-400 hover:underline">
              explore
            </Link>{' '}
            and follow some users to see their content here.
          </p>
        </div>
      )}
    </div>
  );
}
