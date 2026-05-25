import React from 'react';
import { mono } from '../../constants/themes';

export default function Toast({ message, visible, c, undoable }) {
  return (
    <div
      onClick={undoable && window._fpUndo ? () => window._fpUndo() : undefined}
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        background: c.bgSurface,
        border: `1px solid ${c.green}`,
        color: c.green,
        fontFamily: mono,
        fontSize: 14,
        padding: '8px 18px',
        borderRadius: 20,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.25s, transform 0.25s',
        pointerEvents: visible && undoable ? 'all' : 'none',
        zIndex: 200,
        cursor: undoable ? 'pointer' : 'default'
      }}
    >
      ✓ {message}
    </div>
  );
}
