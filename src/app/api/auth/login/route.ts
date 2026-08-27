import { NextRequest, NextResponse } from 'next/server';
import { usersService } from '@/services/users.service';
import { signSession } from '@/lib/jwt';
import { COOKIE_NAME } from '@/lib/auth';
import env from '@/lib/env';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = body?.username;
  const password = body?.password;
  if (!username || !password) {
    return NextResponse.json({ error: 'Usuario y contraseña son obligatorios.' }, { status: 400 });
  }
  try {
    const user = await usersService.findByUsername(username);
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
    }
    const ok = await usersService.verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
    }
    const session = { username: user.username, name: user.name, role: user.role };
    const token = signSession(session);
    const res = NextResponse.json(session);
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: 12 * 60 * 60,
      path: '/',
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo iniciar sesión. Intenta de nuevo.' }, { status: 500 });
  }
}
