import { NextRequest, NextResponse } from 'next/server';
import { templatesService } from '@/services/templates.service';
import { requireAdmin, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { tipo: string } }) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  try {
    const history = await templatesService.listHistory(params.tipo);
    return NextResponse.json(history);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo cargar el historial de esta plantilla.' }, { status: 500 });
  }
}
