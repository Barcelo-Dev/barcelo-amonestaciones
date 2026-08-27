import { NextRequest, NextResponse } from 'next/server';
import { auditService } from '@/services/audit.service';
import { requireAdmin, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  try {
    const audit = await auditService.list();
    return NextResponse.json(audit);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo cargar la bitácora.' }, { status: 500 });
  }
}
