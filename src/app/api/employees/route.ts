import { NextRequest, NextResponse } from 'next/server';
import { employeesService } from '@/services/employees.service';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  try {
    const employees = await employeesService.list();
    return NextResponse.json(employees);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudieron cargar los empleados.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  const body = await req.json().catch(() => ({}));
  const { nombres, apellidos, departamento, puesto, status } = body || {};
  if (!nombres || !apellidos) {
    return NextResponse.json({ error: 'Nombres y apellidos son obligatorios.' }, { status: 400 });
  }
  try {
    const employee = await employeesService.create({ nombres, apellidos, departamento, puesto, status });
    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo crear el empleado.' }, { status: 500 });
  }
}
