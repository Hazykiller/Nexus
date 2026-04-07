import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-zinc-900 flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Vertex
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-8">
          Share what<br />truly matters
        </h1>
        <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
          The only platform built for raw connections, seamless threads, and
          absolute aesthetic perfection.
        </p>
        <Link
          href="/register"
          className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg"
        >
          Enter Vertex
        </Link>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 text-center text-sm text-slate-600">
        Vertex © 2026
      </footer>
    </div>
  );
}
