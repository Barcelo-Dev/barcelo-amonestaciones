import { NextRequest, NextResponse } from 'next/server';
import { recordsService } from '@/services/records.service';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { employeeId: string } }) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  try {
    const records = await recordsService.listByEmployee(params.employeeId);
    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo cargar el historial del empleado.' }, { status: 500 });
  }
}
