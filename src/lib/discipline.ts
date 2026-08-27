import { Fault, DisciplinaryRecord } from './types';

export const ORDINALS = ['PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA', 'SEXTA'];

export interface LetterTypeMeta {
  key: string;
  label: string;
  badge: string;
}

export const LETTER_TYPES: LetterTypeMeta[] = [
  { key: 'convocatoria', label: 'Convocatoria a Audiencia', badge: 'convocatoria' },
  { key: 'asesoramiento', label: 'Asesoramiento', badge: 'asesoramiento' },
  { key: 'verbal', label: 'Amonestación Verbal', badge: 'verbal' },
  { key: 'escrita', label: 'Amonestación Escrita', badge: 'escrita' },
  { key: 'suspension', label: 'Suspensión (1 a 3 días)', badge: 'suspension' },
  { key: 'apercibimiento', label: 'Suspensión con Apercibimiento de Despido (1 a 5 días)', badge: 'apercibimiento' },
];

export function letterMeta(key: string): LetterTypeMeta {
  return LETTER_TYPES.find((t) => t.key === key) || { key, label: key, badge: 'convocatoria' };
}

const COLUMN_TO_LETTER: { col: keyof Fault; letter: string | null }[] = [
  { col: 'asesoramiento', letter: 'asesoramiento' },
  { col: 'verbal', letter: 'verbal' },
  { col: 'escrita', letter: 'escrita' },
  { col: 'susp13', letter: 'suspension' },
  { col: 'susp15', letter: 'apercibimiento' },
  { col: 'despido', letter: null },
];

export interface Suggestion {
  fault: Fault;
  occurrenceIndex: number;
  ordinal: string;
  letter: string | null;
  isDespido: boolean;
  beyondMatrix: boolean;
}

export function countPriorOccurrences(records: DisciplinaryRecord[], employeeId: string, faultId: number): number {
  return records.filter((r) => r.employeeId === employeeId && r.faultId === faultId).length;
}

export function computeSuggestion(records: DisciplinaryRecord[], faults: Fault[], employeeId: string, faultId: number): Suggestion | null {
  const fault = faults.find((f) => f.id === faultId);
  if (!fault) return null;
  const prior = countPriorOccurrences(records, employeeId, faultId);
  const occurrenceIndex = prior + 1;
  const capped = Math.min(occurrenceIndex, 6);
  const target = ORDINALS[capped - 1];
  let match: { col: keyof Fault; letter: string | null } | null = null;
  for (const c of COLUMN_TO_LETTER) {
    const val = String(fault[c.col] || '').trim().toUpperCase();
    if (val === target) { match = c; break; }
  }
  return {
    fault,
    occurrenceIndex,
    ordinal: target,
    letter: match ? match.letter : null,
    isDespido: match ? match.letter === null : false,
    beyondMatrix: occurrenceIndex > 6,
  };
}
