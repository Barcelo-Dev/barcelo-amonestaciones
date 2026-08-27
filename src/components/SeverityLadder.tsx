import { Fault } from '@/lib/types';
import { ORDINALS } from '@/lib/discipline';

const COLS: { key: keyof Fault; color: string }[] = [
  { key: 'asesoramiento', color: 'var(--lvl1)' },
  { key: 'verbal', color: 'var(--lvl2)' },
  { key: 'escrita', color: 'var(--lvl3)' },
  { key: 'susp13', color: 'var(--lvl4)' },
  { key: 'susp15', color: 'var(--lvl5)' },
  { key: 'despido', color: 'var(--lvl6)' },
];

export default function SeverityLadder({ fault, activeOrdinal }: { fault: Fault; activeOrdinal: string }) {
  return (
    <>
      <div className="ladder">
        {COLS.map((c) => {
          const val = String(fault[c.key] || '').trim().toUpperCase();
          const has = !!val;
          const isActive = val === activeOrdinal;
          return (
            <div
              key={c.key}
              className={`rung ${isActive ? 'lit' : ''}`}
              style={{ background: isActive ? c.color : has ? '#e7e2d3' : '#f1eee5' }}
            />
          );
        })}
      </div>
      <div className="rung-labels">
        {ORDINALS.map((o) => (
          <span key={o} className={o === activeOrdinal ? 'active-lbl' : ''}>{o.slice(0, 4)}</span>
        ))}
      </div>
    </>
  );
}
