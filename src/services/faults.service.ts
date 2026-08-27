import { getSupabase } from '../lib/supabaseClient';
import { Fault } from '../lib/types';

function mapRow(row: Record<string, unknown>): Fault {
  return {
    id: row.id as number,
    descripcion: row.descripcion as string,
    asesoramiento: (row.asesoramiento as string) || '',
    verbal: (row.verbal as string) || '',
    escrita: (row.escrita as string) || '',
    susp13: (row.susp13 as string) || '',
    susp15: (row.susp15 as string) || '',
    despido: (row.despido as string) || '',
    articulo: (row.articulo as string) || '',
    observaciones: (row.observaciones as string) || '',
  };
}

async function list(): Promise<Fault[]> {
  const { data, error } = await getSupabase()
    .from('faults')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapRow);
}

export const faultsService = { list };
