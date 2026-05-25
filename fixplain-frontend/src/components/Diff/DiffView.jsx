import React from 'react';
import { computeDiff } from '../../utils/diff';
import { mono } from '../../constants/themes';

export default function DiffView({ original, fixed, c, screenW, isDark, t }) {
  const diff = computeDiff(original, fixed);
  const isMobileView = screenW < 768;

  const added = diff.filter(r => r.type === 'added').length;
  const removed = diff.filter(r => r.type === 'removed').length;
  const changed = diff.filter(r => r.type === 'changed').length;

  // Unified line numbers
  let oNum = 1, fNum = 1;
  const rows = diff.map(row => {
    const o = row.type !== 'added' ? oNum++ : null;
    const f = row.type !== 'removed' ? fNum++ : null;
    return { ...row, oNum: o, fNum: f };
  });

  const typeStyle = (type) => {
    if (type === 'added') return { bg: 'rgba(74,222,128,0.10)', color: c.green, symbol: '+', numColor: c.green };
    if (type === 'removed') return { bg: c.redGlow, color: c.red, symbol: '-', numColor: c.red };
    if (type === 'changed') return { bg: 'rgba(245,158,11,0.08)', color: c.amber, symbol: '~', numColor: c.amber };
    return { bg: 'transparent', color: c.text2, symbol: ' ', numColor: c.text3 };
  };

  // If no changes at all, show a clean message
  if (added === 0 && removed === 0 && changed === 0) {
    return (
      <div style={{ borderRadius: 10, border: `1px solid ${c.borderSoft}`, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: c.bgSurface }}>
        <span style={{ fontSize: 26, color: c.green }}>✓</span>
        <span style={{ fontFamily: mono, fontSize: 14, color: c.text2 }}>{t?.diffNoChanges || 'No changes — code already matches fixed version'}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 10, border: `1px solid ${c.borderSoft}`, overflow: 'hidden' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px', background: c.bgSurface, borderBottom: `1px solid ${c.borderSoft}`, fontFamily: mono, fontSize: 12, flexWrap: 'wrap' }}>
        <span style={{ color: c.text3 }}>diff</span>
        {added > 0 && <span style={{ color: c.green }}>+{added} added</span>}
        {removed > 0 && <span style={{ color: c.red }}>−{removed} removed</span>}
        {changed > 0 && <span style={{ color: c.amber }}>~{changed} changed</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {[...Array(Math.min(20, diff.length))].map((_, i) => {
            const row = rows[Math.floor(i * rows.length / 20)];
            const col = row?.type === 'added' ? c.green : row?.type === 'removed' ? c.red : row?.type === 'changed' ? c.amber : c.border;
            return <span key={i} style={{ width: 3, height: 10, borderRadius: 1, background: col, display: 'inline-block' }} />;
          })}
        </div>
      </div>

      {/* Diff lines */}
      {isMobileView ? (
        <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: 400, fontFamily: mono, fontSize: 14, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {rows.map((row, i) => {
            const s = typeStyle(row.type);
            const content = row.type === 'removed' ? row.orig : row.fixed;
            if (!content && row.type === 'same') return null;
            return (
              <div key={i} style={{ display: 'flex', background: s.bg, minHeight: 22, borderLeft: `2px solid ${row.type === 'same' ? 'transparent' : s.color}` }}>
                <span style={{ color: s.numColor, minWidth: 18, padding: '0 6px', userSelect: 'none', lineHeight: '22px', flexShrink: 0, fontWeight: 600, fontSize: 12 }}>{s.symbol}</span>
                <span style={{ color: s.color, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '22px', flex: 1, padding: '0 8px 0 0' }}>{content}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxHeight: 400, overflow: 'hidden' }}>
          {['orig', 'fixed'].map(side => (
            <div key={side} style={{ borderRight: side === 'orig' ? `1px solid ${c.borderSoft}` : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '4px 12px', background: c.bgSurface, borderBottom: `1px solid ${c.borderSoft}`, fontFamily: mono, fontSize: 12, color: side === 'orig' ? c.red : c.green, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10 }}>●</span>
                {side === 'orig' ? t.diffOriginal : t.diffFixed}
              </div>
              <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {rows.map((row, i) => {
                  const content = side === 'orig' ? row.orig : row.fixed;
                  const lineNum = side === 'orig' ? row.oNum : row.fNum;
                  const s = typeStyle(row.type);
                  const isEmpty = content === '' && (
                    (side === 'orig' && row.type === 'added') ||
                    (side === 'fixed' && row.type === 'removed')
                  );
                  return (
                    <div key={i} style={{ display: 'flex', background: isEmpty ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : s.bg, minHeight: 22, borderLeft: `2px solid ${row.type === 'same' || isEmpty ? 'transparent' : s.color}` }}>
                      <span style={{ fontFamily: mono, fontSize: 12, color: isEmpty ? c.border : s.numColor, minWidth: 32, padding: '0 6px', userSelect: 'none', lineHeight: '22px', textAlign: 'right', flexShrink: 0 }}>
                        {isEmpty ? '' : (lineNum ?? '')}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: s.numColor, minWidth: 12, lineHeight: '22px', flexShrink: 0, opacity: isEmpty ? 0 : 1 }}>{row.type === 'same' ? ' ' : s.symbol}</span>
                      <span style={{ fontFamily: mono, fontSize: 14, color: isEmpty ? 'transparent' : s.color, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '22px', flex: 1, padding: '0 8px 0 2px' }}>
                        {isEmpty ? '·' : content}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
