'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        toast.error(data.error || 'Reset failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Invalid Reset Link</h2>
        <p className="text-slate-400 text-sm">This link is missing required parameters. Please request a new reset link.</p>
        <Button asChild className="rounded-xl bg-indigo-600 hover:bg-indigo-500">
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto animate-in zoom-in">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Password Reset Complete!</h2>
        <p className="text-slate-400 text-sm">Your password has been updated. Redirecting to login...</p>
        <div className="flex justify-center">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-2 text-white/90">Reset your password</h1>
      <p className="text-slate-400 text-sm mb-7">Enter your new password below.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-xs text-slate-400 font-medium">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 rounded-xl pr-10 bg-white/5 border-white/10 focus:border-indigo-500/60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs text-slate-400 font-medium">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 rounded-xl bg-white/5 border-white/10 focus:border-indigo-500/60 transition-colors"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
          )}
        </div>

        {/* Password strength indicator */}
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  newPassword.length >= i * 3
                    ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-emerald-500' : 'bg-cyan-500'
                    : 'bg-white/5'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            {newPassword.length === 0 ? '' : newPassword.length < 6 ? 'Too weak' : newPassword.length < 10 ? 'Fair' : newPassword.length < 14 ? 'Strong' : 'Excellent'}
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
          className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 mt-2 transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
          Reset Password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050508] relative overflow-hidden">
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
          <Suspense fallback={<div className="text-center text-slate-400 py-8">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>

          <p className="text-center text-sm text-slate-500 mt-8">
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
