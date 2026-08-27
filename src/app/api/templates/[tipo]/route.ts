import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { templatesService } from '@/services/templates.service';
import { requireAdmin, isErrorResponse } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { tipo: string } }) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Debes adjuntar un archivo .docx.' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return NextResponse.json({ error: 'Solo se aceptan archivos .docx (Word).' }, { status: 400 });
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extracted = await mammoth.extractRawText({ buffer });
    const content = extracted.value.trim();
    if (!content) {
      return NextResponse.json(
        { error: 'No se pudo extraer texto de ese documento. Verifica que no esté vacío o dañado.' },
        { status: 400 }
      );
    }
    const saved = await templatesService.uploadNewVersion(params.tipo, content, file.name, buffer, session.username);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo procesar el documento.' }, { status: 500 });
  }
}
