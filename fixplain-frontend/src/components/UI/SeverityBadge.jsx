import React from 'react';
import { mono, SEVERITY_STYLE } from '../../constants/themes';

export const SeverityBadge = ({ severity, isDark, label }) => {
  const st = (SEVERITY_STYLE[severity] || SEVERITY_STYLE.low)[isDark ? 'dark' : 'light'];
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: 13,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 20,
        background: st.bg,
        color: st.color,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        flexShrink: 0
      }}
    >
      {label}
    </span>
  );
};
