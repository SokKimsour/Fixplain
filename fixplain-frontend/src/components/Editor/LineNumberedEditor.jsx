import React, { useEffect, useRef } from 'react';
import { mono } from '../../constants/themes';

export default function LineNumberedEditor({
  c,
  value,
  onChange,
  onPaste,
  isDragging,
  highlightLine,
  placeholder,
  dropFileLabel
}) {
  const taRef = useRef(null);
  const lnRef = useRef(null);
  const lines = value ? value.split('\n') : [''];

  const sync = () => {
    if (lnRef.current && taRef.current) {
      lnRef.current.scrollTop = taRef.current.scrollTop;
    }
  };

  // Scroll the editor to the highlighted line when a line badge is clicked
  useEffect(() => {
    if (highlightLine && taRef.current) {
      const lineH = 13 * 1.8; // fontSize 13px * lineHeight 1.8 + padding
      const targetScrollTop = (highlightLine - 1) * lineH - taRef.current.clientHeight / 3;
      taRef.current.scrollTop = Math.max(0, targetScrollTop);
      if (lnRef.current) {
        lnRef.current.scrollTop = taRef.current.scrollTop;
      }
    }
  }, [highlightLine]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: c.isDark ? 'rgba(45,212,191,0.08)' : 'rgba(13,148,136,0.06)',
            border: `2px dashed ${c.teal}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            flexDirection: 'column',
            gap: 8
          }}
        >
          <span style={{ fontSize: 26 }}>⬇</span>
          <span style={{ fontFamily: mono, fontSize: 15, color: c.teal }}>{dropFileLabel || 'drop file here'}</span>
        </div>
      )}
      {value.trim() && (
        <div
          ref={lnRef}
          style={{
            background: c.lineNumBg,
            borderRight: `1px solid ${c.borderSoft}`,
            padding: '1rem 8px 1rem 12px',
            textAlign: 'right',
            fontFamily: mono,
            fontSize: 15,
            lineHeight: 1.8,
            userSelect: 'none',
            overflowY: 'hidden',
            minWidth: 42,
            color: c.lineNumColor
          }}
        >
          {lines.map((_, i) => {
            const isH = highlightLine === i + 1;
            return (
              <div
                key={i}
                style={{
                  height: '1.8em',
                  color: isH ? c.red : c.lineNumColor,
                  fontWeight: isH ? 700 : 400,
                  background: isH ? c.redGlow : 'transparent',
                  borderRadius: 3,
                  padding: '0 4px',
                  transition: '0.2s'
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      )}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={sync}
        onPaste={onPaste}
        spellCheck={false}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: c.text1,
          fontFamily: mono,
          fontSize: 16,
          lineHeight: 1.8,
          padding: '1rem 1.25rem',
          resize: 'none',
          tabSize: 2,
          overflowY: 'auto',
          overflowX: 'hidden',
          minWidth: 0,
          width: '100%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      />
    </div>
  );
}
