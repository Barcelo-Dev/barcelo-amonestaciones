import { NextRequest, NextResponse } from 'next/server';
import { usersService } from '@/services/users.service';
import { auditService } from '@/services/audit.service';
import { requireAdmin, isErrorResponse } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { username: string } }) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const username = params.username;
  const body = await req.json().catch(() => ({}));
  const { name, role, password } = body || {};
  if (role !== undefined && !['admin', 'supervisor'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 });
  }
  if (name !== undefined && !String(name).trim()) {
    return NextResponse.json({ error: 'El nombre no puede quedar vacío.' }, { status: 400 });
  }
  try {
    const existing = await usersService.findByUsername(username);
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }
    const updated = await usersService.update(username, {
      name: name !== undefined ? String(name).trim() : undefined,
      role: role !== undefined ? role : undefined,
      password: password ? String(password) : undefined,
    });
    await auditService.record({
      action: 'update_user',
      targetUsername: updated.username,
      targetName: updated.name,
      byUser: session.username,
      byName: session.name,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { username: string } }) {
  const session = requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const username = params.username;
  if (username.toLowerCase() === session.username.toLowerCase()) {
    return NextResponse.json({ error: 'No puedes eliminar tu propio usuario.' }, { status: 400 });
  }
  try {
    const existing = await usersService.findByUsername(username);
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }
    await usersService.remove(username);
    await auditService.record({
      action: 'delete_user',
      targetUsername: existing.username,
      targetName: existing.name,
      byUser: session.username,
      byName: session.name,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'No se pudo eliminar el usuario.' }, { status: 500 });
  }
}
