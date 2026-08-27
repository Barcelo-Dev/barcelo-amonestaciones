import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { GET as list, POST as create } from '../src/app/api/employees/route';
import { PUT as update } from '../src/app/api/employees/[id]/route';
import { POST as deleteMany } from '../src/app/api/employees/delete-many/route';
import { employeesService } from '../src/services/employees.service';
import { makeRequest, ADMIN } from './helpers';

test('GET /api/employees requires authentication', async () => {
  const res = await list(makeRequest('http://x/api/employees'));
  assert.equal(res.status, 401);
});

test('GET /api/employees returns the list when authenticated', async () => {
  const original = employeesService.list;
  employeesService.list = async () => [{ id: '1', nombres: 'JUAN', apellidos: 'PEREZ', departamento: 'Recepcion', puesto: 'Botones', status: 'Activo' }];
  try {
    const res = await list(makeRequest('http://x/api/employees', { session: ADMIN }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.length, 1);
  } finally {
    employeesService.list = original;
  }
});

test('POST /api/employees rejects missing nombres/apellidos', async () => {
  const res = await create(makeRequest('http://x/api/employees', { method: 'POST', session: ADMIN, body: { departamento: 'x' } }));
  assert.equal(res.status, 400);
});

test('POST /api/employees creates an employee', async () => {
  const original = employeesService.create;
  employeesService.create = async (data) => ({ id: 'new-1', nombres: data.nombres.toUpperCase(), apellidos: data.apellidos.toUpperCase(), departamento: data.departamento || '', puesto: data.puesto || '', status: data.status || 'Activo' });
  try {
    const res = await create(makeRequest('http://x/api/employees', { method: 'POST', session: ADMIN, body: { nombres: 'maria', apellidos: 'lopez', departamento: 'Concierge', puesto: 'Cajero', status: 'Activo' } }));
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.nombres, 'MARIA');
  } finally {
    employeesService.create = original;
  }
});

test('PUT /api/employees/[id] updates an employee', async () => {
  const original = employeesService.update;
  employeesService.update = async (id, data) => ({ id, nombres: data.nombres.toUpperCase(), apellidos: data.apellidos.toUpperCase(), departamento: data.departamento || '', puesto: data.puesto || '', status: data.status || 'Activo' });
  try {
    const res = await update(
      makeRequest('http://x/api/employees/abc-123', { method: 'PUT', session: ADMIN, body: { nombres: 'juan', apellidos: 'gomez', departamento: 'Recepcion', puesto: 'Piloto', status: 'Inactivo' } }),
      { params: { id: 'abc-123' } }
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, 'abc-123');
    assert.equal(body.status, 'Inactivo');
  } finally {
    employeesService.update = original;
  }
});

test('POST /api/employees/delete-many rejects empty ids', async () => {
  const res = await deleteMany(makeRequest('http://x/api/employees/delete-many', { method: 'POST', session: ADMIN, body: { ids: [] } }));
  assert.equal(res.status, 400);
});

test('POST /api/employees/delete-many deletes given ids', async () => {
  const original = employeesService.removeMany;
  let received: string[] | null = null;
  employeesService.removeMany = async (ids) => { received = ids; return { deleted: ids.length }; };
  try {
    const res = await deleteMany(makeRequest('http://x/api/employees/delete-many', { method: 'POST', session: ADMIN, body: { ids: ['1', '2'] } }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.deleted, 2);
    assert.deepEqual(received, ['1', '2']);
  } finally {
    employeesService.removeMany = original;
  }
});
