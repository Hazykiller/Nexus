import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vertex.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'VertexAdmin2025!';

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Set a secure httpOnly cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', process.env.ADMIN_SESSION_TOKEN || 'vertex-admin-secret-token-2025', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });
  return response;
}
