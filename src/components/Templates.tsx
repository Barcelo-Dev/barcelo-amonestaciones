'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { LETTER_TYPES } from '@/lib/discipline';
import { buildLetter } from '@/lib/letters';
import { todayISO } from '@/lib/format';
import { api } from '@/lib/api';
import Modal from './Modal';
import { LetterTemplate } from '@/lib/types';

const TEMPLATE_TOKENS: Record<string, string[]> = {
  convocatoria: ['empresa', 'fecha', 'atencion', 'atencionMin', 'nombreCompleto', 'apellidos', 'departamento', 'motivoReporte', 'fechaCitacion', 'horaCitacion', 'supervisorNombre'],
  asesoramiento: ['empresa', 'fecha', 'atencion', 'nombreCompleto', 'apellidos', 'departamento', 'motivo', 'supervisorNombre', 'supervisorCargo'],
  verbal: ['empresa', 'fecha', 'atencion', 'atencionMin', 'nombreCompleto', 'apellidos', 'departamento', 'fechaFalta', 'motivo', 'articulo', 'supervisorNombre'],
  escrita: ['empresa', 'fecha', 'atencion', 'atencionMin', 'nombreCompleto', 'apellidos', 'departamento', 'motivo', 'articulo', 'supervisorNombre', 'supervisorCargo'],
  suspension: ['empresa', 'fecha', 'atencion', 'atencionMin', 'nombreCompleto', 'apellidos', 'departamento', 'motivo', 'articulo', 'diasSuspension', 'fechasSuspension', 'supervisorNombre'],
  apercibimiento: ['empresa', 'fecha', 'atencion', 'atencionMin', 'nombreCompleto', 'apellidos', 'departamento', 'fechaFalta', 'motivo', 'articulo', 'diasSuspension', 'fechasSuspension', 'supervisorNombre'],
};

const SAMPLE_CTX = {
  fecha: todayISO(), atencion: 'Señor', nombreCompleto: 'Juan Carlos Pérez López', apellidos: 'Pérez López',
  departamento: 'Recepción', fechaFalta: todayISO(), motivo: 'llegar tarde a su turno de forma reiterada',
  articulo: '64 "a"', supervisorNombre: 'Nombre del Supervisor', supervisorCargo: 'Gerente de Departamento',
  diasSuspension: '2', fechasSuspension: 'el lunes 01 y martes 02 de septiembre del presente año',
  fechaCitacion: todayISO(), horaCitacion: '10:00',
};

