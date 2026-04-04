'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle, Users, Zap, Globe, BookOpen, Compass } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">

      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/8 blur-[140px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/20">
            V
          </div>
          <span className="text-lg font-bold tracking-tight">Vertex</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <p className="text-indigo-400 text-sm font-semibold mb-6 tracking-wide">
            A social network that respects you
          </p>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-7">
            Share what{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              matters
            </span>
            <br />with people who do
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl">
            Vertex is a social platform for real conversations, genuine connections,
            and the moments worth sharing — without the noise.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-xl shadow-indigo-500/25"
            >
              Join Vertex <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Already a member? Sign in →
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-28 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: MessageCircle,
              title: 'Real conversations',
              desc: 'End-to-end encrypted messages, group chats, and threads that actually make sense.',
              color: 'text-blue-400',
            },
            {
              icon: Users,
              title: 'Your people',
              desc: 'Follow friends and creators. See their posts, not algorithm bait.',
              color: 'text-violet-400',
            },
            {
              icon: BookOpen,
              title: 'Stories',
              desc: 'Share moments from your day that disappear after 24 hours — no pressure.',
              color: 'text-pink-400',
            },
            {
              icon: Compass,
              title: 'Explore',
              desc: 'Discover trending posts, new people, and topics you actually care about.',
              color: 'text-cyan-400',
            },
            {
              icon: Globe,
              title: 'Groups',
              desc: 'Create or join communities around any interest — public or private.',
              color: 'text-emerald-400',
            },
            {
              icon: Zap,
              title: 'Fast & clean',
              desc: 'No ads. No bloat. Just a fast, clean experience that gets out of your way.',
              color: 'text-amber-400',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white/3 border border-white/8 hover:bg-white/6 hover:border-white/15 transition-all duration-300 group"
            >
              <div className={`mb-4 ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 text-center">
          <div className="inline-block p-px rounded-3xl bg-gradient-to-r from-indigo-500/30 to-violet-500/30">
            <div className="px-12 py-10 rounded-3xl bg-[#050508]">
              <h2 className="text-3xl font-bold mb-3">Ready to join?</h2>
              <p className="text-slate-400 mb-7 text-sm">It takes less than a minute to get started.</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all"
              >
                Create free account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/6 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">V</div>
            <span>Vertex © 2026</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/compliance" className="hover:text-slate-300 transition-colors">Compliance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
