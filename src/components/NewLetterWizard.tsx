'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { fullName, toTitleCase, todayISO, fmtDateLong } from '@/lib/format';
import { LETTER_TYPES, letterMeta, computeSuggestion, Suggestion } from '@/lib/discipline';
import { buildLetter, LetterCtx } from '@/lib/letters';
import { downloadDocxFromText, printLetterText } from '@/lib/letterActions';
import { api } from '@/lib/api';
import Combo, { ComboItem } from './Combo';
import SeverityLadder from './SeverityLadder';
import { DisciplinaryRecord } from '@/lib/types';

interface Draft {
  step: number;
  employeeId: string | null;
  faultId: number | null;
  tipo: string | null;
  fields: Record<string, string>;
  savedRecordId: string | null;
}

const STEPS = [
  { n: 1, l: 'Empleado' },
  { n: 2, l: 'Falta' },
  { n: 3, l: 'Tipo de carta' },
  { n: 4, l: 'Detalles' },
  { n: 5, l: 'Carta' },
];

export default function NewLetterWizard() {
  const { employees, faults, records, setRecords, session, wizardStartEmployeeId, setWizardStartEmployeeId } = useApp();
  const [draft, setDraft] = useState<Draft>({ step: 1, employeeId: null, faultId: null, tipo: null, fields: {}, savedRecordId: null });

  useEffect(() => {
    if (wizardStartEmployeeId) {
      setDraft({ step: 2, employeeId: wizardStartEmployeeId, faultId: null, tipo: null, fields: {}, savedRecordId: null });
      setWizardStartEmployeeId(null);
    }
  }, [wizardStartEmployeeId, setWizardStartEmployeeId]);

  const emp = employees.find((e) => e.id === draft.employeeId) || null;
  const fault = faults.find((f) => f.id === draft.faultId) || null;

  function goStep(n: number) { setDraft((d) => ({ ...d, step: n })); }
  function patch(p: Partial<Draft>) { setDraft((d) => ({ ...d, ...p })); }
  function setField(key: string, val: string) { setDraft((d) => ({ ...d, fields: { ...d.fields, [key]: val } })); }

  const maxAllowed = draft.employeeId ? (draft.faultId ? (draft.tipo ? (draft.step >= 4 ? 5 : 4) : 3) : 2) : 1;

  return (
    <>
      <div className="view-title">
        <div><h2>Nueva amonestación</h2><p>Sigue los pasos para generar la carta correcta según el historial del empleado.</p></div>
      </div>
      <div className="steps">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={`step-tab ${draft.step === s.n ? 'current' : draft.step > s.n ? 'done' : ''}`}
            style={s.n <= maxAllowed ? { cursor: 'pointer' } : undefined}
            onClick={() => { if (s.n <= maxAllowed) goStep(s.n); }}
          >
            <span className="step-num">{draft.step > s.n ? '✓' : s.n}</span>{s.l}
          </div>
        ))}
      </div>
      <div className="card card-pad">
        {draft.step === 1 && <StepEmpleado emp={emp} onSelect={(id) => patch({ employeeId: id })} onClear={() => patch({ employeeId: null })} onNext={() => goStep(2)} />}
        {draft.step === 2 && (
          <StepFalta
            emp={emp} fault={fault} records={records}
            onSelect={(id) => patch({ faultId: id })}
            onClear={() => patch({ faultId: null })}
            onBack={() => goStep(1)}
            onNext={(suggestedTipo) => patch({ tipo: suggestedTipo, step: 3 })}
          />
        )}
        {draft.step === 3 && (
          <StepTipo emp={emp} fault={fault} records={records} tipo={draft.tipo} onPick={(t) => patch({ tipo: t })} onBack={() => goStep(2)} onNext={() => goStep(4)} />
        )}
        {draft.step === 4 && emp && draft.tipo && (
          <StepDetalles
            emp={emp} fault={fault} tipo={draft.tipo} fields={draft.fields} sessionName={session?.name || ''}
            onField={setField} onBack={() => goStep(3)} onNext={() => goStep(5)}
          />
        )}
        {draft.step === 5 && emp && draft.tipo && (
          <StepCarta
            emp={emp} fault={fault} tipo={draft.tipo} fields={draft.fields} savedRecordId={draft.savedRecordId}
            onBack={() => goStep(4)}
            onSaved={(id) => patch({ savedRecordId: id })}
            onStartNew={() => setDraft({ step: 1, employeeId: null, faultId: null, tipo: null, fields: {}, savedRecordId: null })}
            registerRecord={(rec) => setRecords((prev) => [...prev, rec])}
          />
        )}
      </div>
    </>
  );
}

