import { NextRequest, NextResponse } from 'next/server';
import { employeesService } from '@/services/employees.service';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  const body = await req.json().catch(() => ({}));
  const { nombres, apellidos, departamento, puesto, status } = body || {};
  if (!nombres || !apellidos) {
    return NextResponse.json({ error: 'Nombres y apellidos son obligatorios.' }, { status: 400 });
  }
  try {
    const employee = await employeesService.update(params.id, { nombres, apellidos, departamento, puesto, status });
    return NextResponse.json(employee);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo actualizar el empleado.' }, { status: 500 });
  }
}
