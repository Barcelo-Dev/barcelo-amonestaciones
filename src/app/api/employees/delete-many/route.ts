import { NextRequest, NextResponse } from 'next/server';
import { employeesService } from '@/services/employees.service';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  const body = await req.json().catch(() => ({}));
  const { ids } = body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Debes indicar al menos un empleado a eliminar.' }, { status: 400 });
  }
  try {
    const result = await employeesService.removeMany(ids);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudieron eliminar los empleados.' }, { status: 500 });
  }
}
