'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

/**
 * Vertex 'Royal Premium' Login Page.
 * Features: Indigo-Violet gradients, and Luxury tech aesthetics.
 */
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        ...form,
        redirect: false,
      });

      if (res?.error) {
        toast.error('Invalid credentials. Access Denied.');
      } else {
        toast.success('Identity Verified. Access Granted.');
        router.push('/feed');
        router.refresh();
      }
    } catch (error) {
      toast.error('Authentication failure.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050508] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in slide-in-from-bottom-5 duration-500">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
              V
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent italic tracking-tight">
              Vertex
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl shadow-indigo-500/5">
          <div className="flex items-center gap-2 text-indigo-400 mb-6">
            <KeyRound className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest text-balance">Identity Verification</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Access Vault</h1>
          <p className="text-slate-400 text-sm mb-8">Enter your security credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-slate-500 font-bold ml-1">
                 Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@domain.social"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 rounded-xl bg-white/5 border-white/10 ring-offset-indigo-500 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="Standard Encryption" className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                  Security Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-12 rounded-xl pr-10 bg-white/5 border-white/10 ring-offset-indigo-500 focus-visible:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-xl shadow-indigo-500/20 mt-4 transition-all"
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
              Authorize Session
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-10">
            Unauthorized?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Initialize New Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
