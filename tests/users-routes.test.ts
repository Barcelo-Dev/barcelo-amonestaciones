import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { GET as list, POST as create } from '../src/app/api/users/route';
import { PUT as update, DELETE as remove } from '../src/app/api/users/[username]/route';
import { GET as auditLog } from '../src/app/api/users/audit-log/route';
import { usersService } from '../src/services/users.service';
import { auditService } from '../src/services/audit.service';
import { makeRequest, ADMIN, SUPERVISOR } from './helpers';
import { AuditEntry } from '../src/lib/types';

test('GET /api/users is forbidden for a supervisor', async () => {
  const res = await list(makeRequest('http://x/api/users', { session: SUPERVISOR }));
  assert.equal(res.status, 403);
});

test('GET /api/users works for an admin', async () => {
  const original = usersService.list;
  usersService.list = async () => [{ username: 'admin', name: 'Administrador', role: 'admin', active: true }];
  try {
    const res = await list(makeRequest('http://x/api/users', { session: ADMIN }));
    assert.equal(res.status, 200);
  } finally {
    usersService.list = original;
  }
});

test('POST /api/users creates a user and records an audit entry', async () => {
  const originalFind = usersService.findByUsername;
  const originalCreate = usersService.create;
  const originalRecord = auditService.record;
  usersService.findByUsername = async () => null;
  usersService.create = async (data) => ({ username: data.username, name: data.name, role: data.role, active: true, createdBy: data.createdBy });
  let auditCall: AuditEntry | null = null;
  auditService.record = async (entry) => { auditCall = entry; };
  try {
    const res = await create(makeRequest('http://x/api/users', { method: 'POST', session: ADMIN, body: { username: 'nuevo', name: 'Nuevo', role: 'supervisor', password: 'clave123' } }));
    assert.equal(res.status, 201);
    assert.equal(auditCall!.action, 'create_user');
  } finally {
    usersService.findByUsername = originalFind;
    usersService.create = originalCreate;
    auditService.record = originalRecord;
  }
});

test('POST /api/users rejects duplicate username', async () => {
  const original = usersService.findByUsername;
  usersService.findByUsername = async () => ({ username: 'existe', name: 'X', role: 'supervisor', active: true, passwordHash: 'x' });
  try {
    const res = await create(makeRequest('http://x/api/users', { method: 'POST', session: ADMIN, body: { username: 'existe', name: 'X', role: 'supervisor', password: 'clave123' } }));
    assert.equal(res.status, 409);
  } finally {
    usersService.findByUsername = original;
  }
});

test('PUT /api/users/[username] updates and logs the audit entry', async () => {
  const originalFind = usersService.findByUsername;
  const originalUpdate = usersService.update;
  const originalRecord = auditService.record;
  usersService.findByUsername = async () => ({ username: 'sup1', name: 'Supervisor Uno', role: 'supervisor', active: true, passwordHash: 'x' });
  usersService.update = async (username, patch) => ({ username, name: patch.name || 'Supervisor Uno', role: patch.role || 'supervisor', active: true, createdBy: 'admin' });
  let auditCall: AuditEntry | null = null;
  auditService.record = async (entry) => { auditCall = entry; };
  try {
    const res = await update(makeRequest('http://x/api/users/sup1', { method: 'PUT', session: ADMIN, body: { name: 'Actualizado', role: 'admin' } }), { params: { username: 'sup1' } });
    assert.equal(res.status, 200);
    assert.equal(auditCall!.action, 'update_user');
  } finally {
    usersService.findByUsername = originalFind;
    usersService.update = originalUpdate;
    auditService.record = originalRecord;
  }
});

test('DELETE /api/users/[username] prevents self-deletion', async () => {
  const res = await remove(makeRequest('http://x/api/users/admin', { method: 'DELETE', session: ADMIN }), { params: { username: 'admin' } });
  assert.equal(res.status, 400);
});

test('DELETE /api/users/[username] removes a user and logs the audit entry', async () => {
  const originalFind = usersService.findByUsername;
  const originalRemove = usersService.remove;
  const originalRecord = auditService.record;
  usersService.findByUsername = async () => ({ username: 'sup1', name: 'Supervisor Uno', role: 'supervisor', active: true, passwordHash: 'x' });
  usersService.remove = async () => {};
  let auditCall: AuditEntry | null = null;
  auditService.record = async (entry) => { auditCall = entry; };
  try {
    const res = await remove(makeRequest('http://x/api/users/sup1', { method: 'DELETE', session: ADMIN }), { params: { username: 'sup1' } });
    assert.equal(res.status, 200);
    assert.equal(auditCall!.action, 'delete_user');
  } finally {
    usersService.findByUsername = originalFind;
    usersService.remove = originalRemove;
    auditService.record = originalRecord;
  }
});

test('GET /api/users/audit-log returns entries for an admin', async () => {
  const original = auditService.list;
  auditService.list = async () => [{ id: 1, action: 'create_user', targetUsername: 'x', targetName: '', byUser: 'admin', byName: 'Administrador' }];
  try {
    const res = await auditLog(makeRequest('http://x/api/users/audit-log', { session: ADMIN }));
    assert.equal(res.status, 200);
  } finally {
    auditService.list = original;
  }
});
