'use client';

import { ReactNode } from 'react';

export default function Modal({ children, onClose, maxWidth }: { children: ReactNode; onClose: () => void; maxWidth?: number }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={maxWidth ? { maxWidth } : undefined}>
        {children}
      </div>
    </div>
  );
}
