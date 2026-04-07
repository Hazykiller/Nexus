'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function NexusSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const numPoints = 400;
    const radius = Math.max(width, height) * 0.9;

    const points: { x: number; y: number; z: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numPoints; i++) {
      const yVal = 1 - (i / (numPoints - 1)) * 2;
      const r = Math.sqrt(1 - yVal * yVal);
      const theta = phi * i;
      points.push({
        x: Math.cos(theta) * r * radius,
        y: yVal * radius,
        z: Math.sin(theta) * r * radius,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let tgtRotX = 0.002;
    let tgtRotY = 0.002;

    const onMouse = (e: MouseEvent) => {
      tgtRotY = (e.clientX - width / 2) * 0.000002;
      tgtRotX = (e.clientY - height / 2) * 0.000002;
    };
    window.addEventListener('mousemove', onMouse);

    let raf: number;
    const fov = 800;

    const draw = () => {
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);
      rotX += tgtRotX - rotX * 0.01;
      rotY += tgtRotY - rotY * 0.01;
      const cX = Math.cos(rotX), sX = Math.sin(rotX);
      const cY = Math.cos(rotY), sY = Math.sin(rotY);

      const proj = points.map((p) => {
        const x1 = p.x * cY - p.z * sY;
        const z1 = p.z * cY + p.x * sY;
        const y1 = p.y * cX - z1 * sX;
        const z2 = z1 * cX + p.y * sX;
        p.x = x1; p.y = y1; p.z = z2;
        const sc = fov / (fov + z2);
        return { x: x1 * sc + width / 2, y: y1 * sc + height / 2, z: z2, sc };
      });

      proj.sort((a, b) => b.z - a.z);
      ctx.lineWidth = 0.6;

      for (let i = 0; i < proj.length; i++) {
        const p1 = proj[i];
        if (p1.z > 200) continue;
        ctx.fillStyle = `rgba(226,232,240,${Math.max(0.1, p1.sc * 0.8)})`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.sc * 2.5, 0, Math.PI * 2);
        ctx.fill();
        for (let j = i + 1; j < Math.min(i + 5, proj.length); j++) {
          const p2 = proj[j];
          const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (d < 100 * p1.sc) {
            ctx.strokeStyle = `rgba(148,163,184,${Math.max(0.05, (1 - d / 100) * p1.sc * 0.3)})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [ready]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 bg-[#050508]"
      style={{ opacity: 0.85 }}
    />
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {mounted && <NexusSphere />}

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-slate-600/10 blur-[140px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-zinc-600/10 blur-[140px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-zinc-900 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)]">
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
          <Link href="/register" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Get started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-16">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">
            Welcome to the future of social
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[90px] font-extrabold leading-[1.05] tracking-tight mb-8">
          Share what <br />
          <span className="text-white">truly matters</span>
        </h1>

        <p className="text-slate-400/90 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
          The only platform built for raw connections, seamless threads, and
          absolute aesthetic perfection. Out with the noise, in with the vibe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="group flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-slate-200 text-black font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
            Enter Vertex <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      <footer className="relative z-10 py-8 px-6 text-center text-sm text-slate-600 font-medium tracking-wide">
        Vertex © 2026. Built different.
      </footer>
    </div>
  );
}
