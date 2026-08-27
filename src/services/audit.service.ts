import { getSupabase } from '../lib/supabaseClient';
import { AuditEntry } from '../lib/types';

interface AuditRow {
  id: number;
  action: string;
  target_username: string | null;
  target_name: string | null;
  by_user: string | null;
  by_name: string | null;
  timestamp: string;
}

function mapRow(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    action: row.action as AuditEntry['action'],
    targetUsername: row.target_username || '',
    targetName: row.target_name || '',
    byUser: row.by_user || '',
    byName: row.by_name || '',
    timestamp: row.timestamp,
  };
}

async function list(): Promise<AuditEntry[]> {
  const { data, error } = await getSupabase()
    .from('audit_log')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as AuditRow[]).map(mapRow);
}

async function record(entry: AuditEntry): Promise<void> {
  const { error } = await getSupabase().from('audit_log').insert({
    action: entry.action,
    target_username: entry.targetUsername,
    target_name: entry.targetName,
    by_user: entry.byUser,
    by_name: entry.byName,
  });
  if (error) throw error;
}

async function replaceAll(rows: AuditEntry[]): Promise<{ inserted: number }> {
  const supabase = getSupabase();
  const { error: delError } = await supabase.from('audit_log').delete().gte('id', 0);
  if (delError) throw delError;
  if (!rows || rows.length === 0) return { inserted: 0 };
  const payload = rows.map((r) => ({
    action: r.action,
    target_username: r.targetUsername,
    target_name: r.targetName,
    by_user: r.byUser,
    by_name: r.byName,
    timestamp: r.timestamp,
  }));
  const { error: insError } = await supabase.from('audit_log').insert(payload);
  if (insError) throw insError;
  return { inserted: payload.length };
}

export const auditService = { list, record, replaceAll };
