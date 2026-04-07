'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
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
        if (data.authUrl) setAuthUrl(data.authUrl);
        toast.success('Registration skeleton created. Please bind your authenticator.');
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
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-bold mb-1 text-center text-white">Secure your account</h1>
            <p className="text-slate-400 text-sm mb-6 text-center">
              Scan the QR Code with <strong>Google Authenticator</strong><br/>
              and enter the 6-digit pin generated for <span className="text-indigo-400">{form.email}</span>.
            </p>

            {authUrl && (
              <div className="flex justify-center mb-6 bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <QRCodeSVG value={authUrl} size={160} />
              </div>
            )}

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
      {/* Futuristic Moving Gradient Mesh Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-r from-indigo-600/30 via-violet-600/30 to-fuchsia-600/30 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-indigo-600/20 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        {/* Subtle glowing grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-white/20 backdrop-blur-md">V</div>
            <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">Vertex</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h1 className="text-2xl font-bold mb-2 text-white/90">Create your account</h1>
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
