'use client';

import { useApp } from '@/lib/context';
import { fullName, fmtDateShort } from '@/lib/format';
import { LETTER_TYPES, letterMeta } from '@/lib/discipline';
import { downloadDocxFromText, printLetterText } from '@/lib/letterActions';

export default function EmployeeDetail() {
  const { employees, records, empleadoDetalleId, setView, setWizardStartEmployeeId } = useApp();
  const emp = employees.find((e) => e.id === empleadoDetalleId);

  if (!emp) {
    return (
      <div className="empty-state">
        <h3>Empleado no encontrado</h3>
        <button className="btn btn-ghost" onClick={() => setView('empleados')}>Volver</button>
      </div>
    );
  }

  const recs = records.filter((r) => r.employeeId === emp.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const counts: Record<string, number> = {};
  LETTER_TYPES.forEach((t) => { counts[t.key] = 0; });
  recs.forEach((r) => { if (counts[r.tipo] !== undefined) counts[r.tipo]++; });

  function startLetter() {
    setWizardStartEmployeeId(emp!.id);
    setView('nueva');
  }

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setView('empleados')} style={{ marginBottom: 16 }}>&larr; Volver a empleados</button>
      <div className="card card-pad">
        <div className="emp-header">
          <div>
            <div className="emp-name">{fullName(emp)}</div>
            <div className="emp-meta">
              {emp.puesto || '—'} · {emp.departamento || '—'} · <span className={`badge ${(emp.status || 'Activo') === 'Activo' ? 'badge-active' : 'badge-inactive'}`}>{emp.status || 'Activo'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-brass btn-sm" onClick={startLetter}>+ Nueva amonestación</button>
          </div>
        </div>
        <div className="count-pills">
          {LETTER_TYPES.map((t) => (
            <div key={t.key} className="count-pill">
              <div className="n">{counts[t.key]}</div>
              <div className="t">{t.label.split(' ')[0] === 'Suspensión' ? t.label.replace('Suspensión', 'Susp.').replace(' (1 a 3 días)', '').replace(' con Apercibimiento de Despido (1 a 5 días)', ' c/Aperc.') : t.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card card-pad" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Historial disciplinario ({recs.length})</h3>
        {recs.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Falta</th><th>Artículo</th><th>Registrado por</th><th></th></tr></thead>
              <tbody>
                {recs.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{fmtDateShort(r.fecha)}</td>
                    <td><span className={`badge badge-${letterMeta(r.tipo).badge}`}>{letterMeta(r.tipo).label}</span></td>
                    <td style={{ maxWidth: 280 }}>{r.faultDescripcion || ''}</td>
                    <td className="mono">{r.articulo || '—'}</td>
                    <td>{r.createdByName || r.createdBy || ''}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => printLetterText(r.cartaTexto)}>PDF</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => downloadDocxFromText(r.cartaTexto, `${r.tipo}-${fullName(emp!).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}>Word</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><h3>Sin historial</h3><p>Este empleado aún no tiene amonestaciones registradas.</p></div>
        )}
      </div>
    </>
  );
}
