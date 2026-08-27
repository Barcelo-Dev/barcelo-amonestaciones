import { fmtDateLong } from './format';

export const EMPRESA = 'OPERADORA DE SERVICIOS VARIOS, S.A.';

export interface LetterCtx {
  departamento?: string;
  atencion?: string;
  nombreCompleto?: string;
  apellidos?: string;
  fecha?: string;
  fechaFalta?: string;
  motivo?: string;
  articulo?: string;
  supervisorNombre?: string;
  supervisorCargo?: string;
  diasSuspension?: string;
  fechasSuspension?: string;
  fechaCitacion?: string;
  horaCitacion?: string;
}

function quoteWrap(s?: string): string {
  const v = (s || '').trim();
  if (!v) return '""';
  if (v.startsWith('"') && v.endsWith('"')) return v;
  return `"${v}"`;
}

function renderTemplateTokens(content: string, tokens: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => (tokens[key] !== undefined ? tokens[key] : match));
}

export function buildLetter(templateContent: string | undefined, ctx: LetterCtx): string {
  const dept = ctx.departamento || '____________________';
  const atencion = ctx.atencion || 'Señor';
  const nombreCompleto = ctx.nombreCompleto || '____________________';
  const apellidos = ctx.apellidos || '____________________';
  const fecha = fmtDateLong(ctx.fecha);
  const fechaFalta = fmtDateLong(ctx.fechaFalta);
  const motivo = quoteWrap(ctx.motivo);
  const articulo = ctx.articulo ? ctx.articulo.trim().replace(/\.?$/, '.') : '____________________.';
  const supervisorNombre = ctx.supervisorNombre || '____________________';
  const supervisorCargo = ctx.supervisorCargo || '____________________';
  const diasSuspension = ctx.diasSuspension || '___';
  const fechasSuspension = ctx.fechasSuspension || '____________________';
  const fechaCitacion = ctx.fechaCitacion ? fmtDateLong(ctx.fechaCitacion) : '____________________';
  const horaCitacion = ctx.horaCitacion || '________';
  const motivoReporte = ctx.motivo ? ctx.motivo.trim() : '____________________';

  const tokens: Record<string, string> = {
    empresa: EMPRESA, fecha, atencion, atencionMin: atencion.toLowerCase(),
    nombreCompleto, apellidos, departamento: dept, fechaFalta, motivo, articulo,
    supervisorNombre, supervisorCargo, diasSuspension, fechasSuspension,
    fechaCitacion, horaCitacion, motivoReporte,
  };

  if (!templateContent) {
    return '(No hay una plantilla configurada para este tipo de carta. Ve a "Plantillas" para subir una.)';
  }
  return renderTemplateTokens(templateContent, tokens);
}
