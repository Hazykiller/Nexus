'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Epic 3D Interactive Nexus Sphere
 * Projects 3D mathematical coordinates into a 2D canvas simulation.
 */
function InteractiveNexusCore() {
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

    const numPoints = 350;
    const radius = Math.min(width, height) * 0.45;
    
    interface Point3D {
      x: number; y: number; z: number;
      origX: number; origY: number; origZ: number;
    }
    
    const points: Point3D[] = [];
    
    // Generate points on a sphere using Fibonacci lattice
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      
      points.push({ x: x * radius, y: y * radius, z: z * radius, origX: x * radius, origY: y * radius, origZ: z * radius });
    }

    let rotationX = 0;
    let rotationY = 0;
    let targetRotationX = 0.002;
    let targetRotationY = 0.002;
    
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = width / 2;
      const centerY = height / 2;
      // Mouse drives rotation speed and direction
      targetRotationY = (e.clientX - centerX) * 0.00005;
      targetRotationX = (e.clientY - centerY) * 0.00005;
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const fov = 800;

    const render = () => {
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);
      
      // Smooth interpolation towards target rotation
      rotationX += (targetRotationX - (rotationX * 0.01));
      rotationY += (targetRotationY - (rotationY * 0.01));

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // Project and draw
      const projected = points.map(p => {
        // Rotate Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        // Rotate X
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;
        
        // Update point state permanently
        p.x = x1; p.y = y1; p.z = z2;

        const scale = fov / (fov + z2);
        const x2d = (x1 * scale) + width / 2;
        const y2d = (y1 * scale) + height / 2;
        
        return { x: x2d, y: y2d, z: z2, scale };
      });

      // Sort by Z for proper depth rendering connecting lines
      projected.sort((a, b) => b.z - a.z);

      // Draw constellation lines (only close neighbors that are visible)
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        if (p1.z > 200) continue; // Skip lines in far background to save perf

        ctx.fillStyle = `rgba(34, 211, 238, ${Math.max(0.1, p1.scale * 0.8)})`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.scale * 2.5, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < Math.min(i + 5, projected.length); j++) {
          const p2 = projected[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100 * p1.scale) {
            ctx.strokeStyle = `rgba(16, 185, 129, ${Math.max(0.05, (1 - dist / 100) * p1.scale * 0.5)})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(render);
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
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 bg-[#050508] transition-opacity duration-1000"
      style={{ opacity: 0.85 }}
    />
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Epic GenZ Animated Background */}
      <InteractiveNexusCore />
      
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
