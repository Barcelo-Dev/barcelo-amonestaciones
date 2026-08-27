'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { fmtDateShort } from '@/lib/format';
import { LETTER_TYPES, letterMeta } from '@/lib/discipline';
import { downloadDocxFromText, printLetterText } from '@/lib/letterActions';

export default function History() {
  const { records } = useApp();
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const list = useMemo(() => {
    let l = records.slice();
    if (q) {
      const qq = q.toLowerCase();
      l = l.filter((r) => {
        const name = `${r.employeeSnapshot?.nombres || ''} ${r.employeeSnapshot?.apellidos || ''}`.toLowerCase();
        return name.includes(qq) || (r.faultDescripcion || '').toLowerCase().includes(qq);
      });
    }
    if (tipo) l = l.filter((r) => r.tipo === tipo);
    if (desde) l = l.filter((r) => r.fecha >= desde);
    if (hasta) l = l.filter((r) => r.fecha <= hasta);
    l.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
    return l;
  }, [records, q, tipo, desde, hasta]);

  return (
    <>
      <div className="view-title">
        <div><h2>Historial de amonestaciones</h2><p>{records.length} registro(s) en total. Filtra por empleado, tipo o fecha.</p></div>
      </div>
      <div className="toolbar">
        <div className="search-input"><input type="text" placeholder="Buscar por empleado o falta…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {LETTER_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} title="Desde" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} title="Hasta" />
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Empleado</th><th>Departamento</th><th>Tipo</th><th>Falta</th><th>Registrado por</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{fmtDateShort(r.fecha)}</td>
                  <td><b>{`${r.employeeSnapshot?.nombres || ''} ${r.employeeSnapshot?.apellidos || ''}`.toUpperCase()}</b></td>
                  <td>{r.employeeSnapshot?.departamento || '—'}</td>
                  <td><span className={`badge badge-${letterMeta(r.tipo).badge}`}>{letterMeta(r.tipo).label}</span></td>
                  <td style={{ maxWidth: 280 }}>{(r.faultDescripcion || '').slice(0, 80)}{(r.faultDescripcion || '').length > 80 ? '…' : ''}</td>
                  <td>{r.createdByName || r.createdBy || ''}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => printLetterText(r.cartaTexto)}>PDF</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => downloadDocxFromText(r.cartaTexto, `${r.tipo}-${(r.employeeSnapshot?.apellidos || 'carta').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}>Word</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><h3>No hay registros que coincidan</h3><p>Ajusta los filtros o crea una nueva amonestación.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