export default function Templates() {
  const { templates, setTemplates } = useApp();
  const [helpOpen, setHelpOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, LetterTemplate>>({});
  const [historyOpenFor, setHistoryOpenFor] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, LetterTemplate[]>>({});

  async function handleUpload(tipo: string, file: File) {
    if (!file.name.toLowerCase().endsWith('.docx')) { alert('Solo se aceptan archivos .docx (Word).'); return; }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/templates/${tipo}`, { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo subir el archivo.');
      setPreview((prev) => ({ ...prev, [tipo]: data }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo subir el archivo.');
    }
  }

  async function activate(tipo: string) {
    const p = preview[tipo];
    if (!p) return;
    try {
      const updated = await api.post<LetterTemplate>(`/api/templates/activate/${p.id}`);
      setTemplates((prev) => ({ ...prev, [tipo]: updated }));
      setPreview((prev) => { const next = { ...prev }; delete next[tipo]; return next; });
      if (historyOpenFor === tipo) {
        const h = await api.get<LetterTemplate[]>(`/api/templates/${tipo}/history`);
        setHistoryData((prev) => ({ ...prev, [tipo]: h }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo activar esta versión.');
    }
  }

  function discard(tipo: string) {
    setPreview((prev) => { const next = { ...prev }; delete next[tipo]; return next; });
  }

  async function toggleHistory(tipo: string) {
    if (historyOpenFor === tipo) { setHistoryOpenFor(null); return; }
    setHistoryOpenFor(tipo);
    try {
      const h = await api.get<LetterTemplate[]>(`/api/templates/${tipo}/history`);
      setHistoryData((prev) => ({ ...prev, [tipo]: h }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo cargar el historial.');
    }
  }

  async function downloadVersion(id: string) {
    try {
      const { url } = await api.get<{ url: string }>(`/api/templates/download/${id}`);
      window.open(url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo generar el enlace de descarga.');
    }
  }

  return (
    <>
      <div className="view-title">
        <div><h2>Plantillas de cartas</h2><p>Se puede subir un nuevo formato en Word (.docx) para cualquiera de las cartas. El anterior queda guardado en el historial, disponible para descargar en cualquier momento.</p></div>
        <button className="btn btn-ghost" onClick={() => setHelpOpen(true)}>¿Necesitas ayuda con la carta?</button>
      </div>
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Cómo preparar el Word que se va a subir</h3>
        <p className="hint" style={{ lineHeight: 1.6 }}>
          El texto de la carta se escribe como de costumbre, y en los lugares donde debe ir un dato variable (nombre del empleado, fecha, motivo, etc.) se coloca el marcador correspondiente entre llaves dobles, por ejemplo <code className="mono">{'{{nombreCompleto}}'}</code>. El sistema los reemplaza automáticamente al generar cada carta. La extracción de texto no conserva tablas ni formato complejo — funciona mejor con párrafos simples, como las plantillas actuales.
        </p>
      </div>

      {LETTER_TYPES.map((t) => {
        const active = templates[t.key];
        const p = preview[t.key];
        const tokens = TEMPLATE_TOKENS[t.key] || [];
        const historyOpen = historyOpenFor === t.key;
        return (
          <div key={t.key} className="card card-pad" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 15 }}>{t.label}</h3>
                {active ? (
                  <p className="hint" style={{ marginTop: 4 }}>
                    Versión activa: <b>v{active.version}</b>{active.filename ? ` — ${active.filename}` : ' (formato original del sistema)'} · subida {new Date(active.uploadedAt).toLocaleDateString('es-GT')}
                  </p>
                ) : (
                  <p className="hint" style={{ marginTop: 4, color: 'var(--danger)' }}>Sin plantilla configurada.</p>
                )}
                <p className="hint" style={{ marginTop: 6 }}>Marcadores disponibles: {tokens.map((k) => <code key={k} className="mono" style={{ marginRight: 4 }}>{`{{${k}}}`}</code>)}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  Subir nuevo Word
                  <input type="file" accept=".docx" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(t.key, f); e.target.value = ''; }} />
                </label>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleHistory(t.key)}>{historyOpen ? 'Ocultar historial' : 'Ver historial'}</button>
              </div>
            </div>
            {p && (
              <div className="letter-shell" style={{ marginTop: 16 }}>
                <div className="letter-toolbar">
                  <span className="tag">Vista previa con datos de ejemplo — v{p.version} (aún no activada)</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => discard(t.key)}>Descartar</button>
                    <button className="btn btn-brass btn-sm" onClick={() => activate(t.key)}>Activar esta versión</button>
                  </div>
                </div>
                <div className="letter-paper">{buildLetter(p.content, SAMPLE_CTX)}</div>
              </div>
            )}
            {historyOpen && (
              <div className="table-wrap" style={{ marginTop: 14 }}>
                {!historyData[t.key] ? (
                  <p className="hint">Cargando historial…</p>
                ) : historyData[t.key].length === 0 ? (
                  <p className="hint">Sin versiones anteriores.</p>
                ) : (
                  <table>
                    <thead><tr><th>Versión</th><th>Archivo</th><th>Subida por</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
                    <tbody>
                      {historyData[t.key].map((v) => (
                        <tr key={v.id}>
                          <td>v{v.version}</td>
                          <td>{v.filename ? v.filename : <span className="hint">formato original</span>}</td>
                          <td>{v.uploadedBy || '—'}</td>
                          <td className="mono">{new Date(v.uploadedAt).toLocaleDateString('es-GT')}</td>
                          <td>{v.active && <span className="badge badge-active">Activa</span>}</td>
                          <td>{v.storagePath && <button className="btn btn-ghost btn-sm" onClick={() => downloadVersion(v.id)}>Descargar Word</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}

      {helpOpen && (
        <Modal onClose={() => setHelpOpen(false)} maxWidth={460}>
          <h3>¿Necesitas ayuda con la carta?</h3>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 14 }}>
            Al preparar un nuevo formato en Word, en cada lugar donde debe ir un dato variable (nombre del empleado, fecha, motivo, artículo, etc.) se escribe el marcador correspondiente entre llaves dobles, por ejemplo <code className="mono">{'{{nombreCompleto}}'}</code>. El sistema reemplaza automáticamente cada marcador al generar la carta.
          </p>
          <ul style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '0 0 16px', paddingLeft: 18 }}>
            <li>Se recomiendan párrafos simples; no se conservan tablas ni columnas de Word.</li>
            <li>Los marcadores disponibles para cada tipo de carta aparecen debajo de su tarjeta en esta pantalla.</li>
            <li>Antes de activarse, cada versión nueva se puede revisar en una vista previa con datos de ejemplo.</li>
            <li>Las versiones anteriores quedan guardadas en el historial, con el Word original disponible para descargar.</li>
          </ul>
          <a className="btn btn-brass" href="/assets/ejemplo-plantilla-carta.docx" download style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>Descargar documento de ejemplo (.docx)</a>
          <p className="hint" style={{ marginTop: 10 }}>El ejemplo muestra el formato de Amonestación Escrita con los marcadores señalados; el mismo criterio aplica a las demás cartas, usando la lista de marcadores de cada una.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className="btn btn-ghost" onClick={() => setHelpOpen(false)}>Cerrar</button>
          </div>
        </Modal>
      )}
    </>
  );
}
