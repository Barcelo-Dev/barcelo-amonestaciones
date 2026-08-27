import { NextRequest, NextResponse } from 'next/server';
import { usersService } from '@/services/users.service';
import { auditService } from '@/services/audit.service';
import { requireAdmin, isErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  try {
    const users = await usersService.list();
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudieron cargar los usuarios.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const body = await req.json().catch(() => ({}));
  const { username, name, role, password } = body || {};
  if (!username || !name || !role || !password) {
    return NextResponse.json({ error: 'Completa todos los campos.' }, { status: 400 });
  }
  if (!['admin', 'supervisor'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 });
  }
  try {
    const existing = await usersService.findByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'Ese usuario ya existe.' }, { status: 409 });
    }
    const user = await usersService.create({ username, name, role, password, createdBy: session.username });
    await auditService.record({
      action: 'create_user',
      targetUsername: user.username,
      targetName: user.name,
      byUser: session.username,
      byName: session.name,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 500 });
  }
}
