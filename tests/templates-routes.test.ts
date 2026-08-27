import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Document, Packer, Paragraph } from 'docx';
import { GET as listActive } from '../src/app/api/templates/route';
import { POST as upload } from '../src/app/api/templates/[tipo]/route';
import { GET as history } from '../src/app/api/templates/[tipo]/history/route';
import { POST as activate } from '../src/app/api/templates/activate/[id]/route';
import { GET as download } from '../src/app/api/templates/download/[id]/route';
import { templatesService } from '../src/services/templates.service';
import { makeRequest, ADMIN, SUPERVISOR } from './helpers';

test('GET /api/templates returns active templates for any logged-in user', async () => {
  const original = templatesService.listActive;
  templatesService.listActive = async () => [{ id: '1', tipo: 'escrita', version: 1, content: 'x', filename: null, storagePath: null, active: true, uploadedBy: 'sistema', uploadedAt: new Date().toISOString() }];
  try {
    const res = await listActive(makeRequest('http://x/api/templates', { session: SUPERVISOR }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.escrita.version, 1);
  } finally {
    templatesService.listActive = original;
  }
});

test('GET /api/templates/[tipo]/history is forbidden for supervisors', async () => {
  const res = await history(makeRequest('http://x/api/templates/escrita/history', { session: SUPERVISOR }), { params: { tipo: 'escrita' } });
  assert.equal(res.status, 403);
});

test('POST /api/templates/[tipo] rejects non-docx files', async () => {
  const formData = new FormData();
  formData.append('file', new File([Buffer.from('hola')], 'nota.txt'));
  const res = await upload(makeRequest('http://x/api/templates/escrita', { method: 'POST', session: ADMIN, formData }), { params: { tipo: 'escrita' } });
  assert.equal(res.status, 400);
});

test('POST /api/templates/[tipo] rejects when no file attached', async () => {
  const formData = new FormData();
  const res = await upload(makeRequest('http://x/api/templates/escrita', { method: 'POST', session: ADMIN, formData }), { params: { tipo: 'escrita' } });
  assert.equal(res.status, 400);
});

test('POST /api/templates/[tipo] extracts text and stores a new inactive version', async () => {
  const original = templatesService.uploadNewVersion;
  let receivedContent = '';
  templatesService.uploadNewVersion = async (tipo, content) => { receivedContent = content; return { id: 'tpl-2', tipo, version: 2, content, filename: 'nuevo.docx', storagePath: 'x', active: false, uploadedBy: 'admin', uploadedAt: new Date().toISOString() }; };
  try {
    const doc = new Document({ sections: [{ children: [new Paragraph('Hola mundo de prueba')] }] });
    const buffer = await Packer.toBuffer(doc);
    const formData = new FormData();
    formData.append('file', new File([new Uint8Array(buffer)], 'plantilla.docx'));
    const res = await upload(makeRequest('http://x/api/templates/escrita', { method: 'POST', session: ADMIN, formData }), { params: { tipo: 'escrita' } });
    assert.equal(res.status, 201);
    assert.ok(receivedContent.includes('Hola mundo de prueba'));
  } finally {
    templatesService.uploadNewVersion = original;
  }
});

test('POST /api/templates/activate/[id] activates the given version', async () => {
  const original = templatesService.activateVersion;
  templatesService.activateVersion = async (id) => ({ id, tipo: 'escrita', version: 2, content: 'z', filename: 'x.docx', storagePath: 'x', active: true, uploadedBy: 'admin', uploadedAt: new Date().toISOString() });
  try {
    const res = await activate(makeRequest('http://x/api/templates/activate/2', { method: 'POST', session: ADMIN }), { params: { id: '2' } });
    assert.equal(res.status, 200);
  } finally {
    templatesService.activateVersion = original;
  }
});

test('GET /api/templates/download/[id] returns 404 without a stored file', async () => {
  const original = templatesService.getDownloadUrl;
  templatesService.getDownloadUrl = async () => null;
  try {
    const res = await download(makeRequest('http://x/api/templates/download/1', { session: ADMIN }), { params: { id: '1' } });
    assert.equal(res.status, 404);
  } finally {
    templatesService.getDownloadUrl = original;
  }
});
