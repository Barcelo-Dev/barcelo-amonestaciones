const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDateLong(iso?: string | null): string {
  if (!iso) return '____________________';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

export function fmtDateShort(iso?: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function fullName(emp: { nombres: string; apellidos: string }): string {
  return `${emp.nombres} ${emp.apellidos}`.trim().toUpperCase();
}

export function toTitleCase(str: string): string {
  return (str || '').trim().split(/\s+/).map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w)).join(' ');
}
