'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Compass, PlusSquare, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CreatePost } from '@/components/feed/CreatePost';

const items = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '#create', label: 'Create', icon: PlusSquare },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User, dynamic: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const href = item.dynamic ? `/profile/${user?.username || ''}` : item.href;
          const isActive = pathname === href || (item.href !== '#create' && pathname.startsWith(href + '/'));
          const isCreate = item.href === '#create';

          if (isCreate) {
            return (
              <button
                key={item.href}
                onClick={() => setIsCreateOpen(true)}
                className="flex flex-col items-center gap-0.5 p-2 min-w-[56px]"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 cursor-pointer">
                  <PlusSquare className="w-5 h-5" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors min-w-[56px]',
                isActive ? 'text-cyan-400' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-cyan-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 border-none bg-transparent shadow-none" showCloseButton={false}>
        <CreatePost onPostCreated={() => setIsCreateOpen(false)} />
      </DialogContent>
    </Dialog>
    </>
  );
}
