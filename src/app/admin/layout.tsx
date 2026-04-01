import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Vertex 'Airtight' Admin Shell.
 * Guards the entire /admin ecosystem at the server level (SSR) to prevent
 * any UI 'flashes' or skeleton leaks to unauthorized users.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  // Vertex Airtight: SSR Zero-Flash Guard
  if (!session?.user || !(session.user as any).isAdmin) {
    redirect('/login');
  }

  return <>{children}</>;
}
