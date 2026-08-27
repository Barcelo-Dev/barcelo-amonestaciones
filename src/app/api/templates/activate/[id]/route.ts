import { NextRequest, NextResponse } from 'next/server';
import { templatesService } from '@/services/templates.service';
import { requireAdmin, isErrorResponse } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  try {
    const updated = await templatesService.activateVersion(params.id);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo activar esta versión.' }, { status: 500 });
  }
}
