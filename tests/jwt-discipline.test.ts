import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession } from '../src/lib/jwt';
import { computeSuggestion } from '../src/lib/discipline';
import { buildLetter } from '../src/lib/letters';
import { fullName, toTitleCase } from '../src/lib/format';
import { Fault, DisciplinaryRecord, Employee } from '../src/lib/types';

test('signSession + verifySession roundtrip preserves user data', () => {
  const token = signSession({ username: 'admin', name: 'Administrador', role: 'admin' });
  const payload = verifySession(token);
  assert.equal(payload.username, 'admin');
  assert.equal(payload.role, 'admin');
});

test('verifySession throws on a tampered token', () => {
  const token = signSession({ username: 'admin', name: 'Administrador', role: 'admin' });
  assert.throws(() => verifySession(token.slice(0, -2) + 'xx'));
});

const sampleFault: Fault = {
  id: 20, descripcion: 'holgar en horas de labores', asesoramiento: '', verbal: '',
  escrita: 'PRIMERA', susp13: 'SEGUNDA', susp15: 'TERCERA', despido: 'CUARTA',
  articulo: '64 "a"', observaciones: '',
};

test('computeSuggestion recommends escrita on the first occurrence for this fault', () => {
  const s = computeSuggestion([], [sampleFault], 'emp-1', 20);
  assert.equal(s?.letter, 'escrita');
  assert.equal(s?.occurrenceIndex, 1);
});

test('computeSuggestion escalates to suspension on the second occurrence', () => {
  const records: DisciplinaryRecord[] = [{
    id: 'r1', employeeId: 'emp-1', employeeSnapshot: { nombres: 'A', apellidos: 'B', departamento: '', puesto: '' },
    faultId: 20, faultDescripcion: '', articulo: '', tipo: 'escrita', fecha: '2026-01-01', fechaFalta: null,
    diasSuspension: null, cartaTexto: '', createdBy: 'admin', createdByName: 'Administrador', createdAt: '2026-01-01T00:00:00Z',
  }];
  const s = computeSuggestion(records, [sampleFault], 'emp-1', 20);
  assert.equal(s?.letter, 'suspension');
  assert.equal(s?.occurrenceIndex, 2);
});

test('buildLetter substitutes tokens and leaves none unreplaced', () => {
  const template = '{{empresa}}\n{{nombreCompleto}} - {{departamento}}\nArt. {{articulo}}';
  const text = buildLetter(template, {
    departamento: 'Recepcion', nombreCompleto: 'Juan Perez', articulo: '64 "a"',
  });
  assert.ok(text.includes('Juan Perez - Recepcion'));
  assert.ok(!text.includes('{{'));
});

test('buildLetter returns a friendly message when no template is configured', () => {
  const text = buildLetter(undefined, {});
  assert.ok(text.includes('No hay una plantilla configurada'));
});

test('fullName uppercases and toTitleCase produces proper-case names with accents', () => {
  const emp: Employee = { id: '1', nombres: 'juan carlos', apellidos: 'pérez lópez', departamento: '', puesto: '', status: 'Activo' };
  assert.equal(fullName(emp), 'JUAN CARLOS PÉREZ LÓPEZ');
  assert.equal(toTitleCase(fullName(emp)), 'Juan Carlos Pérez López');
});
