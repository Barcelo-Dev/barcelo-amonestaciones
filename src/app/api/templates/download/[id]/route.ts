import { NextRequest, NextResponse } from 'next/server';
import { templatesService } from '@/services/templates.service';
import { requireAdmin, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  try {
    const url = await templatesService.getDownloadUrl(params.id);
    if (!url) {
      return NextResponse.json({ error: 'Esta versión no tiene un archivo Word original guardado.' }, { status: 404 });
    }
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo generar el enlace de descarga.' }, { status: 500 });
  }
}
