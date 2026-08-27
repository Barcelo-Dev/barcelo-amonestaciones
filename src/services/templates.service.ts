import { getSupabase } from '../lib/supabaseClient';
import { LetterTemplate } from '../lib/types';

const BUCKET = 'letter-templates';

interface TemplateRow {
  id: string;
  tipo: string;
  version: number;
  content: string;
  filename: string | null;
  storage_path: string | null;
  active: boolean;
  uploaded_by: string | null;
  uploaded_at: string;
}

function mapRow(row: TemplateRow): LetterTemplate {
  return {
    id: row.id,
    tipo: row.tipo,
    version: row.version,
    content: row.content,
    filename: row.filename,
    storagePath: row.storage_path,
    active: row.active,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

async function listActive(): Promise<LetterTemplate[]> {
  const { data, error } = await getSupabase()
    .from('letter_templates')
    .select('*')
    .eq('active', true);
  if (error) throw error;
  return (data as TemplateRow[]).map(mapRow);
}

async function listHistory(tipo: string): Promise<LetterTemplate[]> {
  const { data, error } = await getSupabase()
    .from('letter_templates')
    .select('*')
    .eq('tipo', tipo)
    .order('version', { ascending: false });
  if (error) throw error;
  return (data as TemplateRow[]).map(mapRow);
}

async function getById(id: string): Promise<LetterTemplate | null> {
  const { data, error } = await getSupabase()
    .from('letter_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as TemplateRow) : null;
}

async function uploadNewVersion(
  tipo: string,
  content: string,
  filename: string,
  fileBuffer: Buffer,
  uploadedBy: string
): Promise<LetterTemplate> {
  const supabase = getSupabase();

  const { data: existing, error: histError } = await supabase
    .from('letter_templates')
    .select('version')
    .eq('tipo', tipo)
    .order('version', { ascending: false })
    .limit(1);
  if (histError) throw histError;
  const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

  const storagePath = `${tipo}/v${nextVersion}-${Date.now()}-${filename}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('letter_templates')
    .insert({
      tipo,
      version: nextVersion,
      content,
      filename,
      storage_path: storagePath,
      active: false,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as TemplateRow);
}

async function activateVersion(id: string): Promise<LetterTemplate> {
  const supabase = getSupabase();
  const target = await getById(id);
  if (!target) throw new Error('Versión de plantilla no encontrada.');

  const { error: deactivateError } = await supabase
    .from('letter_templates')
    .update({ active: false })
    .eq('tipo', target.tipo)
    .eq('active', true);
  if (deactivateError) throw deactivateError;

  const { data, error } = await supabase
    .from('letter_templates')
    .update({ active: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as TemplateRow);
}

async function getDownloadUrl(id: string): Promise<string | null> {
  const template = await getById(id);
  if (!template || !template.storagePath) return null;
  const { data, error } = await getSupabase().storage
    .from(BUCKET)
    .createSignedUrl(template.storagePath, 300);
  if (error) throw error;
  return data.signedUrl;
}

export const templatesService = {
  listActive,
  listHistory,
  getById,
  uploadNewVersion,
  activateVersion,
  getDownloadUrl,
};
