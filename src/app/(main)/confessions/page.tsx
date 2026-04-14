'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Ghost, Heart, Send, Loader2, Clock, RefreshCw, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface Confession {
  id: string;
  content: string;
  mood: string;
  likes: number;
  createdAt: string;
}

const MOODS = ['💭', '❤️', '😂', '😤', '😢', '🤯', '🔥', '✨'];

const GRADIENT_CLASSES = [
  'from-violet-500/10 to-fuchsia-500/10 border-violet-500/20',
  'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
  'from-rose-500/10 to-pink-500/10 border-rose-500/20',
  'from-amber-500/10 to-orange-500/10 border-amber-500/20',
  'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
  'from-indigo-500/10 to-purple-500/10 border-indigo-500/20',
];

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ConfessionsPage() {
  const { data: session } = useSession();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('💭');
  const [submitting, setSubmitting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const fetchConfessions = useCallback(async () => {
    try {
      const res = await fetch('/api/confessions');
      const data = await res.json();
      if (data.success) setConfessions(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConfessions(); }, [fetchConfessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), mood: selectedMood }),
      });
      const data = await res.json();
      if (data.success) {
        setConfessions((prev) => [data.data, ...prev]);
        setContent('');
        setSelectedMood('💭');
        toast.success('Confession posted anonymously');
      } else {
        toast.error(data.error || 'Failed to post');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    if (likedIds.has(id)) return;
    setLikedIds((prev) => new Set(prev).add(id));
    setConfessions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
    );
    try {
      await fetch('/api/confessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confessionId: id, action: 'like' }),
      });
    } catch { /* silent */ }
  };

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Ghost className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Confessions
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">Anonymous · Auto-deletes in 24h</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchConfessions} className="rounded-full text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Compose */}
      <Card className="rounded-2xl p-4 mb-6 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              ?
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="What's on your mind? Nobody will know it's you..."
              className="flex-1 bg-transparent resize-none border-none outline-none text-sm placeholder:text-muted-foreground/60 min-h-[60px]"
              rows={3}
            />
          </div>

          {/* Mood picker + Submit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110 ${
                    selectedMood === mood
                      ? 'bg-violet-500/20 ring-2 ring-violet-500/40 scale-110'
                      : 'hover:bg-muted'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{content.length}/500</span>
              <Button
                type="submit"
                disabled={!content.trim() || submitting}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 gap-1.5"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Confess
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Auto-delete notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 px-1">
        <Clock className="w-3.5 h-3.5" />
        <span>All confessions auto-delete after 24 hours. Your identity is never revealed.</span>
      </div>

      {/* Confessions feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
        </div>
      ) : confessions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Sparkles className="w-10 h-10 text-violet-400 mx-auto" />
          <p className="text-muted-foreground">No confessions yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {confessions.map((confession, i) => {
            const gradientClass = GRADIENT_CLASSES[i % GRADIENT_CLASSES.length];
            const isLiked = likedIds.has(confession.id);

            return (
              <Card
                key={confession.id}
                className={`rounded-2xl p-4 border bg-gradient-to-br ${gradientClass} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                    {confession.mood || '💭'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {confession.content}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Ghost className="w-3 h-3" /> Anonymous
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(confession.createdAt)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleLike(confession.id)}
                        disabled={isLiked}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${
                          isLiked
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${isLiked ? 'fill-rose-400' : ''}`} />
                        {confession.likes > 0 && <span>{confession.likes}</span>}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
