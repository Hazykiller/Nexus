'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

function GradientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0a0f]">
      <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-cyan-900/30 to-blue-900/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[40%] text-center left-[40%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-emerald-900/20 to-teal-900/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-indigo-900/20 to-purple-900/10 blur-[150px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_20%,transparent_100%)]" />
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {mounted && <GradientBackground />}

      <nav className="relative z-50 flex items-center justify-between px-6 py-8 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 flex items-center justify-center to-blue-600 text-white font-black text-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] border border-white/10">
            V
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
            Vertex
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-300">
            Login
          </Link>
          <Link href="/register" className="group relative px-6 py-2.5 rounded-full bg-white text-black text-sm font-bold transition-all hover:scale-105 active:scale-95 overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              Get Started <Sparkles className="w-4 h-4 text-cyan-600" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-20">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/10 transition-colors cursor-default">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-200 text-xs font-bold uppercase tracking-widest">
            The next generation of social
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-[100px] font-extrabold leading-[1.05] tracking-tight mb-8">
          Share what <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-400 drop-shadow-[0_0_40px_rgba(6,182,212,0.3)]">
            truly matters
          </span>
        </h1>

        <p className="text-slate-400/90 text-lg md:text-xl lg:text-2xl leading-relaxed mb-12 max-w-2xl mx-auto font-medium">
          The only platform built for raw connections, seamless threads, and
          absolute aesthetic perfection. Out with the noise, in with the vibe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/register" className="group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]">
            Enter Vertex <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-transparent border border-white/10 hover:bg-white/5 text-white font-bold text-lg transition-all backdrop-blur-sm">
            Sign In
          </Link>
        </div>
      </main>

      <footer className="relative z-10 py-8 px-6 flex items-center justify-between max-w-7xl w-full mx-auto text-sm text-slate-500 font-medium">
        <p>Vertex © 2026. Built different.</p>
        <div className="flex gap-4">
          <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms</span>
        </div>
      </footer>
    </div>
  );
}
