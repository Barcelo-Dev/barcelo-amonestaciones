import { NextRequest, NextResponse } from 'next/server';
import { recordsService } from '@/services/records.service';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  const employeeId = req.nextUrl.searchParams.get('employeeId');
  const faultId = req.nextUrl.searchParams.get('faultId');
  if (!employeeId || !faultId) {
    return NextResponse.json({ error: 'Debes indicar employeeId y faultId.' }, { status: 400 });
  }
  try {
    const count = await recordsService.countByEmployeeAndFault(employeeId, Number(faultId));
    return NextResponse.json({ count });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo calcular la reincidencia.' }, { status: 500 });
  }
}
