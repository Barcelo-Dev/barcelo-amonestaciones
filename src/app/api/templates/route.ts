import { NextRequest, NextResponse } from 'next/server';
import { templatesService } from '@/services/templates.service';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  try {
    const templates = await templatesService.listActive();
    const byTipo: Record<string, unknown> = {};
    templates.forEach((t) => { byTipo[t.tipo] = t; });
    return NextResponse.json(byTipo);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudieron cargar las plantillas.' }, { status: 500 });
  }
}
