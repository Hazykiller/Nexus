'use client';

import Link from 'next/link';
import { Menu, Settings, LogOut, ShieldAlert, Layers, Bot, Ghost } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

export function MobileHeader() {
  const { user } = useAuth();

  return (
    <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card/95 backdrop-blur z-40 sticky top-0">
      <Link href="/feed" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow shadow-cyan-500/20">
          V
        </div>
        <span className="font-bold text-lg text-foreground tracking-tight">Vertex</span>
      </Link>

      <Sheet>
        <SheetTrigger className="p-2 -mr-2 text-muted-foreground hover:text-foreground active:scale-95 transition-transform">
          <Menu className="w-6 h-6" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[80vw] sm:w-[300px] border-border bg-background p-0 flex flex-col">
          <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
          <SheetDescription className="sr-only">Access extended navigation links like AI Chat and Admin Console.</SheetDescription>
          
          <div className="p-6 pb-2 border-b border-border">
             <Link href="/feed" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/25">
                  V
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">Vertex</span>
             </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <Link href="/chatbot" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span className="font-medium">AI Chat Assistant</span>
            </Link>
            <Link href="/constellation" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span className="font-medium">Constellation</span>
            </Link>
            <Link href="/confessions" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Ghost className="w-5 h-5 text-violet-400" />
              <span className="font-medium">Confessions</span>
            </Link>

            {user?.isAdmin && (
              <div className="pt-4 mt-4 border-t border-border/50">
                <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin Controls</div>
                <Link href="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="font-medium">Admin Dashboard</span>
                </Link>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border mt-auto space-y-2">
            <Link href={`/profile/${user?.username}/settings`} className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
