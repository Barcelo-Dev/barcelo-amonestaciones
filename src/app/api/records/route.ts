import { NextRequest, NextResponse } from 'next/server';
import { recordsService } from '@/services/records.service';
import { requireAuth, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  try {
    const records = await recordsService.list();
    return NextResponse.json(records);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo cargar el historial.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = requireAuth(req);
  if (isErrorResponse(session)) return session;
  const record = await req.json().catch(() => ({}));
  if (!record.employeeId || !record.tipo || !record.cartaTexto) {
    return NextResponse.json({ error: 'Faltan datos obligatorios para guardar la carta.' }, { status: 400 });
  }
  try {
    const saved = await recordsService.create(record, session.username, session.name);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo guardar el registro.' }, { status: 500 });
  }
}
