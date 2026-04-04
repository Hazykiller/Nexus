import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { LayoutDashboard, Users, Shield, Cloud, Activity } from 'lucide-react';

const adminNav = [
  { href: '/admin', label: 'Graph', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/security', label: 'Security Log', icon: Shield },
  { href: '/admin/monitor', label: 'Cloud Monitor', icon: Cloud },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as Record<string, unknown>).isAdmin) {
    redirect('/login');
  }

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  return (
    <div className="min-h-screen bg-[#050508] flex">
      {/* Admin Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/8 flex flex-col gap-1 p-3 bg-black/30 backdrop-blur-xl sticky top-0 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 py-4 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-lg">
            V
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Vertex</p>
            <p className="text-red-400 text-xs font-semibold">Admin Console</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
              >
                <Icon className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to app */}
        <div className="mt-auto pt-4 border-t border-white/8">
          <Link
            href="/feed"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            <Activity className="w-4 h-4" />
            Back to Vertex
          </Link>
          <p className="text-xs text-gray-700 px-3 mt-3">
            Logged in as<br />
            <span className="text-gray-500">{(session.user as Record<string, unknown>).name as string}</span>
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
