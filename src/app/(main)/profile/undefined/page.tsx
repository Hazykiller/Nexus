'use client';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function SessionResetPage() {
  useEffect(() => {
    // If the user's cookie is outdated (missing username), this trap will catch
    // the '/profile/undefined' route, clear the bad cookie, and force them to login.
    setTimeout(() => {
      signOut({ callbackUrl: '/login' });
    }, 1500);
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      <span className="text-muted-foreground">Refreshing your secure session...</span>
    </div>
  );
}
