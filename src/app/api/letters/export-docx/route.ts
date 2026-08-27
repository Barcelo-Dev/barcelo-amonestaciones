import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  const body = await req.json().catch(() => ({}));
  const { text, filename } = body || {};
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Falta el texto de la carta.' }, { status: 400 });
  }
  try {
    const lines = text.split('\n');
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: lines.map((line: string) => new Paragraph({
          children: [new TextRun({ text: line, font: 'Georgia', size: 24 })],
          spacing: { after: 120 },
        })),
      }],
    });
    const buffer = await Packer.toBuffer(doc);
    const safeName = String(filename || 'carta').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeName}.docx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo generar el archivo Word.' }, { status: 500 });
  }
}
