import { getSupabase } from '../lib/supabaseClient';
import { DisciplinaryRecord, DisciplinaryRecordInput } from '../lib/types';

interface RecordRow {
  id: string;
  employee_id: string;
  employee_snapshot: DisciplinaryRecord['employeeSnapshot'];
  fault_id: number | null;
  fault_descripcion: string | null;
  articulo: string | null;
  tipo: string;
  fecha: string;
  fecha_falta: string | null;
  dias_suspension: string | null;
  carta_texto: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

function mapRow(row: RecordRow): DisciplinaryRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeSnapshot: row.employee_snapshot,
    faultId: row.fault_id,
    faultDescripcion: row.fault_descripcion,
    articulo: row.articulo,
    tipo: row.tipo,
    fecha: row.fecha,
    fechaFalta: row.fecha_falta,
    diasSuspension: row.dias_suspension,
    cartaTexto: row.carta_texto,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}

async function list(): Promise<DisciplinaryRecord[]> {
  const { data, error } = await getSupabase()
    .from('records')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RecordRow[]).map(mapRow);
}

async function listByEmployee(employeeId: string): Promise<DisciplinaryRecord[]> {
  const { data, error } = await getSupabase()
    .from('records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return (data as RecordRow[]).map(mapRow);
}

async function countByEmployeeAndFault(employeeId: string, faultId: number): Promise<number> {
  const { count, error } = await getSupabase()
    .from('records')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .eq('fault_id', faultId);
  if (error) throw error;
  return count || 0;
}

async function create(
  record: DisciplinaryRecordInput,
  createdBy: string,
  createdByName: string
): Promise<DisciplinaryRecord> {
  const { data, error } = await getSupabase()
    .from('records')
    .insert({
      employee_id: record.employeeId,
      employee_snapshot: record.employeeSnapshot,
      fault_id: record.faultId ?? null,
      fault_descripcion: record.faultDescripcion ?? null,
      articulo: record.articulo ?? null,
      tipo: record.tipo,
      fecha: record.fecha,
      fecha_falta: record.fechaFalta || null,
      dias_suspension: record.diasSuspension || null,
      carta_texto: record.cartaTexto,
      created_by: createdBy,
      created_by_name: createdByName,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as RecordRow);
}

async function replaceAll(rows: DisciplinaryRecord[]): Promise<{ inserted: number }> {
  const supabase = getSupabase();
  const { error: delError } = await supabase
    .from('records')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) throw delError;
  if (!rows || rows.length === 0) return { inserted: 0 };
  const payload = rows.map((r) => ({
    id: r.id,
    employee_id: r.employeeId,
    employee_snapshot: r.employeeSnapshot,
    fault_id: r.faultId,
    fault_descripcion: r.faultDescripcion,
    articulo: r.articulo,
    tipo: r.tipo,
    fecha: r.fecha,
    fecha_falta: r.fechaFalta || null,
    dias_suspension: r.diasSuspension || null,
    carta_texto: r.cartaTexto,
    created_by: r.createdBy,
    created_by_name: r.createdByName,
    created_at: r.createdAt,
  }));
  const { error: insError } = await supabase.from('records').insert(payload);
  if (insError) throw insError;
  return { inserted: payload.length };
}

export const recordsService = { list, listByEmployee, countByEmployeeAndFault, create, replaceAll };
