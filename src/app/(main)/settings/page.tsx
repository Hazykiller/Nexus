'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import {
  Moon, Sun, LogOut, Shield, Bell, Trash2,
  Monitor, Smartphone, Globe, Clock, MapPin, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface LoginSession {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

function parseUserAgent(ua: string): { device: string; browser: string; icon: React.ReactNode } {
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  const browser = /chrome/i.test(ua) ? 'Chrome'
    : /firefox/i.test(ua) ? 'Firefox'
    : /safari/i.test(ua) ? 'Safari'
    : /edge/i.test(ua) ? 'Edge'
    : 'Unknown';
  const os = /windows/i.test(ua) ? 'Windows'
    : /mac/i.test(ua) ? 'macOS'
    : /linux/i.test(ua) ? 'Linux'
    : /android/i.test(ua) ? 'Android'
    : /iphone|ipad/i.test(ua) ? 'iOS'
    : 'Unknown';

  return {
    device: `${os}`,
    browser,
    icon: isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />,
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      setSessionsLoading(true);
      try {
        const res = await fetch('/api/users/login-activity');
        const data = await res.json();
        if (data.success) setSessions(data.data || []);
      } catch { /* silently fail */ }
      finally { setSessionsLoading(false); }
    }
    loadSessions();
  }, []);

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!confirm('Are you sure? This action cannot be undone.')) return;
    try {
      await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      toast.success('Account deleted');
      signOut({ callbackUrl: '/' });
    } catch { toast.error('Failed to delete account'); }
  };

  return (
    <div className="max-w-[500px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Settings</span>
      </h1>

      <div className="space-y-4">
        {/* Appearance */}
        <Card className="rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-cyan-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            <Label className="font-semibold">Appearance</Label>
          </div>
          <div className="flex gap-2">
            <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" className="flex-1 rounded-xl" onClick={() => setTheme('light')}><Sun className="w-4 h-4 mr-1" />Light</Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" className="flex-1 rounded-xl" onClick={() => setTheme('dark')}><Moon className="w-4 h-4 mr-1" />Dark</Button>
          </div>
        </Card>

        {/* Privacy */}
        <Card className="rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <Label className="font-semibold">Privacy</Label>
          </div>
          <p className="text-sm text-muted-foreground">Manage who can see your profile and posts. Visit Edit Profile to change your privacy setting.</p>
        </Card>

        {/* Notifications */}
        <Card className="rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-cyan-400" />
            <Label className="font-semibold">Notification Preferences</Label>
          </div>
          <p className="text-sm text-muted-foreground">Notification preferences coming soon. You will be able to toggle individual notification types.</p>
        </Card>

        <Separator />

        {/* Login Activity */}
        <Card className="rounded-2xl p-4 border-cyan-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-cyan-400" />
            <Label className="font-semibold">Login Activity</Label>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Recent sign-in sessions on your account. If you see something suspicious, change your password immediately.</p>
          
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No login activity recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {sessions.map((session, index) => {
                const { device, browser, icon } = parseUserAgent(session.userAgent || '');
                const isFirst = index === 0;
                return (
                  <div key={session.id} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${isFirst ? 'bg-cyan-500/5 border border-cyan-500/20' : 'bg-muted/30 border border-transparent hover:bg-muted/50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isFirst ? 'bg-cyan-500/10 text-cyan-400' : 'bg-muted text-muted-foreground'}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{browser} · {device}</span>
                        {isFirst && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.ip || 'Unknown IP'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.createdAt ? new Date(session.createdAt).toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>
                    {!isFirst && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/users/login-activity', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ sessionId: session.id }),
                            });
                            if (res.ok) {
                              setSessions(prev => prev.filter(s => s.id !== session.id));
                              toast.success('Session revoked');
                            }
                          } catch { toast.error('Failed to revoke'); }
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all shrink-0 font-medium"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Separator />

        {/* Danger Zone */}
        <Card className="rounded-2xl p-4 border-red-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5 text-red-400" />
            <Label className="font-semibold text-red-400">Danger Zone</Label>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all data.</p>
          <Button variant="outline" size="sm" className="rounded-xl text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={handleDeleteAccount}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full rounded-xl gap-2"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="w-4 h-4" /> Log Out
        </Button>
      </div>
    </div>
  );
}
