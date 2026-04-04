'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Animated Futuristic Background Component
 * Draws a moving hyperspace starfield and connecting nodes.
 */
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number; y: number; r: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update & Draw Particles
      ctx.fillStyle = 'rgba(167, 139, 250, 0.8)';
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(167, 139, 250, ${1 - dist / 150})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Epic GenZ Animated Background */}
      <ParticleBackground />
      
      {/* Subtle glowing accents */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/10 blur-[140px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            V
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
            Vertex
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero Centered */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-16">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 backdrop-blur-sm shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">
            Welcome to the future of social
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[90px] font-extrabold leading-[1.05] tracking-tight mb-8 animate-in fade-in zoom-in duration-1000 delay-100">
          Share what <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent animate-pulse">
            truly matters
          </span>
        </h1>

        <p className="text-slate-400/90 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto animate-in fade-in duration-1000 delay-300">
          The only platform built for raw connections, seamless threads, and absolute aesthetic perfection. Out with the noise, in with the vibe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Enter Vertex <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 py-8 px-6 text-center text-sm text-slate-600 font-medium tracking-wide">
        Vertex © 2026. Built different.
      </footer>
    </div>
  );
}
