import React from 'react';
import { mono } from '../constants/themes';

export default function LoadingSkeleton({ c, progressStep }) {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: c.teal,
              display: 'inline-block',
              animation: `fpShimmer 1.2s ease-in-out ${i * 0.15}s infinite`
            }}
          />
        ))}
        <span style={{ fontFamily: mono, fontSize: 13, color: c.teal, marginLeft: 4 }}>
          {progressStep}
        </span>
      </div>
      {[[28, 88, 60], [35, 92, 72], [20, 78]].map((ws, gi) => (
        <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {ws.map((w, i) => (
            <div
              key={i}
              style={{
                height: i === 0 ? 11 : 8,
                width: `${w}%`,
                background: c.bgSurface,
                borderRadius: 6,
                animation: `fpShimmer 1.6s ease-in-out ${gi * 0.2}s infinite`
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
