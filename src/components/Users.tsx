'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/lib/context';
import { api } from '@/lib/api';
import Modal from './Modal';
import { AppUser, AuditEntry } from '@/lib/types';
import { todayISO } from '@/lib/format';

export default function Users() {
  const { users, audit, session, refreshUsersAndAudit } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null);
  const [restorePayload, setRestorePayload] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedUsers = [...users].sort((a, b) => a.username.localeCompare(b.username));
  const sortedAudit = [...audit].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 30);

  function auditLineText(a: AuditEntry) {
    if (a.action === 'restore_backup') {
      return <><b>Restauración de respaldo</b> — por <b>{a.byName || a.byUser}</b> · {new Date(a.timestamp || '').toLocaleString('es-GT')}</>;
    }
    const labels: Record<string, string> = { create_user: 'Alta', update_user: 'Modificación', delete_user: 'Baja' };
    return <><b>{labels[a.action] || a.action}</b> de usuario <b>{a.targetUsername}</b> ({a.targetName || ''}) — por <b>{a.byName || a.byUser}</b> · {new Date(a.timestamp || '').toLocaleString('es-GT')}</>;
  }

  async function exportBackup() {
    try {
      const backup = await api.get('/api/backup');
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respaldo-amonestaciones-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo generar el respaldo.');
    }
  }

  function handleRestoreFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      let data: Record<string, unknown>;
      try { data = JSON.parse(String(e.target?.result)); } catch { alert('El archivo no es un respaldo válido (JSON incorrecto).'); return; }
      if (!Array.isArray(data.empleados) || !Array.isArray(data.registros) || !Array.isArray(data.usuarios)) {
        alert('El archivo no tiene el formato esperado de un respaldo de este sistema.');
        return;
      }
      setRestorePayload(data);
    };
    reader.readAsText(file);
  }

  return (
    <>
      <div className="view-title">
        <div><h2>Usuarios del sistema</h2><p>Controla quién puede iniciar sesión y registrar amonestaciones. Cada alta, baja y modificación queda en la bitácora.</p></div>
        <button className="btn btn-brass" onClick={() => setCreateOpen(true)}>+ Agregar usuario</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Creado por</th><th></th></tr></thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.username}>
                  <td className="mono">{u.username}</td>
                  <td>{u.name}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role === 'admin' ? 'Administrador' : 'Supervisor'}</span></td>
                  <td><span className={`badge ${u.active ? 'badge-active' : 'badge-inactive'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>{u.createdBy || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditUser(u)}>Editar</button>
                      {u.username !== session?.username && <button className="btn btn-danger btn-sm" onClick={() => setDeleteUser(u)}>Eliminar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 15, marginBottom: 6 }}>Respaldo y restauración de datos</h3>
        <p className="hint" style={{ marginBottom: 14 }}>Descarga una copia completa de empleados, historial, faltas y usuarios. Guárdala en un lugar seguro; sirve para recuperar la información si algo llegara a perderse.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={exportBackup}>Descargar respaldo (.json)</button>
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>Restaurar desde archivo</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRestoreFile(f); e.target.value = ''; }}
          />
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 15, marginBottom: 10 }}>Bitácora de altas y bajas</h3>
        {sortedAudit.length ? sortedAudit.map((a, i) => <div key={i} className="audit-line">{auditLineText(a)}</div>) : <p className="hint">Aún no hay eventos registrados.</p>}
      </div>

      {createOpen && <CreateUserModal onCancel={() => setCreateOpen(false)} onDone={async () => { setCreateOpen(false); await refreshUsersAndAudit(); }} />}
      {editUser && <EditUserModal user={editUser} onCancel={() => setEditUser(null)} onDone={async () => { setEditUser(null); await refreshUsersAndAudit(); }} />}
      {deleteUser && <DeleteUserModal user={deleteUser} onCancel={() => setDeleteUser(null)} onDone={async () => { setDeleteUser(null); await refreshUsersAndAudit(); }} />}
      {restorePayload && <RestoreModal payload={restorePayload} onCancel={() => setRestorePayload(null)} />}
    </>
  );
}

function CreateUserModal({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('supervisor');

  async function save() {
    if (!name.trim() || !username.trim() || !password) { alert('Completa todos los campos.'); return; }
    try {
      await api.post('/api/users', { username: username.trim().toLowerCase(), name: name.trim(), role, password });
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    }
  }

  return (
    <Modal onClose={onCancel}>
      <h3>Agregar usuario</h3>
      <div className="field"><label>Nombre completo</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field"><label>Usuario (para iniciar sesión)</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" /></div>
      <div className="field"><label>Contraseña temporal</label><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" /></div>
      <div className="field">
        <label>Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="supervisor">Supervisor — puede registrar amonestaciones</option>
          <option value="admin">Administrador — además gestiona usuarios</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Crear usuario</button>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onCancel, onDone }: { user: AppUser; onCancel: () => void; onDone: () => void }) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user.role);

  async function save() {
    if (!name.trim()) { alert('El nombre no puede quedar vacío.'); return; }
    try {
      await api.put(`/api/users/${encodeURIComponent(user.username)}`, { name, role, password: password || undefined });
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo actualizar el usuario.');
    }
  }

  return (
    <Modal onClose={onCancel}>
      <h3>Editar usuario</h3>
      <div className="field"><label>Usuario</label><input type="text" value={user.username} disabled style={{ background: '#f0ede4', color: 'var(--ink-soft)' }} /></div>
      <div className="field"><label>Nombre completo</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field"><label>Nueva contraseña (dejar en blanco para no cambiarla)</label><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" placeholder="•••••••" /></div>
      <div className="field">
        <label>Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value as AppUser['role'])}>
          <option value="supervisor">Supervisor — puede registrar amonestaciones</option>
          <option value="admin">Administrador — además gestiona usuarios</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Guardar cambios</button>
      </div>
    </Modal>
  );
}

function DeleteUserModal({ user, onCancel, onDone }: { user: AppUser; onCancel: () => void; onDone: () => void }) {
  async function confirm() {
    try {
      await api.delete(`/api/users/${encodeURIComponent(user.username)}`);
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.');
    }
  }
  return (
    <Modal onClose={onCancel}>
      <h3>Eliminar usuario</h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
        ¿Confirmas eliminar el acceso de <b>{user.name}</b> ({user.username})? Esta acción quedará registrada en la bitácora y no se puede deshacer.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-danger" onClick={confirm}>Eliminar</button>
      </div>
    </Modal>
  );
}

function RestoreModal({ payload, onCancel }: { payload: Record<string, unknown>; onCancel: () => void }) {
  const { logout } = useApp();
  const empleados = payload.empleados as unknown[];
  const registros = payload.registros as unknown[];
  const usuarios = payload.usuarios as unknown[];
  const exportadoEn = payload.exportadoEn as string | undefined;

  async function confirm() {
    try {
      await api.post('/api/backup/restore', payload);
      alert('Respaldo restaurado correctamente. Vuelve a iniciar sesión para continuar.');
      await logout();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo restaurar el respaldo.');
    }
  }

  return (
    <Modal onClose={onCancel}>
      <h3>Restaurar respaldo</h3>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
        Este archivo contiene <b>{empleados.length}</b> empleados, <b>{registros.length}</b> registros de amonestaciones y <b>{usuarios.length}</b> usuarios{exportadoEn ? `, exportado el ${new Date(exportadoEn).toLocaleString('es-GT')}` : ''}.
      </p>
      <div className="rrhh-alert" style={{ marginTop: 12 }}>
        <div className="headline">Esto reemplazará todos los datos actuales</div>
        <div className="detail">La información que tienes ahora en empleados, historial y usuarios se sustituirá por completo con la del archivo. Esta acción no se puede deshacer.</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-danger" onClick={confirm}>Restaurar y reemplazar todo</button>
      </div>
    </Modal>
  );
}
