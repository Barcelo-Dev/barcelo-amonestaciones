import bcrypt from 'bcryptjs';
import { getSupabase } from '../lib/supabaseClient';
import { AppUser, AppUserWithHash } from '../lib/types';

interface UserRow {
  username: string;
  name: string;
  role: string;
  active: boolean;
  password_hash: string;
  created_by: string | null;
  created_at: string;
}

function mapRow(row: UserRow): AppUser {
  return {
    username: row.username,
    name: row.name,
    role: row.role as AppUser['role'],
    active: row.active,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapRowWithHash(row: UserRow): AppUserWithHash {
  return { ...mapRow(row), passwordHash: row.password_hash };
}

async function list(): Promise<AppUser[]> {
  const { data, error } = await getSupabase()
    .from('app_users')
    .select('*')
    .order('username', { ascending: true });
  if (error) throw error;
  return (data as UserRow[]).map(mapRow);
}

async function listWithHashes(): Promise<AppUserWithHash[]> {
  const { data, error } = await getSupabase()
    .from('app_users')
    .select('*')
    .order('username', { ascending: true });
  if (error) throw error;
  return (data as UserRow[]).map(mapRowWithHash);
}

async function findByUsername(username: string): Promise<AppUserWithHash | null> {
  const { data, error } = await getSupabase()
    .from('app_users')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data ? mapRowWithHash(data as UserRow) : null;
}

async function create(input: {
  username: string;
  name: string;
  role: AppUser['role'];
  password: string;
  createdBy: string;
}): Promise<AppUser> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const { data, error } = await getSupabase()
    .from('app_users')
    .insert({
      username: input.username.toLowerCase(),
      name: input.name,
      role: input.role,
      active: true,
      password_hash: passwordHash,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as UserRow);
}

async function remove(username: string): Promise<void> {
  const { error } = await getSupabase().from('app_users').delete().eq('username', username.toLowerCase());
  if (error) throw error;
}

async function update(
  username: string,
  input: { name?: string; role?: AppUser['role']; password?: string }
): Promise<AppUser> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.role !== undefined) patch.role = input.role;
  if (input.password) patch.password_hash = await bcrypt.hash(input.password, 10);

  const { data, error } = await getSupabase()
    .from('app_users')
    .update(patch)
    .eq('username', username.toLowerCase())
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as UserRow);
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

async function replaceAll(rows: AppUserWithHash[]): Promise<{ inserted: number }> {
  const supabase = getSupabase();
  const { error: delError } = await supabase.from('app_users').delete().neq('username', '__never_matches__');
  if (delError) throw delError;
  if (!rows || rows.length === 0) return { inserted: 0 };
  const payload = rows.map((r) => ({
    username: r.username.toLowerCase(),
    name: r.name,
    role: r.role,
    active: r.active !== false,
    password_hash: r.passwordHash,
    created_by: r.createdBy,
    created_at: r.createdAt,
  }));
  const { error: insError } = await supabase.from('app_users').insert(payload);
  if (insError) throw insError;
  return { inserted: payload.length };
}

export const usersService = { list, listWithHashes, findByUsername, create, update, remove, verifyPassword, replaceAll };
