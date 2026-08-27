import { NextRequest, NextResponse } from 'next/server';
import { employeesService } from '@/services/employees.service';
import { recordsService } from '@/services/records.service';
import { usersService } from '@/services/users.service';
import { auditService } from '@/services/audit.service';
import { requireAdmin, isErrorResponse, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const data = await req.json().catch(() => ({}));
  if (!Array.isArray(data.empleados) || !Array.isArray(data.registros) || !Array.isArray(data.usuarios)) {
    return NextResponse.json({ error: 'El archivo no tiene el formato esperado de un respaldo de este sistema.' }, { status: 400 });
  }
  try {
    await employeesService.replaceAll(data.empleados);
    await recordsService.replaceAll(data.registros);
    await usersService.replaceAll(data.usuarios);
    if (Array.isArray(data.auditoria)) {
      await auditService.replaceAll(data.auditoria);
    }
    await auditService.record({
      action: 'restore_backup',
      targetUsername: '-',
      targetName: '-',
      byUser: session.username,
      byName: session.name,
    });
    const res = NextResponse.json({ ok: true, message: 'Respaldo restaurado. Vuelve a iniciar sesión.' });
    res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo restaurar el respaldo.' }, { status: 500 });
  }
}
