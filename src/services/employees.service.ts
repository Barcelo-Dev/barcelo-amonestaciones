import { getSupabase } from '../lib/supabaseClient';
import { Employee, EmployeeInput } from '../lib/types';

interface EmployeeRow {
  id: string;
  nombres: string;
  apellidos: string;
  departamento: string | null;
  puesto: string | null;
  status: string;
  created_at: string;
}

function mapRow(row: EmployeeRow): Employee {
  return {
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    departamento: row.departamento || '',
    puesto: row.puesto || '',
    status: (row.status as Employee['status']) || 'Activo',
    createdAt: row.created_at,
  };
}

async function list(): Promise<Employee[]> {
  const { data, error } = await getSupabase()
    .from('employees')
    .select('*')
    .order('apellidos', { ascending: true });
  if (error) throw error;
  return (data as EmployeeRow[]).map(mapRow);
}

async function getById(id: string): Promise<Employee | null> {
  const { data, error } = await getSupabase()
    .from('employees')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as EmployeeRow) : null;
}

async function create(input: EmployeeInput): Promise<Employee> {
  const { data, error } = await getSupabase()
    .from('employees')
    .insert({
      nombres: input.nombres.toUpperCase(),
      apellidos: input.apellidos.toUpperCase(),
      departamento: input.departamento || '',
      puesto: input.puesto || '',
      status: input.status || 'Activo',
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as EmployeeRow);
}

async function update(id: string, input: EmployeeInput): Promise<Employee> {
  const { data, error } = await getSupabase()
    .from('employees')
    .update({
      nombres: input.nombres.toUpperCase(),
      apellidos: input.apellidos.toUpperCase(),
      departamento: input.departamento || '',
      puesto: input.puesto || '',
      status: input.status || 'Activo',
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as EmployeeRow);
}

async function removeMany(ids: string[]): Promise<{ deleted: number }> {
  if (!Array.isArray(ids) || ids.length === 0) return { deleted: 0 };
  const { error, count } = await getSupabase()
    .from('employees')
    .delete({ count: 'exact' })
    .in('id', ids);
  if (error) throw error;
  return { deleted: count || ids.length };
}

async function replaceAll(rows: Employee[]): Promise<{ inserted: number }> {
  const supabase = getSupabase();
  const { error: delError } = await supabase
    .from('employees')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) throw delError;
  if (!rows || rows.length === 0) return { inserted: 0 };
  const payload = rows.map((r) => ({
    id: r.id,
    nombres: (r.nombres || '').toUpperCase(),
    apellidos: (r.apellidos || '').toUpperCase(),
    departamento: r.departamento || '',
    puesto: r.puesto || '',
    status: r.status || 'Activo',
  }));
  const { error: insError } = await supabase.from('employees').insert(payload);
  if (insError) throw insError;
  return { inserted: payload.length };
}

export const employeesService = { list, getById, create, update, removeMany, replaceAll };
