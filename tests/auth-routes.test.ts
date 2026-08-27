import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as login } from '../src/app/api/auth/login/route';
import { POST as logout } from '../src/app/api/auth/logout/route';
import { GET as me } from '../src/app/api/auth/me/route';
import { usersService } from '../src/services/users.service';
import { makeRequest, ADMIN } from './helpers';
import { signSession } from '../src/lib/jwt';

test('POST /api/auth/login rejects missing fields', async () => {
  const res = await login(makeRequest('http://x/api/auth/login', { method: 'POST', body: {} }));
  assert.equal(res.status, 400);
});

test('POST /api/auth/login rejects unknown user', async () => {
  const original = usersService.findByUsername;
  usersService.findByUsername = async () => null;
  try {
    const res = await login(makeRequest('http://x/api/auth/login', { method: 'POST', body: { username: 'nadie', password: 'x' } }));
    assert.equal(res.status, 401);
  } finally {
    usersService.findByUsername = original;
  }
});

test('POST /api/auth/login succeeds and sets a session cookie', async () => {
  const originalFind = usersService.findByUsername;
  const originalVerify = usersService.verifyPassword;
  usersService.findByUsername = async () => ({ username: 'admin', name: 'Administrador', role: 'admin', active: true, passwordHash: 'hash' });
  usersService.verifyPassword = async () => true;
  try {
    const res = await login(makeRequest('http://x/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'admin123' } }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.username, 'admin');
    assert.ok(res.headers.get('set-cookie')?.includes('osv_session'));
  } finally {
    usersService.findByUsername = originalFind;
    usersService.verifyPassword = originalVerify;
  }
});

test('GET /api/auth/me without a session returns 401', async () => {
  const res = await me(makeRequest('http://x/api/auth/me'));
  assert.equal(res.status, 401);
});

test('GET /api/auth/me with a valid session cookie returns it', async () => {
  const res = await me(makeRequest('http://x/api/auth/me', { session: ADMIN }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.username, 'admin');
});

test('GET /api/auth/me with a tampered cookie returns 401', async () => {
  const token = signSession(ADMIN);
  const req = makeRequest('http://x/api/auth/me');
  req.cookies.set('osv_session', token.slice(0, -2) + 'xx');
  const res = await me(req);
  assert.equal(res.status, 401);
});

test('POST /api/auth/logout clears the session cookie', async () => {
  const res = await logout();
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('set-cookie')?.includes('osv_session=;'));
});
