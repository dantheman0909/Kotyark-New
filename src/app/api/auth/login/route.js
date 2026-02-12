import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_USER, ADMIN_PASS, createSession, cleanupSessions } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Clean up old sessions
    cleanupSessions();

    // Create new session
    const { token, expiresAt } = createSession();

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
