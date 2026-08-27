import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from './jwt';
import { SessionUser } from './types';

export const COOKIE_NAME = 'osv_session';

export function getSession(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return verifySession(token);
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): SessionUser | NextResponse {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'No has iniciado sesión.' }, { status: 401 });
  }
  return session;
}

export function requireAdmin(req: NextRequest): SessionUser | NextResponse {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== 'admin') {
    return NextResponse.json({ error: 'Esta acción requiere permisos de administrador.' }, { status: 403 });
  }
  return result;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
