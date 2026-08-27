export type EmployeeStatus = 'Activo' | 'Inactivo';

export interface Employee {
  id: string;
  nombres: string;
  apellidos: string;
  departamento: string;
  puesto: string;
  status: EmployeeStatus;
  createdAt?: string;
}

export interface EmployeeInput {
  nombres: string;
  apellidos: string;
  departamento?: string;
  puesto?: string;
  status?: EmployeeStatus;
}

export interface Fault {
  id: number;
  descripcion: string;
  asesoramiento: string;
  verbal: string;
  escrita: string;
  susp13: string;
  susp15: string;
  despido: string;
  articulo: string;
  observaciones: string;
}

export type LetterType =
  | 'convocatoria'
  | 'asesoramiento'
  | 'verbal'
  | 'escrita'
  | 'suspension'
  | 'apercibimiento';

export interface EmployeeSnapshot {
  nombres: string;
  apellidos: string;
  departamento: string;
  puesto: string;
}

export interface DisciplinaryRecord {
  id: string;
  employeeId: string;
  employeeSnapshot: EmployeeSnapshot;
  faultId: number | null;
  faultDescripcion: string | null;
  articulo: string | null;
  tipo: LetterType | string;
  fecha: string;
  fechaFalta: string | null;
  diasSuspension: string | null;
  cartaTexto: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface DisciplinaryRecordInput {
  employeeId: string;
  employeeSnapshot: EmployeeSnapshot;
  faultId?: number | null;
  faultDescripcion?: string | null;
  articulo?: string | null;
  tipo: LetterType | string;
  fecha: string;
  fechaFalta?: string | null;
  diasSuspension?: string | null;
  cartaTexto: string;
}

export type UserRole = 'admin' | 'supervisor';

export interface AppUser {
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdBy?: string | null;
  createdAt?: string;
}

export interface AppUserWithHash extends AppUser {
  passwordHash: string;
}

export interface AppUserInput {
  username: string;
  name: string;
  role: UserRole;
  password: string;
  createdBy: string;
}

export type AuditAction = 'create_user' | 'update_user' | 'delete_user' | 'restore_backup';

export interface AuditEntry {
  id?: number;
  action: AuditAction;
  targetUsername: string;
  targetName: string;
  byUser: string;
  byName: string;
  timestamp?: string;
}

export interface SessionUser {
  username: string;
  name: string;
  role: UserRole;
}

export interface LetterTemplate {
  id: string;
  tipo: string;
  version: number;
  content: string;
  filename: string | null;
  storagePath: string | null;
  active: boolean;
  uploadedBy: string | null;
  uploadedAt: string;
}

export interface BackupPayload {
  tipo: 'respaldo-amonestaciones';
  version: number;
  exportadoEn: string;
  exportadoPor: string;
  empleados: Employee[];
  faltas: Fault[];
  registros: DisciplinaryRecord[];
  usuarios: AppUserWithHash[];
  auditoria: AuditEntry[];
}
