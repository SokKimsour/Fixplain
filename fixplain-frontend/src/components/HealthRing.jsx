import React from 'react';
import { mono } from '../constants/themes';
import { healthColor, computeHealthScore } from '../utils/helpers';

export default function HealthRing({ score, c, label, isMobile, bugs, t }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = healthColor(score, c);
  const highBugs = bugs.filter(b => b.severity === 'high');
  const medBugs = bugs.filter(b => b.severity === 'medium');
  const deductions = highBugs.length * 25 + medBugs.length * 12;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 14px',
        background: c.bgSurface,
        borderRadius: 12,
        border: `1px solid ${c.borderSoft}`,
        width: isMobile ? '100%' : 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width={50} height={50} style={{ flexShrink: 0 }}>
          <circle cx={25} cy={25} r={r} fill="none" stroke={c.border} strokeWidth={3} />
          <circle
            cx={25}
            cy={25}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 25 25)"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
          <text
            x={25}
            y={29}
            textAnchor="middle"
            fontFamily={mono}
            fontSize={11}
            fontWeight={600}
            fill={color}
          >
            {score}
          </text>
        </svg>
        <div>
          <p style={{ fontFamily: mono, fontSize: 12, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>
            {label}
          </p>
          <p style={{ fontFamily: mono, fontSize: 14, color, fontWeight: 600, margin: 0 }}>
            {score >= 80 ? t.healthy : score >= 50 ? t.needsWork : t.critical}
          </p>
        </div>
      </div>
      {deductions > 0 && (
        <div style={{ borderTop: `1px solid ${c.borderSoft}`, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontFamily: mono, fontSize: 13, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {t.scoreBreakdown}
          </span>
          {highBugs.length > 0 && (
            <span style={{ fontFamily: mono, fontSize: 14, color: c.red }}>
              −{highBugs.length * 25} · {highBugs.length} high {highBugs.length === 1 ? 'bug' : 'bugs'} (×25)
            </span>
          )}
          {medBugs.length > 0 && (
            <span style={{ fontFamily: mono, fontSize: 14, color: c.amber }}>
              −{medBugs.length * 12} · {medBugs.length} medium {medBugs.length === 1 ? 'bug' : 'bugs'} (×12)
            </span>
          )}
          <span style={{ fontFamily: mono, fontSize: 14, color }}>
            = {score}/100
          </span>
        </div>
      )}
    </div>
  );
}
