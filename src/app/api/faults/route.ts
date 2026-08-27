import { NextRequest, NextResponse } from 'next/server';
import { faultsService } from '@/services/faults.service';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  try {
    const faults = await faultsService.list();
    return NextResponse.json(faults);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo cargar el catálogo de faltas.' }, { status: 500 });
  }
}
