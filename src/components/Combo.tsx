'use client';

import { useState, useRef, useEffect } from 'react';

export interface ComboItem {
  id: string;
  primary: string;
  secondary: string;
}

interface ComboProps {
  placeholder: string;
  initialText: string;
  items: (query: string) => ComboItem[];
  onSelect: (id: string) => void;
  onClear: () => void;
}

export default function Combo({ placeholder, initialText, items, onSelect, onClear }: ComboProps) {
  const [text, setText] = useState(initialText);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setText(initialText), [initialText]);

  const results = open ? items(text) : [];

  function handleFocus() {
    setOpen(true);
  }
  function handleBlur() {
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  }
  function handleChange(value: string) {
    setText(value);
    setOpen(true);
    onClear();
  }
  function handleSelect(id: string) {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(false);
    onSelect(id);
  }

  return (
    <div className="combo">
      <input
        type="text"
        className="combo-input"
        placeholder={placeholder}
        value={text}
        autoComplete="off"
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {open && (
        <div className="combo-list" style={{ display: 'block' }}>
          {results.length === 0 ? (
            <div className="combo-empty">Sin resultados</div>
          ) : (
            results.map((item) => (
              <div key={item.id} className="combo-item" onMouseDown={(e) => { e.preventDefault(); handleSelect(item.id); }}>
                <div className="combo-item-primary">{item.primary}</div>
                <div className="combo-item-secondary">{item.secondary}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
