import { NextRequest, NextResponse } from 'next/server';
import { employeesService } from '@/services/employees.service';
import { faultsService } from '@/services/faults.service';
import { recordsService } from '@/services/records.service';
import { usersService } from '@/services/users.service';
import { auditService } from '@/services/audit.service';
import { requireAdmin, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  try {
    const [employees, faults, records, users, audit] = await Promise.all([
      employeesService.list(),
      faultsService.list(),
      recordsService.list(),
      usersService.listWithHashes(),
      auditService.list(),
    ]);
    return NextResponse.json({
      tipo: 'respaldo-amonestaciones',
      version: 1,
      exportadoEn: new Date().toISOString(),
      exportadoPor: session.username,
      empleados: employees,
      faltas: faults,
      registros: records,
      usuarios: users,
      auditoria: audit,
    });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo generar el respaldo.' }, { status: 500 });
  }
}
