'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [userName, setUserName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success && data.resetUrl) {
        setResetUrl(data.resetUrl);
        setUserName(data.userName || '');
        toast.success('Reset link generated!');
      } else if (data.success) {
        toast.info('If an account exists with that email, instructions have been sent.');
      } else {
        toast.error(data.error || 'Something went wrong');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(resetUrl);
    toast.success('Reset link copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050508] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-r from-indigo-600/30 via-violet-600/30 to-fuchsia-600/30 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-indigo-600/20 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-white/20">
              V
            </div>
            <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
              Vertex
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {!resetUrl ? (
            <>
              <h1 className="text-2xl font-bold mb-2 text-white/90">Forgot password?</h1>
              <p className="text-slate-400 text-sm mb-7">Enter your email and we'll generate a secure reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-slate-400 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl bg-white/5 border-white/10 focus:border-indigo-500/60 transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 mt-2 transition-all"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Generate Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Reset link ready!</h2>
                <p className="text-slate-400 text-sm">
                  {userName ? `Hey ${userName}, click` : 'Click'} the link below to reset your password. It expires in <span className="text-amber-400 font-semibold">15 minutes</span>.
                </p>
              </div>

              {/* Reset link display */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-left">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1.5">Secure Reset Link</p>
                <p className="text-xs text-indigo-300 break-all font-mono leading-relaxed">{resetUrl}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyLink}
                  variant="outline"
                  className="flex-1 h-10 rounded-xl border-white/10 text-slate-300 hover:bg-white/5 text-sm"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Link
                </Button>
                <Button
                  asChild
                  className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
                >
                  <Link href={resetUrl.replace(/^https?:\/\/[^/]+/, '')}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open Link
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-8">
            Remember your password?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
