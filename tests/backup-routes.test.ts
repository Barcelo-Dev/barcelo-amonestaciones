import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { GET as exportBackup } from '../src/app/api/backup/route';
import { POST as restore } from '../src/app/api/backup/restore/route';
import { employeesService } from '../src/services/employees.service';
import { faultsService } from '../src/services/faults.service';
import { recordsService } from '../src/services/records.service';
import { usersService } from '../src/services/users.service';
import { auditService } from '../src/services/audit.service';
import { makeRequest, ADMIN, SUPERVISOR } from './helpers';

test('GET /api/backup is forbidden for supervisors', async () => {
  const res = await exportBackup(makeRequest('http://x/api/backup', { session: SUPERVISOR }));
  assert.equal(res.status, 403);
});

test('GET /api/backup returns a full export for admins', async () => {
  const originals = { list: employeesService.list, faults: faultsService.list, records: recordsService.list, users: usersService.listWithHashes, audit: auditService.list };
  employeesService.list = async () => [{ id: '1', nombres: 'JUAN', apellidos: 'PEREZ', departamento: '', puesto: '', status: 'Activo' }];
  faultsService.list = async () => [];
  recordsService.list = async () => [];
  usersService.listWithHashes = async () => [{ username: 'admin', name: 'Administrador', role: 'admin', active: true, passwordHash: 'hash' }];
  auditService.list = async () => [];
  try {
    const res = await exportBackup(makeRequest('http://x/api/backup', { session: ADMIN }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.empleados.length, 1);
    assert.equal(body.usuarios[0].passwordHash, 'hash');
  } finally {
    employeesService.list = originals.list;
    faultsService.list = originals.faults;
    recordsService.list = originals.records;
    usersService.listWithHashes = originals.users;
    auditService.list = originals.audit;
  }
});

test('POST /api/backup/restore rejects malformed payloads', async () => {
  const res = await restore(makeRequest('http://x/api/backup/restore', { method: 'POST', session: ADMIN, body: { foo: 'bar' } }));
  assert.equal(res.status, 400);
});

test('POST /api/backup/restore replaces tables, logs the audit entry, and clears the session', async () => {
  const originals = { emp: employeesService.replaceAll, rec: recordsService.replaceAll, usr: usersService.replaceAll, aud: auditService.replaceAll, rec2: auditService.record };
  let loggedRestore = false;
  employeesService.replaceAll = async (rows) => ({ inserted: rows.length });
  recordsService.replaceAll = async (rows) => ({ inserted: rows.length });
  usersService.replaceAll = async (rows) => ({ inserted: rows.length });
  auditService.replaceAll = async () => ({ inserted: 0 });
  auditService.record = async (entry) => { if (entry.action === 'restore_backup') loggedRestore = true; };
  try {
    const res = await restore(makeRequest('http://x/api/backup/restore', {
      method: 'POST', session: ADMIN,
      body: { empleados: [{ id: '1', nombres: 'A', apellidos: 'B', departamento: '', puesto: '', status: 'Activo' }], registros: [], usuarios: [{ username: 'admin', passwordHash: 'h', name: 'Administrador', role: 'admin', active: true }], auditoria: [] },
    }));
    assert.equal(res.status, 200);
    assert.ok(loggedRestore);
    assert.ok(res.headers.get('set-cookie')?.includes('osv_session=;'));
  } finally {
    employeesService.replaceAll = originals.emp;
    recordsService.replaceAll = originals.rec;
    usersService.replaceAll = originals.usr;
    auditService.replaceAll = originals.aud;
    auditService.record = originals.rec2;
  }
});
