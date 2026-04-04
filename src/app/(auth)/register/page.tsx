'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
  });

  const passwordsMatch = form.confirmPassword === '' || form.password === form.confirmPassword;
  const passwordStrong = form.password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          dob: form.dob,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsOtpSent(true);
        toast.success('Check your email — we sent you a 6-digit code.');
      } else {
        toast.error(data.error || 'Something went wrong. Try again.');
      }
    } catch {
      toast.error('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      });

      if (res.ok) {
        toast.success('Account verified! You can now sign in.');
        router.push('/login');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Wrong code. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Verification screen
  if (isOtpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#050508] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 animate-in slide-in-from-bottom-5 duration-500">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">V</div>
              <span className="text-xl font-bold text-white">Vertex</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 flex items-center justify-center text-indigo-400 mb-5 mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-bold mb-1 text-center text-white">Check your email</h1>
            <p className="text-slate-400 text-sm mb-6 text-center">
              We sent a 6-digit code to{' '}
              <span className="text-indigo-400 font-medium">{form.email}</span>
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="h-14 rounded-xl text-center text-3xl tracking-[12px] font-bold bg-white/5 border-white/10 focus:border-indigo-500"
              />

              <Button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify & Continue
              </Button>
            </form>

            <button
              onClick={() => setIsOtpSent(false)}
              className="w-full mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Wrong email? Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#050508] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">V</div>
            <span className="text-xl font-bold text-white">Vertex</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-7 shadow-2xl">
          <h1 className="text-2xl font-bold mb-1 text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mb-7">Join Vertex — it's free.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-slate-400 font-medium">Full Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-indigo-500/60 text-sm"
              />
            </div>

            {/* Username + DOB */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs text-slate-400 font-medium">Username</Label>
                <Input
                  id="username"
                  placeholder="@handle"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-indigo-500/60 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-xs text-slate-400 font-medium">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  required
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-indigo-500/60 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-slate-400 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-indigo-500/60 text-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-slate-400 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-10 rounded-xl pr-10 bg-white/5 border-white/10 focus:border-indigo-500/60 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className={`flex items-center gap-1.5 text-xs mt-1 ${passwordStrong ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {passwordStrong ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {passwordStrong ? 'Strong enough' : 'Too short (min 8 chars)'}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs text-slate-400 font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`h-10 rounded-xl pr-10 bg-white/5 text-sm transition-colors ${
                    form.confirmPassword && !passwordsMatch
                      ? 'border-red-500/50 focus:border-red-500'
                      : form.confirmPassword && passwordsMatch
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-white/10 focus:border-indigo-500/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirmPassword && (
                <div className={`flex items-center gap-1.5 text-xs mt-1 ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                  {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !passwordsMatch || !passwordStrong}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="hover:text-slate-400 underline underline-offset-2">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:text-slate-400 underline underline-offset-2">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