function StepEmpleado({ emp, onSelect, onClear, onNext }: {
  emp: ReturnType<typeof useApp>['employees'][number] | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  onNext: () => void;
}) {
  const { employees, records } = useApp();

  function items(query: string): ComboItem[] {
    const q = query.trim().toLowerCase();
    let list = employees.filter((e) => (e.status || 'Activo') === 'Activo');
    if (q) list = list.filter((e) => fullName(e).toLowerCase().includes(q) || (e.puesto || '').toLowerCase().includes(q) || (e.departamento || '').toLowerCase().includes(q));
    list.sort((a, b) => fullName(a).localeCompare(fullName(b)));
    return list.slice(0, 80).map((e) => ({ id: e.id, primary: fullName(e), secondary: `${e.departamento || '—'} — ${e.puesto || '—'}` }));
  }

  return (
    <>
      <label>Selecciona el empleado a amonestar</label>
      <Combo placeholder="Escribe un nombre…" initialText={emp ? fullName(emp) : ''} items={items} onSelect={onSelect} onClear={onClear} />
      {emp ? (
        <div className="suggestion-box" style={{ marginTop: 16 }}>
          <div className="headline">{fullName(emp)}</div>
          <div className="detail">{emp.puesto || '—'} · {emp.departamento || '—'} · {records.filter((r) => r.employeeId === emp.id).length} amonestación(es) previa(s) en su historial</div>
        </div>
      ) : (
        <p className="hint" style={{ marginTop: 10 }}>Si el empleado no aparece en la lista, agrégalo primero desde &ldquo;Empleados&rdquo;.</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
        <button className="btn btn-primary" disabled={!emp} onClick={onNext}>Continuar</button>
      </div>
    </>
  );
}

function StepFalta({ emp, fault, records, onSelect, onClear, onBack, onNext }: {
  emp: ReturnType<typeof useApp>['employees'][number] | null;
  fault: ReturnType<typeof useApp>['faults'][number] | null;
  records: DisciplinaryRecord[];
  onSelect: (id: number) => void;
  onClear: () => void;
  onBack: () => void;
  onNext: (suggestedTipo: string) => void;
}) {
  const { faults } = useApp();

  function items(query: string): ComboItem[] {
    const q = query.trim().toLowerCase();
    let list = faults.slice().sort((a, b) => a.id - b.id);
    if (q) list = list.filter((f) => String(f.id).includes(q) || f.descripcion.toLowerCase().includes(q) || (f.articulo || '').toLowerCase().includes(q));
    return list.slice(0, 80).map((f) => ({ id: String(f.id), primary: `#${f.id} — ${f.descripcion}`, secondary: `Art. ${f.articulo || '—'}` }));
  }

  const suggestion: Suggestion | null = emp && fault ? computeSuggestion(records, faults, emp.id, fault.id) : null;

  function handleContinue() {
    if (!suggestion) { onNext('convocatoria'); return; }
    onNext(suggestion.letter || 'convocatoria');
  }

  return (
    <>
      <label>Selecciona la falta laboral cometida</label>
      <Combo
        placeholder="Escribe para buscar por descripción o artículo…"
        initialText={fault ? `#${fault.id} — ${fault.descripcion}` : ''}
        items={items}
        onSelect={(id) => onSelect(Number(id))}
        onClear={onClear}
      />
      {fault && (
        <div className="hint" style={{ marginTop: 8 }}>Artículo de referencia: <b className="mono">{fault.articulo || '—'}</b>{fault.observaciones ? ` · ${fault.observaciones}` : ''}</div>
      )}
      {fault && emp && suggestion && (
        suggestion.isDespido || suggestion.beyondMatrix ? (
          <>
            <div style={{ marginTop: 18 }}><SeverityLadder fault={fault} activeOrdinal={suggestion.ordinal} /></div>
            <div className="rrhh-alert">
              <div className="headline">Ocurrencia {suggestion.occurrenceIndex}ª ({suggestion.ordinal.toLowerCase()}) de esta falta para {fullName(emp)}</div>
              <div className="detail">Según la guía de sanciones, en este nivel de reincidencia el caso debe <b>trasladarse a Recursos Humanos</b> para evaluar despido. Esta herramienta no genera carta de despido — continúa solo si vas a documentar una convocatoria a audiencia previa, o coordina directamente con RR.HH.</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: 18 }}><SeverityLadder fault={fault} activeOrdinal={suggestion.ordinal} /></div>
            <div className="suggestion-box">
              <div className="headline">Sugerencia: {letterMeta(suggestion.letter || '').label} — {suggestion.ordinal.toLowerCase()} ocurrencia de esta falta</div>
              <div className="detail">{fullName(emp)} tiene {suggestion.occurrenceIndex - 1} registro(s) previo(s) de esta misma falta. Según la guía disciplinaria, corresponde <b>{letterMeta(suggestion.letter || '').label}</b>. Podrás cambiar el tipo de carta en el siguiente paso si la situación lo amerita.</div>
            </div>
          </>
        )
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
        <button className="btn btn-ghost" onClick={onBack}>Atrás</button>
        <button className="btn btn-primary" disabled={!fault} onClick={handleContinue}>Continuar</button>
      </div>
    </>
  );
}

function StepTipo({ emp, fault, records, tipo, onPick, onBack, onNext }: {
  emp: ReturnType<typeof useApp>['employees'][number] | null;
  fault: ReturnType<typeof useApp>['faults'][number] | null;
  records: DisciplinaryRecord[];
  tipo: string | null;
  onPick: (t: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { faults } = useApp();
  const suggestion = emp && fault ? computeSuggestion(records, faults, emp.id, fault.id) : null;
  return (
    <>
      <label>Tipo de carta a emitir</label>
      <p className="hint" style={{ marginBottom: 12 }}>La opción resaltada es la sugerida según el historial; puedes elegir otra si la situación lo requiere.</p>
      <div className="tab-row">
        {LETTER_TYPES.map((t) => (
          <button key={t.key} className={`pill-btn ${tipo === t.key ? 'active' : ''}`} onClick={() => onPick(t.key)}>
            {t.label}{suggestion && suggestion.letter === t.key ? ' ★' : ''}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={onBack}>Atrás</button>
        <button className="btn btn-primary" disabled={!tipo} onClick={onNext}>Continuar</button>
      </div>
    </>
  );
}

function StepDetalles({ emp, fault, tipo, fields, sessionName, onField, onBack, onNext }: {
  emp: ReturnType<typeof useApp>['employees'][number];
  fault: ReturnType<typeof useApp>['faults'][number] | null;
  tipo: string;
  fields: Record<string, string>;
  sessionName: string;
  onField: (key: string, val: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const fdef = (key: string, def: string) => (fields[key] !== undefined ? fields[key] : def);
  const today = fdef('fecha', todayISO());
  const atencion = fdef('atencion', 'Señor');
  const motivo = fdef('motivo', fault ? fault.descripcion : '');
  const articulo = fdef('articulo', fault ? fault.articulo : '');
  const supervisorNombre = fdef('supervisorNombre', sessionName);
  const supervisorCargo = fdef('supervisorCargo', '');

  const needsFechaFalta = ['verbal', 'apercibimiento'].includes(tipo);
  const needsArticulo = ['verbal', 'escrita', 'suspension', 'apercibimiento'].includes(tipo);
  const needsSuspDays = tipo === 'suspension' || tipo === 'apercibimiento';
  const needsCitacion = tipo === 'convocatoria';
  const needsCargo = tipo === 'asesoramiento' || tipo === 'escrita';

  return (
    <>
      <label>Encabezado de la carta</label>
      <div className="field-row">
        <div className="field"><label>Fecha de la carta</label><input type="date" value={today} onChange={(e) => onField('fecha', e.target.value)} /></div>
        <div className="field">
          <label>Trato</label>
          <select value={atencion} onChange={(e) => onField('atencion', e.target.value)}>
            <option value="Señor">Señor</option>
            <option value="Señora">Señora</option>
            <option value="Señorita">Señorita</option>
          </select>
        </div>
      </div>

      {needsFechaFalta && (
        <div className="field"><label>Fecha en que ocurrió la falta</label><input type="date" value={fdef('fechaFalta', '')} onChange={(e) => onField('fechaFalta', e.target.value)} /></div>
      )}

      <div className="field">
        <label>Descripción de la falta / motivo (se colocará entre comillas en la carta)</label>
        <textarea value={motivo} onChange={(e) => onField('motivo', e.target.value)} />
      </div>

      {needsArticulo && (
        <div className="field"><label>Artículo(s) del Código de Trabajo</label><input type="text" value={articulo} onChange={(e) => onField('articulo', e.target.value)} /></div>
      )}

      {needsSuspDays && (
        <div className="field-row">
          <div className="field">
            <label>Días de suspensión</label>
            <select value={fdef('diasSuspension', '1')} onChange={(e) => onField('diasSuspension', e.target.value)}>
              {(tipo === 'suspension' ? [1, 2, 3] : [1, 2, 3, 4, 5]).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Días que debe cumplir (detállalos, deben ser corridos)</label>
            <input type="text" placeholder="ej. el viernes 04 y sábado 05 de abril del presente año" value={fdef('fechasSuspension', '')} onChange={(e) => onField('fechasSuspension', e.target.value)} />
          </div>
        </div>
      )}

      {needsCitacion && (
        <div className="field-row">
          <div className="field"><label>Fecha de la audiencia</label><input type="date" value={fdef('fechaCitacion', '')} onChange={(e) => onField('fechaCitacion', e.target.value)} /></div>
          <div className="field"><label>Hora de la audiencia</label><input type="time" value={fdef('horaCitacion', '')} onChange={(e) => onField('horaCitacion', e.target.value)} /></div>
        </div>
      )}

      <div className="field-row">
        <div className="field"><label>Nombre de quien firma (gerente/supervisor)</label><input type="text" value={supervisorNombre} onChange={(e) => onField('supervisorNombre', e.target.value)} /></div>
        {needsCargo && <div className="field"><label>Puesto de quien firma</label><input type="text" value={supervisorCargo} onChange={(e) => onField('supervisorCargo', e.target.value)} /></div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={onBack}>Atrás</button>
        <button className="btn btn-primary" onClick={onNext}>Generar carta</button>
      </div>
    </>
  );
}

function buildCtx(fields: Record<string, string>, emp: ReturnType<typeof useApp>['employees'][number], fault: ReturnType<typeof useApp>['faults'][number] | null, sessionName: string): LetterCtx {
  let horaCitacion = fields.horaCitacion || '';
  if (horaCitacion) {
    const [hh, mm] = horaCitacion.split(':').map(Number);
    const period = hh >= 12 ? 'p.m.' : 'a.m.';
    const h12 = ((hh + 11) % 12) + 1;
    horaCitacion = `${h12}:${String(mm).padStart(2, '0')} ${period}`;
  }
  return {
    departamento: emp.departamento,
    atencion: fields.atencion || 'Señor',
    nombreCompleto: toTitleCase(fullName(emp)),
    apellidos: toTitleCase(emp.apellidos),
    fecha: fields.fecha || todayISO(),
    fechaFalta: fields.fechaFalta || '',
    motivo: fields.motivo || (fault ? fault.descripcion : ''),
    articulo: fields.articulo || (fault ? fault.articulo : ''),
    supervisorNombre: fields.supervisorNombre || sessionName,
    supervisorCargo: fields.supervisorCargo || '',
    diasSuspension: fields.diasSuspension || '1',
    fechasSuspension: fields.fechasSuspension || '',
    fechaCitacion: fields.fechaCitacion || '',
    horaCitacion,
  };
}

function StepCarta({ emp, fault, tipo, fields, savedRecordId, onBack, onSaved, onStartNew, registerRecord }: {
  emp: ReturnType<typeof useApp>['employees'][number];
  fault: ReturnType<typeof useApp>['faults'][number] | null;
  tipo: string;
  fields: Record<string, string>;
  savedRecordId: string | null;
  onBack: () => void;
  onSaved: (id: string) => void;
  onStartNew: () => void;
  registerRecord: (rec: DisciplinaryRecord) => void;
}) {
  const { templates, session } = useApp();
  const ctx = buildCtx(fields, emp, fault, session?.name || '');
  const template = templates[tipo];
  const text = buildLetter(template?.content, ctx);

  function filenameBase() {
    const name = fullName(emp).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${tipo}-${name}-${todayISO()}`;
  }

  async function handleSave() {
    const payload = {
      employeeId: emp.id,
      employeeSnapshot: { nombres: emp.nombres, apellidos: emp.apellidos, departamento: emp.departamento, puesto: emp.puesto },
      faultId: fault ? fault.id : null,
      faultDescripcion: ctx.motivo,
      articulo: ctx.articulo,
      tipo,
      fecha: ctx.fecha,
      fechaFalta: ctx.fechaFalta || null,
      diasSuspension: ctx.diasSuspension,
      cartaTexto: text,
    };
    try {
      const saved = await api.post<DisciplinaryRecord>('/api/records', payload);
      registerRecord(saved);
      onSaved(saved.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo guardar el registro.');
    }
  }

  return (
    <>
      <div className="letter-shell">
        <div className="letter-toolbar">
          <span className="tag">Vista previa — {letterMeta(tipo).label}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>Editar datos</button>
            <button className="btn btn-ghost btn-sm" onClick={() => printLetterText(text)}>Descargar PDF</button>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadDocxFromText(text, filenameBase())}>Descargar Word</button>
          </div>
        </div>
        <div className="letter-paper">{text}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={onBack}>Atrás</button>
        {savedRecordId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: 13 }}>✓ Registro guardado en el historial</span>
            <button className="btn btn-primary" onClick={onStartNew}>Crear otra amonestación</button>
          </div>
        ) : (
          <button className="btn btn-brass" onClick={handleSave}>Guardar en el historial</button>
        )}
      </div>
    </>
  );
}
