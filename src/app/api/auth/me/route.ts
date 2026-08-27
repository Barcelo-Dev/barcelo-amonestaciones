import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  return NextResponse.json(session);
}
