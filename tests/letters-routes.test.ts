import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as exportDocx } from '../src/app/api/letters/export-docx/route';
import { makeRequest, ADMIN } from './helpers';

test('POST /api/letters/export-docx requires authentication', async () => {
  const res = await exportDocx(makeRequest('http://x/api/letters/export-docx', { method: 'POST', body: { text: 'hola' } }));
  assert.equal(res.status, 401);
});

test('POST /api/letters/export-docx rejects missing text', async () => {
  const res = await exportDocx(makeRequest('http://x/api/letters/export-docx', { method: 'POST', session: ADMIN, body: {} }));
  assert.equal(res.status, 400);
});

test('POST /api/letters/export-docx returns a valid docx file', async () => {
  const res = await exportDocx(makeRequest('http://x/api/letters/export-docx', { method: 'POST', session: ADMIN, body: { text: 'Linea 1\n\nLinea 2', filename: 'escrita-juan-perez' } }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.ok(res.headers.get('content-disposition')?.includes('escrita-juan-perez.docx'));
  const buf = Buffer.from(await res.arrayBuffer());
  assert.ok(buf.length > 500);
  assert.equal(buf.slice(0, 2).toString('hex'), '504b');
});

test('POST /api/letters/export-docx sanitizes unsafe filenames', async () => {
  const res = await exportDocx(makeRequest('http://x/api/letters/export-docx', { method: 'POST', session: ADMIN, body: { text: 'texto', filename: '../../etc/passwd; rm -rf' } }));
  assert.equal(res.status, 200);
  const disposition = res.headers.get('content-disposition') || '';
  assert.ok(!disposition.includes('/'));
  assert.ok(!disposition.includes('..'));
});
