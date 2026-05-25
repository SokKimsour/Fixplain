import React, { useState, useEffect } from 'react';
import { mono, sans } from '../constants/themes';

export default function OnboardingTour({ c, t, onDone }) {
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState(null);
  const steps = t.tour.steps;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  // Selector for each step's target element
  const selectors = [
    '[data-tour="editor"]',
    '[data-tour="modes"]',
    '[data-tour="analyze"]',
    '[data-tour="results"]',
    '[data-tour="actions"]'
  ];

  // Measure the target element whenever step changes
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(selectors[step]);
      if (el) {
        const r = el.getBoundingClientRect();
        setSpotRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setSpotRect(null);
      }
    };
    measure();
    // Re-measure on resize
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step]);

  const PAD = 10; // spotlight padding around element
  const sp = spotRect ? {
    top: spotRect.top - PAD,
    left: spotRect.left - PAD,
    width: spotRect.width + PAD * 2,
    height: spotRect.height + PAD * 2,
  } : null;

  // Place the tooltip card — prefer below, fall back to above if near bottom
  const cardStyle = () => {
    if (!sp) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    const cardW = 300, cardH = 220, margin = 16, vp = window.innerHeight;
    const belowSpace = vp - (sp.top + sp.height);
    const aboveSpace = sp.top;
    let top, left;
    if (belowSpace >= cardH + margin) {
      top = sp.top + sp.height + margin;
    } else if (aboveSpace >= cardH + margin) {
      top = sp.top - cardH - margin;
    } else {
      top = Math.max(margin, vp / 2 - cardH / 2);
    }
    left = Math.min(Math.max(margin, sp.left), window.innerWidth - cardW - margin);
    return { top, left, width: cardW };
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }}>
      {/* Dark overlay with spotlight hole using SVG */}
      {sp && (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'all' }}
          onClick={e => { if (e.target.tagName === 'path') return; }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={sp.left} y={sp.top}
                width={sp.width} height={sp.height}
                rx="12" fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#spotlight-mask)" />
          {/* Glowing border around spotlight */}
          <rect
            x={sp.left} y={sp.top}
            width={sp.width} height={sp.height}
            rx="12" fill="none"
            stroke="#2dd4bf" strokeWidth="2" opacity="0.8"
          />
        </svg>
      )}
      {!sp && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', pointerEvents: 'all' }} />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position: 'absolute',
          ...cardStyle(),
          background: c.bgPanel,
          border: `1.5px solid ${c.teal}`,
          borderRadius: 16,
          padding: '20px 22px',
          pointerEvents: 'all',
          animation: 'fpFadeIn 0.2s ease',
          zIndex: 201,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 22, color: c.teal, lineHeight: 1 }}>{steps[step].icon}</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: c.teal, background: c.tealGlow, padding: '2px 8px', borderRadius: 20 }}>
              {step + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={onDone}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text3, fontFamily: mono, fontSize: 13, padding: '2px 6px', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = c.text1}
            onMouseLeave={e => e.currentTarget.style.color = c.text3}
          >
            {t.tour.skip}
          </button>
        </div>

        {/* Title */}
        <p style={{ fontFamily: sans, fontSize: 17, fontWeight: 600, color: c.text1, margin: '0 0 8px' }}>
          {steps[step].title}
        </p>

        {/* Body */}
        <p style={{ fontFamily: sans, fontSize: 15, color: c.text2, lineHeight: 1.7, margin: '0 0 16px' }}>
          {steps[step].body}
        </p>

        {/* Progress bar */}
        <div style={{ height: 3, background: c.border, borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: c.teal, borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? c.teal : c.border,
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!isFirst && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  fontFamily: mono,
                  fontSize: 13,
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: `1px solid ${c.border}`,
                  background: 'transparent',
                  color: c.text2,
                  cursor: 'pointer',
                  transition: '0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = c.tealDim;
                  e.currentTarget.style.color = c.teal;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = c.border;
                  e.currentTarget.style.color = c.text2;
                }}
              >
                {t.tour.back}
              </button>
            )}
            <button
              onClick={() => isLast ? onDone() : setStep(s => s + 1)}
              style={{
                fontFamily: mono,
                fontSize: 13,
                padding: '6px 14px',
                borderRadius: 20,
                border: `1.5px solid ${c.tealDim}`,
                background: c.tealGlow,
                color: c.teal,
                cursor: 'pointer',
                fontWeight: 600,
                transition: '0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,212,191,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = c.tealGlow}
            >
              {isLast ? t.tour.done : t.tour.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
