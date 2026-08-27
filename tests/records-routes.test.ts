import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { GET as list, POST as create } from '../src/app/api/records/route';
import { GET as occurrenceCount } from '../src/app/api/records/occurrence-count/route';
import { recordsService } from '../src/services/records.service';
import { makeRequest, ADMIN, SUPERVISOR } from './helpers';

test('GET /api/records requires authentication', async () => {
  const res = await list(makeRequest('http://x/api/records'));
  assert.equal(res.status, 401);
});

test('POST /api/records rejects missing required fields', async () => {
  const res = await create(makeRequest('http://x/api/records', { method: 'POST', session: SUPERVISOR, body: { tipo: 'verbal' } }));
  assert.equal(res.status, 400);
});

test('POST /api/records stamps the record with the logged-in user', async () => {
  const original = recordsService.create;
  let receivedBy: { createdBy: string; createdByName: string } | null = null;
  recordsService.create = async (record, createdBy, createdByName) => {
    receivedBy = { createdBy, createdByName };
    return { id: 'rec-1', employeeId: record.employeeId, employeeSnapshot: record.employeeSnapshot, faultId: record.faultId ?? null, faultDescripcion: record.faultDescripcion ?? null, articulo: record.articulo ?? null, tipo: record.tipo, fecha: record.fecha, fechaFalta: record.fechaFalta ?? null, diasSuspension: record.diasSuspension ?? null, cartaTexto: record.cartaTexto, createdBy, createdByName, createdAt: new Date().toISOString() };
  };
  try {
    const res = await create(makeRequest('http://x/api/records', {
      method: 'POST', session: SUPERVISOR,
      body: { employeeId: 'emp-1', employeeSnapshot: { nombres: 'JUAN', apellidos: 'PEREZ', departamento: '', puesto: '' }, tipo: 'verbal', fecha: '2026-08-25', cartaTexto: 'texto' },
    }));
    assert.equal(res.status, 201);
    assert.equal(receivedBy!.createdBy, 'sup1');
  } finally {
    recordsService.create = original;
  }
});

test('GET /api/records/occurrence-count validates query params', async () => {
  const res = await occurrenceCount(makeRequest('http://x/api/records/occurrence-count', { session: ADMIN }));
  assert.equal(res.status, 400);
});

test('GET /api/records/occurrence-count returns the count', async () => {
  const original = recordsService.countByEmployeeAndFault;
  recordsService.countByEmployeeAndFault = async (employeeId, faultId) => { assert.equal(employeeId, 'emp-1'); assert.equal(faultId, 20); return 2; };
  try {
    const res = await occurrenceCount(makeRequest('http://x/api/records/occurrence-count?employeeId=emp-1&faultId=20', { session: ADMIN }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.count, 2);
  } finally {
    recordsService.countByEmployeeAndFault = original;
  }
});
