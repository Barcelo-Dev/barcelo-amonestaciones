'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api } from './api';
import { Employee, Fault, DisciplinaryRecord, AppUser, AuditEntry, LetterTemplate, SessionUser } from './types';

export type ViewName = 'dashboard' | 'empleados' | 'empleadoDetalle' | 'nueva' | 'historial' | 'usuarios' | 'plantillas';

interface AppContextValue {
  session: SessionUser | null;
  loaded: boolean;
  view: ViewName;
  setView: (v: ViewName) => void;
  empleadoDetalleId: string | null;
  setEmpleadoDetalleId: (id: string | null) => void;
  wizardStartEmployeeId: string | null;
  setWizardStartEmployeeId: (id: string | null) => void;

  employees: Employee[];
  faults: Fault[];
  records: DisciplinaryRecord[];
  users: AppUser[];
  audit: AuditEntry[];
  templates: Record<string, LetterTemplate>;

  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setRecords: React.Dispatch<React.SetStateAction<DisciplinaryRecord[]>>;
  setTemplates: React.Dispatch<React.SetStateAction<Record<string, LetterTemplate>>>;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUsersAndAudit: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<ViewName>('dashboard');
  const [empleadoDetalleId, setEmpleadoDetalleId] = useState<string | null>(null);
  const [wizardStartEmployeeId, setWizardStartEmployeeId] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [faults, setFaults] = useState<Fault[]>([]);
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [templates, setTemplates] = useState<Record<string, LetterTemplate>>({});

  const loadAppData = useCallback(async (currentSession: SessionUser) => {
    const [emp, flt, rec, tpl] = await Promise.all([
      api.get<Employee[]>('/api/employees'),
      api.get<Fault[]>('/api/faults'),
      api.get<DisciplinaryRecord[]>('/api/records'),
      api.get<Record<string, LetterTemplate>>('/api/templates'),
    ]);
    setEmployees(emp);
    setFaults(flt);
    setRecords(rec);
    setTemplates(tpl);
    if (currentSession.role === 'admin') {
      const [u, a] = await Promise.all([
        api.get<AppUser[]>('/api/users'),
        api.get<AuditEntry[]>('/api/users/audit-log'),
      ]);
      setUsers(u);
      setAudit(a);
    }
  }, []);

  const refreshUsersAndAudit = useCallback(async () => {
    const [u, a] = await Promise.all([
      api.get<AppUser[]>('/api/users'),
      api.get<AuditEntry[]>('/api/users/audit-log'),
    ]);
    setUsers(u);
    setAudit(a);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const s = await api.post<SessionUser>('/api/auth/login', { username, password });
    setSession(s);
    await loadAppData(s);
    setView('dashboard');
  }, [loadAppData]);

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch { /* noop */ }
    setSession(null);
    setEmployees([]);
    setFaults([]);
    setRecords([]);
    setUsers([]);
    setAudit([]);
    setTemplates({});
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const s = await api.get<SessionUser>('/api/auth/me');
      setSession(s);
      await loadAppData(s);
      setView('dashboard');
    } catch {
      setSession(null);
    } finally {
      setLoaded(true);
    }
  }, [loadAppData]);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const value: AppContextValue = {
    session, loaded, view, setView, empleadoDetalleId, setEmpleadoDetalleId,
    wizardStartEmployeeId, setWizardStartEmployeeId,
    employees, faults, records, users, audit, templates,
    setEmployees, setRecords, setTemplates,
    login, logout, refreshUsersAndAudit,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
