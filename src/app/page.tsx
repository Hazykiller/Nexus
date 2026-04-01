'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Compass, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Vertex 'Royal Premium' Landing Page.
 * A high-end, animated entrance for the Airtight social network.
 * Features: Framer Motion transitions, Indigo-Violet gradients, and Luxury tech aesthetics.
 */
export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 overflow-hidden selection:bg-indigo-500/30">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 lg:px-12 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
            V
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Vertex
          </span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <Link href="/login" className="text-sm font-medium hover:text-indigo-400 transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
              Join Platform
            </Button>
          </Link>
        </motion.div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 lg:px-12 flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider mb-8 uppercase"
        >
          <Shield className="w-3 h-3" />
          Maximum Security Verified
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-5xl lg:text-7xl xl:text-8xl font-bold text-center leading-[1.1] mb-8"
        >
          Connect with <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Airtight Integrity
          </span>
        </motion.h1>

        {/* Hero Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-center text-slate-400 text-lg lg:text-xl mb-12 leading-relaxed"
        >
          Vertex is the luxury standard for modern social networking. 
          E2EE messaging, proactive moderation, and a gated premium environment for your private digital life.
        </motion.p>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-24"
        >
          <Link href="/register">
            <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-2xl shadow-indigo-500/30">
              Start Your Private Feed <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { icon: Zap, title: 'Instant Speed', desc: 'Custom orbital pulse loading for the fastest UX.' },
            { icon: Compass, title: 'Smart Explore', desc: 'Curated feeds built on airtight privacy rules.' },
            { icon: CheckCircle2, title: 'Safe Space', desc: 'Proactive moderation scans for your peace of mind.' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6 lg:px-12 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">V</div>
             <span>Vertex Private Social Alpha © 2026</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Infrastructure</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Security Terms</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
