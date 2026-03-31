'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/types';

interface UserListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  userId: string;
  type: 'followers' | 'following';
}

export function UserListModal({ open, onOpenChange, title, userId, type }: UserListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setUsers([]);

    async function fetchUsers() {
      try {
        const res = await fetch(`/api/users/${userId}/${type}`);
        const data = await res.json();
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [open, userId, type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-1 py-2">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28 mb-1.5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : users.length > 0 ? (
              users.map((u) => (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <Avatar className="w-10 h-10 ring-2 ring-violet-500/20">
                    <AvatarImage src={u.avatar} alt={u.name} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
