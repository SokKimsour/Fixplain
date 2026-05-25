import { vscDarkPlus, oneLight, dracula, atomDark, nord } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const mono = "'JetBrains Mono', monospace";
export const sans = "'Sora', sans-serif";
export const khmer = "'Hanuman', 'Noto Sans Khmer', sans-serif";

export const darkTheme = {
  bgBase: '#1e1e1e',
  bgPanel: '#252526',
  bgSurface: '#2d2d2d',
  border: '#333333',
  borderSoft: '#2a2a2a',
  teal: '#2dd4bf',
  tealDim: '#1a8a7c',
  tealGlow: 'rgba(45,212,191,0.12)',
  red: '#f87171',
  redGlow: 'rgba(248,113,113,0.08)',
  green: '#4ade80',
  amber: '#fbbf24',
  blue: '#60a5fa',
  purple: '#a78bfa',
  text1: '#f0f2f8',
  text2: '#c4c9d8',
  text3: '#8b92a8',
  navBg: 'rgba(30,30,30,0.92)',
  codeTheme: vscDarkPlus,
  codeBg: '#1e1e1e',
  lineNumBg: '#252526',
  lineNumColor: '#8b92a8',
  isDark: true
};

export const lightTheme = {
  bgBase: '#eef1f7',
  bgPanel: '#ffffff',
  bgSurface: '#f4f6fb',
  border: '#6b7280',
  borderSoft: '#9ca3af',
  teal: '#0e7490',
  tealDim: '#0c6a82',
  tealGlow: 'rgba(14,116,144,0.10)',
  red: '#c0392b',
  redGlow: 'rgba(192,57,43,0.07)',
  green: '#15803d',
  amber: '#92400e',
  blue: '#1e40af',
  purple: '#5b21b6',
  text1: '#0a0e1a',
  text2: '#1e2a3b',
  text3: '#4b5873',
  navBg: 'rgba(238,241,247,0.97)',
  codeTheme: oneLight,
  codeBg: '#f1f4f9',
  lineNumBg: '#e8ecf4',
  lineNumColor: '#4b5873',
  isDark: false,
};

export const THEMES = {
  dark: { 'VS Dark': vscDarkPlus, 'Dracula': dracula, 'Atom Dark': atomDark, 'Nord': nord },
  light: { 'One Light': oneLight },
};

export const SEVERITY_STYLE = {
  high: { dark: { bg: '#450a0a', color: '#f87171' }, light: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' } },
  medium: { dark: { bg: '#422006', color: '#fbbf24' }, light: { bg: 'rgba(217,119,6,0.1)', color: '#d97706' } },
  low: { dark: { bg: '#172554', color: '#60a5fa' }, light: { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' } },
};
