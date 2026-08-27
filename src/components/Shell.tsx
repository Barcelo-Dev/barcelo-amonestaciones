'use client';

import { useApp, ViewName } from '@/lib/context';
import Dashboard from './Dashboard';
import Employees from './Employees';
import EmployeeDetail from './EmployeeDetail';
import NewLetterWizard from './NewLetterWizard';
import History from './History';
import Users from './Users';
import Templates from './Templates';

export default function Shell() {
  const { session, view, setView, logout } = useApp();
  if (!session) return null;

  const nav: { k: ViewName; l: string }[] = [
    { k: 'dashboard', l: 'Panel' },
    { k: 'empleados', l: 'Empleados' },
    { k: 'nueva', l: 'Nueva Amonestación' },
    { k: 'historial', l: 'Historial' },
  ];
  if (session.role === 'admin') nav.push({ k: 'usuarios', l: 'Usuarios' }, { k: 'plantillas', l: 'Plantillas' });

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <img src="/assets/logo-blanco.png" alt="Barceló Hotel Group" className="brand-logo" />
          <div className="brand-divider" />
          <div className="brand-text">
            <div className="eyebrow">Régimen Disciplinario</div>
            <h1>Control de Amonestaciones</h1>
          </div>
        </div>
        <div className="topnav">
          {nav.map((n) => (
            <button key={n.k} className={view === n.k ? 'active' : ''} onClick={() => setView(n.k)}>{n.l}</button>
          ))}
        </div>
        <div className="session-chip">
          <div className="who"><b>{session.name}</b>{session.role === 'admin' ? 'Administrador' : 'Supervisor'}</div>
          <button className="btn-logout" onClick={() => logout()}>Salir</button>
        </div>
      </div>
      <main>
        {view === 'dashboard' && <Dashboard />}
        {view === 'empleados' && <Employees />}
        {view === 'empleadoDetalle' && <EmployeeDetail />}
        {view === 'nueva' && <NewLetterWizard />}
        {view === 'historial' && <History />}
        {view === 'usuarios' && session.role === 'admin' && <Users />}
        {view === 'plantillas' && session.role === 'admin' && <Templates />}
      </main>
    </>
  );
}
