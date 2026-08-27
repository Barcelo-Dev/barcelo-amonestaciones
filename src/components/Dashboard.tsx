'use client';

import { useApp } from '@/lib/context';
import { LETTER_TYPES, letterMeta } from '@/lib/discipline';
import { fullName, fmtDateShort } from '@/lib/format';
import { EMPRESA } from '@/lib/letters';

export default function Dashboard() {
  const { employees, records, users, setView } = useApp();

  const activos = employees.filter((e) => (e.status || '').toLowerCase() === 'activo').length;
  const total = records.length;
  const now = new Date();
  const thisMonth = records.filter((r) => {
    if (!r.fecha) return false;
    const [y, m] = r.fecha.split('-').map(Number);
    return y === now.getFullYear() && m === now.getMonth() + 1;
  }).length;

  const byType: Record<string, number> = {};
  LETTER_TYPES.forEach((t) => { byType[t.key] = 0; });
  records.forEach((r) => { if (byType[r.tipo] !== undefined) byType[r.tipo]++; });
  const maxType = Math.max(1, ...Object.values(byType));

  const byEmp: Record<string, number> = {};
  records.forEach((r) => { byEmp[r.employeeId] = (byEmp[r.employeeId] || 0) + 1; });
  const top = Object.entries(byEmp).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => {
    const emp = employees.find((e) => e.id === id);
    return { name: emp ? fullName(emp) : '(empleado eliminado)', dept: emp ? emp.departamento : '', n };
  });

  const recent = [...records].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);

  return (
    <>
      <div className="view-title">
        <div><h2>Panel general</h2><p>Resumen del régimen disciplinario de {EMPRESA}.</p></div>
        <button className="btn btn-brass" onClick={() => setView('nueva')}>+ Nueva amonestación</button>
      </div>
      <div className="grid-stats">
        <div className="stat-card"><div className="num">{activos}</div><div className="lbl">Empleados activos</div><div className="sub">{employees.length} en la base de datos</div></div>
        <div className="stat-card"><div className="num">{total}</div><div className="lbl">Registros totales</div><div className="sub">desde que se abrió esta base</div></div>
        <div className="stat-card"><div className="num">{thisMonth}</div><div className="lbl">Este mes</div><div className="sub">{now.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })}</div></div>
        <div className="stat-card"><div className="num">{users.filter((u) => u.active).length || '—'}</div><div className="lbl">Usuarios del sistema</div><div className="sub">con acceso activo</div></div>
      </div>
      <div className="two-col">
        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Distribución por tipo de sanción</h3>
          {LETTER_TYPES.map((t) => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 150, fontSize: 12.5, color: 'var(--ink-soft)', flexShrink: 0 }}>{t.label}</div>
              <div style={{ flex: 1, background: '#efece3', borderRadius: 5, height: 9, overflow: 'hidden' }}>
                <div style={{ width: `${(byType[t.key] / maxType) * 100}%`, height: '100%', background: 'var(--brass)' }} />
              </div>
              <div style={{ width: 24, textAlign: 'right', fontWeight: 700, fontSize: 12.5 }}>{byType[t.key]}</div>
            </div>
          ))}
          {total === 0 && <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Aún no hay registros. Crea la primera amonestación para ver estadísticas aquí.</p>}
        </div>
        <div className="card card-pad">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Empleados con más amonestaciones</h3>
          {top.length ? top.map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ece7da' }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div><div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{t.dept}</div></div>
              <div className="badge" style={{ background: 'var(--brass-soft)', color: 'var(--brass-dark)' }}>{t.n}</div>
            </div>
          )) : <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Sin datos todavía.</p>}
        </div>
      </div>
      <div className="card card-pad" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Actividad reciente</h3>
        {recent.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Empleado</th><th>Tipo</th><th>Falta</th><th>Registrado por</th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{fmtDateShort(r.fecha)}</td>
                    <td>{`${r.employeeSnapshot?.nombres || ''} ${r.employeeSnapshot?.apellidos || ''}`.toUpperCase()}</td>
                    <td><span className={`badge badge-${letterMeta(r.tipo).badge}`}>{letterMeta(r.tipo).label}</span></td>
                    <td style={{ maxWidth: 260 }}>{(r.faultDescripcion || '').slice(0, 70)}{(r.faultDescripcion || '').length > 70 ? '…' : ''}</td>
                    <td>{r.createdByName || r.createdBy || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><h3>Sin actividad aún</h3><p>Cuando registres amonestaciones, aparecerán aquí.</p></div>
        )}
      </div>
    </>
  );
}
