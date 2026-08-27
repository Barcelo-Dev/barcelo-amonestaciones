'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { fullName } from '@/lib/format';
import { api } from '@/lib/api';
import Modal from './Modal';
import { Employee } from '@/lib/types';

export default function Employees() {
  const { employees, setEmployees, records, setView, setEmpleadoDetalleId } = useApp();
  const [q, setQ] = useState('');
  const [depto, setDepto] = useState('');
  const [status, setStatus] = useState('Activo');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ id: string | null; data: Partial<Employee> } | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<string[] | null>(null);

  const depts = useMemo(() => [...new Set(employees.map((e) => e.departamento).filter(Boolean))].sort(), [employees]);

  const list = useMemo(() => {
    let l = employees.slice();
    if (q) {
      const qq = q.toLowerCase();
      l = l.filter((e) => fullName(e).toLowerCase().includes(qq) || (e.puesto || '').toLowerCase().includes(qq));
    }
    if (depto) l = l.filter((e) => e.departamento === depto);
    if (status) l = l.filter((e) => (e.status || 'Activo') === status);
    l.sort((a, b) => fullName(a).localeCompare(fullName(b)));
    return l;
  }, [employees, q, depto, status]);

  const countFor = (id: string) => records.filter((r) => r.employeeId === id).length;
  const visibleIds = list.map((e) => e.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }
  function toggleAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => { if (checked) next.add(id); else next.delete(id); });
      return next;
    });
  }

  function openAdd() { setModal({ id: null, data: { nombres: '', apellidos: '', departamento: '', puesto: '', status: 'Activo' } }); }
  function openEdit(e: Employee) { setModal({ id: e.id, data: { ...e } }); }

  async function saveModal(form: { nombres: string; apellidos: string; departamento: string; puesto: string; status: string }) {
    if (!form.nombres.trim() || !form.apellidos.trim()) { alert('Nombres y apellidos son obligatorios.'); return; }
    try {
      if (modal?.id) {
        const updated = await api.put<Employee>(`/api/employees/${modal.id}`, form);
        setEmployees((prev) => prev.map((e) => (e.id === modal.id ? updated : e)));
      } else {
        const created = await api.post<Employee>('/api/employees', form);
        setEmployees((prev) => [...prev, created]);
      }
      setModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo guardar el empleado.');
    }
  }

  async function confirmDelete() {
    if (!deleteTargets) return;
    try {
      await api.post('/api/employees/delete-many', { ids: deleteTargets });
      const idSet = new Set(deleteTargets);
      setEmployees((prev) => prev.filter((e) => !idSet.has(e.id)));
      setSelected((prev) => { const next = new Set(prev); idSet.forEach((id) => next.delete(id)); return next; });
      setDeleteTargets(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudieron eliminar los empleados.');
    }
  }

  function viewDetail(id: string) {
    setEmpleadoDetalleId(id);
    setView('empleadoDetalle');
  }

  return (
    <>
      <div className="view-title">
        <div><h2>Empleados</h2><p>Base de datos de asociados. Selecciona uno para ver su historial disciplinario.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.size > 0 && <button className="btn btn-danger" onClick={() => setDeleteTargets(Array.from(selected))}>Eliminar seleccionados ({selected.size})</button>}
          <button className="btn btn-brass" onClick={openAdd}>+ Agregar empleado</button>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-input"><input type="text" placeholder="Buscar por nombre o puesto…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={depto} onChange={(e) => setDepto(e.target.value)}>
          <option value="">Todos los departamentos</option>
          {depts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 34 }}><input type="checkbox" checked={allVisibleSelected} onChange={(e) => toggleAll(e.target.checked)} /></th>
                <th>Nombre</th><th>Departamento</th><th>Puesto</th><th>Estado</th><th>Amonestaciones</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => viewDetail(e.id)}>
                  <td onClick={(ev) => ev.stopPropagation()}><input type="checkbox" checked={selected.has(e.id)} onChange={(ev) => toggleOne(e.id, ev.target.checked)} /></td>
                  <td><b>{fullName(e)}</b></td>
                  <td>{e.departamento || '—'}</td>
                  <td>{e.puesto || '—'}</td>
                  <td><span className={`badge ${(e.status || 'Activo') === 'Activo' ? 'badge-active' : 'badge-inactive'}`}>{e.status || 'Activo'}</span></td>
                  <td>{countFor(e.id)}</td>
                  <td onClick={(ev) => ev.stopPropagation()}>
                    {selected.has(e.id) && (
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTargets([e.id])}>Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><h3>No se encontraron empleados</h3><p>Ajusta los filtros o agrega un nuevo empleado a la base de datos.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <EmployeeModal isNew={!modal.id} data={modal.data} depts={depts} puestos={[...new Set(employees.map((e) => e.puesto).filter(Boolean))]} onCancel={() => setModal(null)} onSave={saveModal} />}

      {deleteTargets && (
        <DeleteConfirmModal
          employees={deleteTargets.map((id) => employees.find((e) => e.id === id)).filter(Boolean) as Employee[]}
          hasHistory={deleteTargets.some((id) => records.some((r) => r.employeeId === id))}
          onCancel={() => setDeleteTargets(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}

function EmployeeModal({ isNew, data, depts, puestos, onCancel, onSave }: {
  isNew: boolean;
  data: Partial<Employee>;
  depts: string[];
  puestos: string[];
  onCancel: () => void;
  onSave: (form: { nombres: string; apellidos: string; departamento: string; puesto: string; status: string }) => void;
}) {
  const [nombres, setNombres] = useState(data.nombres || '');
  const [apellidos, setApellidos] = useState(data.apellidos || '');
  const [departamento, setDepartamento] = useState(data.departamento || '');
  const [puesto, setPuesto] = useState(data.puesto || '');
  const [status, setStatus] = useState<string>(data.status || 'Activo');

  return (
    <Modal onClose={onCancel}>
      <h3>{isNew ? 'Agregar empleado' : 'Editar empleado'}</h3>
      <div className="field-row">
        <div className="field"><label>Nombres</label><input type="text" value={nombres} onChange={(e) => setNombres(e.target.value)} style={{ textTransform: 'uppercase' }} /></div>
        <div className="field"><label>Apellidos</label><input type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} style={{ textTransform: 'uppercase' }} /></div>
      </div>
      <p className="hint" style={{ marginTop: -8, marginBottom: 14 }}>Se guardan en mayúsculas. En las cartas aparecerán con solo la primera letra en mayúscula.</p>
      <div className="field-row">
        <div className="field"><label>Departamento</label><input type="text" value={departamento} onChange={(e) => setDepartamento(e.target.value)} list="deptoList" /></div>
        <div className="field"><label>Puesto</label><input type="text" value={puesto} onChange={(e) => setPuesto(e.target.value)} list="puestoList" /></div>
      </div>
      <datalist id="deptoList">{depts.map((d) => <option key={d} value={d} />)}</datalist>
      <datalist id="puestoList">{puestos.map((p) => <option key={p} value={p} />)}</datalist>
      <div className="field">
        <label>Estado</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => onSave({ nombres, apellidos, departamento, puesto, status })}>Guardar</button>
      </div>
    </Modal>
  );
}

function DeleteConfirmModal({ employees, hasHistory, onCancel, onConfirm }: {
  employees: Employee[];
  hasHistory: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onCancel}>
      <h3>{employees.length === 1 ? 'Eliminar empleado' : `Eliminar ${employees.length} empleados`}</h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
        ¿Confirmas eliminar a {employees.length === 1 ? <b>{fullName(employees[0])}</b> : 'los siguientes empleados'} de la base de datos?
      </p>
      {employees.length > 1 && (
        <ul style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '10px 0', paddingLeft: 18, maxHeight: 160, overflowY: 'auto' }}>
          {employees.map((e) => <li key={e.id}>{fullName(e)}</li>)}
        </ul>
      )}
      {hasHistory && (
        <p style={{ fontSize: 12.5, background: 'var(--brass-soft)', color: 'var(--brass-dark)', padding: '10px 12px', borderRadius: 8 }}>
          {employees.length === 1 ? 'Este empleado tiene' : 'Estos empleados tienen'} amonestaciones registradas. El historial de cartas ya emitidas se conserva, pero no podrás volver a seleccionarlo(s) para nuevas cartas.
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-danger" onClick={onConfirm}>Eliminar</button>
      </div>
    </Modal>
  );
}
