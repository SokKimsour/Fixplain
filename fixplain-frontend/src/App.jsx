import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect, useCallback, useRef, Component } from 'react';
import jsPDF from 'jspdf';
import AnimatedBackground from './AnimatedBackground';

// ── i18n ──────────────────────────────────────────────────────────────────────
const i18n = {
  en: {
    tagline: 'Fix it. Explain it. Learn from it.',
    subtitle: 'Paste your code — get instant bug fixes, refactors & plain-language explanations.',
    analyzeBtn: '⚡  Analyze & Fix Code', analyzingBtn: '◌  Analyzing...',
    reanalyzeBtn: '↺  Re-analyze', clearBtn: 'clear ✕', toAnalyze: 'to analyze',
    history: 'Recent history', clearAll: 'clear all',
    noBugs: 'No bugs detected', commentedLabel: '✦ auto-commented version',
    noCommented: 'No commented version returned yet.',
    noCommentedHint: 'Ensure your backend returns a commentedCode field.',
    errorMsg: 'Analysis failed. Please check your connection or backend.',
    light: 'light', dark: 'dark', langToggle: 'ខ្មែរ', connected: 'Connected',
    diffView: 'diff', codeView: 'code', exportPDF: 'Export PDF',
    copied: 'Copied!', historyEmpty: 'Analysis result',
    shareBtn: 'Share', shareCopied: 'Link copied!',
    applyFix: 'Apply fix', applying: 'fixing...',
    tryExample: 'Try an example',
    codeHealth: 'Code Health',
    readyIn: 'Ready in',
    lines: 'lines', chars: 'chars',
    tour: {
      skip: 'Skip tour', next: 'Next', done: 'Done ✓',
      steps: [
        { title: 'Paste your code', body: 'Drop any code into the editor on the left. You can also drag & drop a file.' },
        { title: 'Pick a mode', body: 'Choose Fix Only, Refactor Only, or both — depending on what you need.' },
        { title: 'Analyze', body: 'Click the button or press ⌘Enter to run the AI analysis instantly.' },
        { title: 'Read results', body: 'Switch between tabs — Bugs, Fixed Code, Explanation, Suggestions and more.' },
      ]
    },
    tabs: { bugs: 'Bugs Found', fixed: 'Fixed Code', commented: 'Commented Code', explain: 'Explanation', suggest: 'Suggestions' },
    severity: { high: 'high', medium: 'medium', low: 'low' },
    modes: { both: 'Fix + Refactor', fix: 'Fix Only', refactor: 'Refactor Only' },
    modesMobile: { both: 'Fix+Ref', fix: 'Fix', refactor: 'Refactor' },
    warmingUp: '◌  Waking up server…',
    progressSteps: ['Scanning for bugs...', 'Generating fix...', 'Writing explanation...', 'Almost done...'],
    examples: [
      { label: 'Broken JS', lang: 'javascript', code: `function fetchUser(id) {\n  let result = db.query('SELECT * FROM users WHERE id = ' + id)\n  if (result = null) {\n    console.log('not found')\n  }\n  return result\n}` },
      { label: 'Bad SQL', lang: 'sql', code: `SELECT * FROM orders\nWHERE status = 'pending'\nAND user_id = USER_ID\nORDER BY created_at\nLIMIT 10 OFFSET` },
      { label: 'Python bug', lang: 'python', code: `def calculate_average(numbers):\n    total = 0\n    for n in numbers:\n        total =+ n\n    return total / len(numbers)\n\nprint(calculate_average([]))` },
      { label: 'Node.js', lang: 'nodejs', code: `const express = require('express')\nconst app = express()\n\napp.get('/user/:id', (req, res) => {\n  const id = req.params.id\n  db.find(id, (err, user) => {\n    res.json(user)\n  })\n})\n\napp.listen(3000)` },
    ],
  },
  km: {
    tagline: 'ជួសជុល។ ពន្យល់។ រៀនពីវា។',
    subtitle: 'បិទភ្ជាប់កូដរបស់អ្នក — ទទួលបានការជួសជុល ការតម្រៀប និងការពន្យល់ភ្លាមៗ។',
    analyzeBtn: '⚡  វិភាគ និងជួសជុល', analyzingBtn: '◌  កំពុងវិភាគ...',
    reanalyzeBtn: '↺  វិភាគម្តងទៀត', clearBtn: 'លុប ✕', toAnalyze: 'ដើម្បីវិភាគ',
    history: 'ប្រវត្តិថ្មីៗ', clearAll: 'លុបទាំងអស់',
    noBugs: 'រកមិនឃើញបញ្ហា', commentedLabel: '✦ កំណែមានមតិ',
    noCommented: 'API មិនទាន់ត្រឡប់ commentedCode ទេ។',
    noCommentedHint: 'សូមបន្ថែម commentedCode field ក្នុង backend។',
    errorMsg: 'ការវិភាគបរាជ័យ។ សូមពិនិត្យការតភ្ជាប់ ឬ backend។',
    light: 'ស្រាល', dark: 'ងងឹត', langToggle: 'EN', connected: 'បានភ្ជាប់',
    diffView: 'diff', codeView: 'code', exportPDF: 'នាំចេញ PDF',
    copied: 'បានចម្លង!', historyEmpty: 'លទ្ធផលវិភាគ',
    shareBtn: 'ចែករំលែក', shareCopied: 'បានចម្លងតំណ!',
    applyFix: 'ជួសជុល', applying: 'កំពុងជួស...',
    tryExample: 'សាកល្បងឧទាហរណ៍',
    codeHealth: 'សុខភាពកូដ',
    readyIn: 'រួចរាល់ក្នុង',
    lines: 'បន្ទាត់', chars: 'តួអក្សរ',
    tour: {
      skip: 'រំលង', next: 'បន្ទាប់', done: 'រួចរាល់ ✓',
      steps: [
        { title: 'បិទភ្ជាប់កូដ', body: 'ដាក់កូដរបស់អ្នកក្នុងប្រអប់ខាងឆ្វេង។ អ្នកអាចទម្លាក់ឯកសារផ្ទាល់ផងដែរ។' },
        { title: 'ជ្រើសរើសរបៀប', body: 'ជ្រើស Fix Only, Refactor Only ឬទាំងពីរ — អាស្រ័យលើអ្វីដែលអ្នកត្រូវការ។' },
        { title: 'វិភាគ', body: 'ចុចប៊ូតុង ឬចុច ⌘Enter ដើម្បីដំណើរការ AI ភ្លាមៗ។' },
        { title: 'អានលទ្ធផល', body: 'ប្តូររវាងផ្ទាំង — Bugs, Fixed Code, Explanation, Suggestions និងច្រើនទៀត។' },
      ]
    },
    tabs: { bugs: 'បញ្ហាដែលរកឃើញ', fixed: 'កូដដែលជួសជុល', commented: 'កូដមានមតិ', explain: 'ការពន្យល់', suggest: 'ការណែនាំ' },
    severity: { high: 'ខ្ពស់', medium: 'មធ្យម', low: 'ទាប' },
    modes: { both: 'ជួសជុល + តម្រៀប', fix: 'ជួសជុលតែប៉ុណ្ណោះ', refactor: 'តម្រៀបតែប៉ុណ្ណោះ' },
    modesMobile: { both: 'ជួសជុល', fix: 'ជួស', refactor: 'តម្រៀប' },
    warmingUp: '◌  កំពុងដាក់ server ដំណើរការ…',
    progressSteps: ['កំពុងស្កែនរកបញ្ហា...', 'កំពុងបង្កើតការជួស...', 'កំពុងសរសេរការពន្យល់...', 'ជិតរួចរាល់ហើយ...'],
    examples: [
      { label: 'JS ខូច', lang: 'javascript', code: `function fetchUser(id) {\n  let result = db.query('SELECT * FROM users WHERE id = ' + id)\n  if (result = null) {\n    console.log('not found')\n  }\n  return result\n}` },
      { label: 'SQL ខ្សោយ', lang: 'sql', code: `SELECT * FROM orders\nWHERE status = 'pending'\nAND user_id = USER_ID\nORDER BY created_at\nLIMIT 10 OFFSET` },
      { label: 'Python', lang: 'python', code: `def calculate_average(numbers):\n    total = 0\n    for n in numbers:\n        total =+ n\n    return total / len(numbers)\n\nprint(calculate_average([]))` },
      { label: 'Node.js', lang: 'nodejs', code: `const express = require('express')\nconst app = express()\n\napp.get('/user/:id', (req, res) => {\n  const id = req.params.id\n  db.find(id, (err, user) => {\n    res.json(user)\n  })\n})\n\napp.listen(3000)` },
    ],
  },
};

// ── Themes ────────────────────────────────────────────────────────────────────
const darkTheme = { bgBase: '#0d0f12', bgPanel: '#13161b', bgSurface: '#1a1e26', border: '#2a2f3d', borderSoft: '#1e2330', teal: '#2dd4bf', tealDim: '#1a8a7c', tealGlow: 'rgba(45,212,191,0.12)', red: '#f87171', redGlow: 'rgba(248,113,113,0.08)', green: '#4ade80', amber: '#f59e0b', blue: '#60a5fa', purple: '#a78bfa', text1: '#e8eaf0', text2: '#8b92a8', text3: '#555e78', navBg: 'rgba(13,15,18,0.9)', codeTheme: vscDarkPlus, codeBg: '#1a1e26', lineNumBg: '#13161b', lineNumColor: '#555e78', isDark: true };
const lightTheme = { bgBase: '#f5f6f8', bgPanel: '#ffffff', bgSurface: '#f0f1f4', border: '#d8dae0', borderSoft: '#e4e6ec', teal: '#0d9488', tealDim: '#0f766e', tealGlow: 'rgba(13,148,136,0.1)', red: '#ef4444', redGlow: 'rgba(239,68,68,0.06)', green: '#16a34a', amber: '#d97706', blue: '#2563eb', purple: '#7c3aed', text1: '#111318', text2: '#4b5263', text3: '#9199ab', navBg: 'rgba(245,246,248,0.92)', codeTheme: oneLight, codeBg: '#f0f1f4', lineNumBg: '#ffffff', lineNumColor: '#9199ab', isDark: false };

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' }, { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' }, { value: 'csharp', label: 'C#' },
  { value: 'sql', label: 'SQL' }, { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' }, { value: 'php', label: 'PHP' },
];
const MODES = ['both', 'fix', 'refactor'];
const TAB_KEYS = ['bugs', 'fixed', 'commented', 'explain', 'suggest'];
const EXT_MAP = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', cs: 'csharp', sql: 'sql', java: 'java', php: 'php' };
const SEVERITY_STYLE = {
  high: { dark: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' }, light: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' } },
  medium: { dark: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }, light: { bg: 'rgba(217,119,6,0.1)', color: '#d97706' } },
  low: { dark: { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' }, light: { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' } },
};

const mono = "'JetBrains Mono', monospace";
const sans = "'Sora', sans-serif";
const khmer = "'Hanuman', 'Noto Sans Khmer', sans-serif";

// ── Utilities ─────────────────────────────────────────────────────────────────
const normalizeBugs = bugs => !bugs?.length ? [] : bugs.map(b => typeof b === 'string' ? { issue: b, severity: 'medium', lineNumber: null } : b);

const computeHealthScore = bugs => {
  if (!bugs.length) return 100;
  const realBugs = bugs.filter(b => b.severity === 'high' || b.severity === 'medium');
  if (!realBugs.length) return 100;
  const deductions = realBugs.reduce((sum, b) => sum + (b.severity === 'high' ? 25 : 12), 0);
  return Math.max(0, 100 - deductions);
};

const healthColor = (score, c) => score >= 80 ? c.green : score >= 50 ? c.amber : c.red;

// ── LCS-based diff algorithm ──────────────────────────────────────────────────
// Produces accurate line-level diffs (added / removed / same) instead of
// naive index-based zipping. Falls back to zip for very large files.
function computeDiff(original, fixed) {
  const oLines = (original || '').split('\n');
  const fLines = (fixed || '').split('\n');

  // Performance guard: fall back to naive zip for very large files
  if (oLines.length > 400 || fLines.length > 400) {
    return Array.from({ length: Math.max(oLines.length, fLines.length) }, (_, i) => {
      const o = oLines[i], f = fLines[i];
      if (o === undefined) return { orig: '', fixed: f, type: 'added' };
      if (f === undefined) return { orig: o, fixed: '', type: 'removed' };
      if (o !== f) return { orig: o, fixed: f, type: 'changed' };
      return { orig: o, fixed: f, type: 'same' };
    });
  }

  const m = oLines.length, n = fLines.length;
  // Build LCS table
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oLines[i - 1] === fLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);

  // Backtrack to build diff
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oLines[i - 1] === fLines[j - 1]) {
      result.unshift({ orig: oLines[i - 1], fixed: fLines[j - 1], type: 'same' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ orig: '', fixed: fLines[j - 1], type: 'added' });
      j--;
    } else {
      result.unshift({ orig: oLines[i - 1], fixed: '', type: 'removed' });
      i--;
    }
  }
  return result;
}

// ── Client-side code formatter ────────────────────────────────────────────────
function formatCode(code, language) {
  if (!code || typeof code !== 'string') return code;
  if (code.split('\n').length > 3) return code;

  try {
    if (['javascript', 'nodejs', 'typescript', 'java', 'csharp', 'php'].includes(language)) {
      let result = code
        .replace(/\{(?!\s*\n)/g, '{\n')
        .replace(/\}(?!\s*\n)/g, '\n}\n')
        .replace(/;(?!\s*\n)/g, ';\n')
        .replace(/\n{3,}/g, '\n\n');

      let depth = 0;
      return result.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('}')) depth = Math.max(0, depth - 1);
        const indented = '  '.repeat(depth) + trimmed;
        if (trimmed.endsWith('{')) depth++;
        return indented;
      }).filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n');
    }

    if (language === 'sql') {
      return code
        .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT|UPDATE|DELETE|SET|VALUES)\b/gi, '\n$1')
        .replace(/,(?!\s*\n)/g, ',\n  ')
        .trim();
    }

    if (language === 'python') {
      return code
        .replace(/:(?!\s*\n)(?!:)/g, ':\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    return code;
  } catch {
    return code;
  }
}

// ── Share URL compression ─────────────────────────────────────────────────────
// Uses the browser's built-in CompressionStream (gzip) so large analysis
// results don't produce URLs too long for browsers/messaging apps to handle.
// Falls back to plain btoa if CompressionStream is unavailable.
async function encodeShare(result, language, mode, codeInput = '') {
  try {
    const json = JSON.stringify({ result, language, mode, codeInput, time: Date.now() });
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      writer.write(new TextEncoder().encode(json));
      writer.close();
      const buf = await new Response(stream.readable).arrayBuffer();
      const bytes = new Uint8Array(buf);
      // URL-safe base64: replace + / with - _  and strip padding
      return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    // Fallback for older browsers
    return btoa(encodeURIComponent(json)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch { return null; }
}

async function decodeShare(hash) {
  try {
    // Restore URL-safe base64 padding
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice(0, (4 - b64.length % 4) % 4);
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        writer.write(bytes);
        writer.close();
        const text = await new Response(stream.readable).text();
        return JSON.parse(text);
      } catch {
        // Hash might be old uncompressed format — fall through
      }
    }
    // Fallback: try legacy plain btoa format
    return JSON.parse(decodeURIComponent(atob(padded)));
  } catch { return null; }
}

function exportToPDF(analysisResult, language, mode) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 15, CW = W - M * 2; let y = M;
  const bugs = normalizeBugs(analysisResult.bugsFound);
  const score = computeHealthScore(bugs);
  const addText = (text, size = 11, bold = false, color = [30, 30, 30]) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text || ''), CW);
    if (y + lines.length * (size * 0.45) > 280) { doc.addPage(); y = M; }
    doc.text(lines, M, y); y += lines.length * (size * 0.45) + 2;
  };
  const addSection = (title, color = [13, 148, 136]) => {
    y += 4; doc.setDrawColor(...color); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 5;
    addText(title, 13, true, color);
  };
  const addCode = (code) => {
    doc.setFontSize(8.5); doc.setFont('courier', 'normal'); doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(String(code || ''), CW);
    const blockH = lines.length * 3.8 + 4;
    if (y + blockH > 280) { doc.addPage(); y = M; }
    doc.setFillColor(245, 246, 248); doc.roundedRect(M, y, CW, blockH, 2, 2, 'F'); y += 3;
    doc.text(lines, M + 2, y); y += lines.length * 3.8 + 4;
  };
  doc.setFillColor(13, 148, 136); doc.rect(0, 0, W, 22, 'F');
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('fixplain', M, 14);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Fix it. Explain it. Learn from it.', M + 28, 14);
  doc.setTextColor(200, 240, 235);
  doc.text(`${language.toUpperCase()} · ${mode} · Health: ${score}/100 · ${new Date().toLocaleDateString()}`, W - M, 14, { align: 'right' });
  y = 30;
  addSection('Code Health Score');
  const scoreColor = score >= 80 ? [22, 163, 74] : score >= 50 ? [217, 119, 6] : [239, 68, 68];
  addText(`${score} / 100`, 20, true, scoreColor);
  addSection('Bugs Found');
  if (!bugs.length) { addText('No bugs detected.', 10, false, [22, 163, 74]); }
  else bugs.forEach((b, i) => { const sc = b.severity === 'high' ? [239, 68, 68] : b.severity === 'medium' ? [217, 119, 6] : [37, 99, 235]; addText(`${i + 1}. [${(b.severity || 'medium').toUpperCase()}]${b.lineNumber ? ` Line ${b.lineNumber}` : ''} — ${b.issue}`, 10, false, sc); });
  addSection('Fixed Code'); addCode(analysisResult.fixedCode);
  if (analysisResult.commentedCode) { addSection('Commented Code'); addCode(analysisResult.commentedCode); }
  addSection('Explanation'); addText(analysisResult.explanation, 10);
  addSection('Improvement Suggestions');
  (analysisResult.improvementSuggestions || []).forEach((s, i) => addText(`${i + 1}. ${s}`, 10));
  const pc = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pc; p++) { doc.setPage(p); doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.text(`Fixplain · Page ${p} of ${pc}`, W / 2, 292, { align: 'center' }); }
  doc.save(`fixplain-${language}-${Date.now()}.pdf`);
}

// ── Primitives ────────────────────────────────────────────────────────────────
const Panel = ({ c, children, style = {}, ...rest }) => (
  <div style={{ background: c.bgPanel, border: `1px solid ${c.borderSoft}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }} {...rest}>
    {children}
  </div>
);
const PanelHeader = ({ c, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface, flexWrap: 'wrap', gap: 6 }}>
    {children}
  </div>
);
const Dot = ({ color }) => <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />;
const SeverityBadge = ({ severity, isDark, label }) => {
  const st = (SEVERITY_STYLE[severity] || SEVERITY_STYLE.low)[isDark ? 'dark' : 'light'];
  return <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: st.bg, color: st.color, letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>;
};

// ── Shared action buttons (defined outside App to avoid remount on each render) ─
const CopyBtn = ({ c, onClick }) => (
  <button onClick={onClick}
    style={{ fontFamily: mono, fontSize: 10, padding: '4px 12px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.2s' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = c.green; e.currentTarget.style.color = c.green; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; }}>
    copy
  </button>
);

const UseCodeBtn = ({ c, onClick }) => (
  <button onClick={onClick}
    style={{ fontFamily: mono, fontSize: 10, padding: '4px 12px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.2s' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = c.teal; e.currentTarget.style.color = c.teal; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; }}>
    ← use
  </button>
);

// ── Onboarding Tour ───────────────────────────────────────────────────────────
function OnboardingTour({ c, t, onDone }) {
  const [step, setStep] = useState(0);
  const steps = t.tour.steps;
  const isLast = step === steps.length - 1;
  const isMobileView = window.innerWidth < 768;
  const desktopPos = [
    { top: '30%', left: '28%' }, { top: '38%', left: '28%' },
    { top: '72%', left: '28%' }, { top: '30%', right: '3%' },
  ];
  const pos = isMobileView
    ? { bottom: '6rem', left: '50%', transform: 'translateX(-50%)', width: 'calc(100vw - 2rem)' }
    : desktopPos[step];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none', background: isMobileView ? 'rgba(0,0,0,0.4)' : 'none' }}>
      <div style={{ position: 'absolute', ...pos, background: c.bgPanel, border: `1px solid ${c.teal}`, borderRadius: 14, padding: '16px 18px', maxWidth: isMobileView ? undefined : 260, pointerEvents: 'all' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: c.teal }}>{step + 1}/{steps.length}</span>
          <button onClick={onDone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text3, fontFamily: mono, fontSize: 10 }}>{t.tour.skip}</button>
        </div>
        <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: c.text1, marginBottom: 6 }}>{steps[step].title}</p>
        <p style={{ fontFamily: sans, fontSize: 12, color: c.text2, lineHeight: 1.6, marginBottom: 12 }}>{steps[step].body}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {steps.map((_, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === step ? c.teal : c.border, display: 'inline-block', transition: '0.2s' }} />)}
          <button onClick={() => isLast ? onDone() : setStep(s => s + 1)}
            style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 11, padding: '4px 12px', borderRadius: 20, border: `1px solid ${c.tealDim}`, background: c.tealGlow, color: c.teal, cursor: 'pointer' }}>
            {isLast ? t.tour.done : t.tour.next}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Health Score Ring ─────────────────────────────────────────────────────────
function HealthRing({ score, c, label, isMobile }) {
  const r = 20, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = healthColor(score, c);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: c.bgSurface, borderRadius: 12, border: `1px solid ${c.borderSoft}`, width: isMobile ? '100%' : 'auto' }}>
      <svg width={50} height={50} style={{ flexShrink: 0 }}>
        <circle cx={25} cy={25} r={r} fill="none" stroke={c.border} strokeWidth={3} />
        <circle cx={25} cy={25} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 25 25)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x={25} y={29} textAnchor="middle" fontFamily={mono} fontSize={11} fontWeight={600} fill={color}>{score}</text>
      </svg>
      <div>
        <p style={{ fontFamily: mono, fontSize: 10, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</p>
        <p style={{ fontFamily: mono, fontSize: 12, color, fontWeight: 600 }}>
          {score >= 80 ? 'Healthy' : score >= 50 ? 'Needs work' : 'Critical'}
        </p>
      </div>
    </div>
  );
}

// ── Loading progress ──────────────────────────────────────────────────────────
function LoadingSkeleton({ c, progressStep }) {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {[0, 1, 2, 3, 4].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c.teal, display: 'inline-block', animation: `fpShimmer 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
        <span style={{ fontFamily: mono, fontSize: 11, color: c.teal, marginLeft: 4 }}>{progressStep}</span>
      </div>
      {[[28, 88, 60], [35, 92, 72], [20, 78]].map((ws, gi) => (
        <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {ws.map((w, i) => <div key={i} style={{ height: i === 0 ? 11 : 8, width: `${w}%`, background: c.bgSurface, borderRadius: 6, animation: `fpShimmer 1.6s ease-in-out ${gi * 0.2}s infinite` }} />)}
        </div>
      ))}
    </div>
  );
}

// ── Diff view ─────────────────────────────────────────────────────────────────
// Uses LCS-accurate diff. Accepts screenW as a prop so it responds to resize
// instead of reading window.innerWidth once at render time.
function DiffView({ original, fixed, c, screenW }) {
  const diff = computeDiff(original, fixed);
  const isMobileView = screenW < 768;

  // Compute per-side line numbers, skipping blank placeholder rows
  const origNums = [], fixedNums = [];
  let oNum = 1, fNum = 1;
  diff.forEach(row => {
    origNums.push(row.type !== 'added' ? oNum++ : null);
    fixedNums.push(row.type !== 'removed' ? fNum++ : null);
  });

  return (
    <div style={{ borderRadius: 10, border: `1px solid ${c.borderSoft}`, display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : '1fr 1fr', height: 360, overflow: 'hidden' }}>
      {['orig', 'fixed'].map(side => (
        <div key={side} style={{ borderRight: side === 'orig' ? `1px solid ${c.borderSoft}` : 'none', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '6px 12px', background: c.bgSurface, borderBottom: `1px solid ${c.borderSoft}`, fontFamily: mono, fontSize: 10, color: side === 'orig' ? c.red : c.green, flexShrink: 0 }}>
            {side === 'orig' ? 'original' : 'fixed'}
          </div>
          <div style={{ overflowY: 'scroll', overflowX: 'auto', flex: 1, minHeight: 0 }}>
            {diff.map((row, i) => {
              const lineNum = side === 'orig' ? origNums[i] : fixedNums[i];
              const content = side === 'orig' ? row.orig : row.fixed;
              const bg = row.type === 'same'
                ? 'transparent'
                : side === 'orig'
                  ? (row.type === 'removed' || row.type === 'changed' ? c.redGlow : 'transparent')
                  : (row.type === 'added' || row.type === 'changed' ? 'rgba(74,222,128,0.08)' : 'transparent');
              const col = row.type === 'same'
                ? c.text2
                : side === 'orig'
                  ? (row.type === 'removed' || row.type === 'changed' ? c.red : c.text3)
                  : (row.type === 'added' || row.type === 'changed' ? c.green : c.text3);
              return (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '0 10px', background: bg, minHeight: 22 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: c.text3, minWidth: 28, userSelect: 'none', lineHeight: '22px', flexShrink: 0, textAlign: 'right' }}>
                    {lineNum ?? ''}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: col, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '22px', flex: 1 }}>{content}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Line-numbered editor ──────────────────────────────────────────────────────
function LineNumberedEditor({ c, value, onChange, isDragging, highlightLine, placeholder }) {
  const taRef = useRef(null), lnRef = useRef(null);
  const lines = value ? value.split('\n') : [''];

  const sync = () => {
    if (lnRef.current && taRef.current) lnRef.current.scrollTop = taRef.current.scrollTop;
  };

  // Scroll the editor to the highlighted line when a line badge is clicked
  useEffect(() => {
    if (highlightLine && taRef.current) {
      const lineH = 13 * 1.8; // fontSize 13px * lineHeight 1.8 + padding
      const targetScrollTop = (highlightLine - 1) * lineH - taRef.current.clientHeight / 3;
      taRef.current.scrollTop = Math.max(0, targetScrollTop);
      if (lnRef.current) lnRef.current.scrollTop = taRef.current.scrollTop;
    }
  }, [highlightLine]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>
      {isDragging && (
        <div style={{ position: 'absolute', inset: 0, background: c.isDark ? 'rgba(45,212,191,0.08)' : 'rgba(13,148,136,0.06)', border: `2px dashed ${c.teal}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 24 }}>⬇</span>
          <span style={{ fontFamily: mono, fontSize: 13, color: c.teal }}>drop file here</span>
        </div>
      )}
      {value.trim() && (
        <div ref={lnRef} style={{ background: c.lineNumBg, borderRight: `1px solid ${c.borderSoft}`, padding: '1rem 8px 1rem 12px', textAlign: 'right', fontFamily: mono, fontSize: 12, lineHeight: 1.8, userSelect: 'none', overflowY: 'hidden', minWidth: 44, flexShrink: 0 }}>
          {lines.map((_, i) => (
            <div key={i} style={{ color: highlightLine === i + 1 ? c.teal : c.lineNumColor, background: highlightLine === i + 1 ? c.tealGlow : 'transparent', borderRadius: 3, transition: '0.2s' }}>
              {i + 1}
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={sync}
        spellCheck={false}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: c.text1, fontFamily: mono, fontSize: 13, lineHeight: 1.8,
          padding: '1rem 1.25rem', resize: 'none', tabSize: 2,
          overflowY: 'auto', overflowX: 'hidden',
          minWidth: 0, width: '100%',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
      />
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible, c }) {
  return <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: c.bgSurface, border: `1px solid ${c.green}`, color: c.green, fontFamily: mono, fontSize: 12, padding: '8px 18px', borderRadius: 20, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.25s, transform 0.25s', pointerEvents: 'none', zIndex: 200 }}>✓ {message}</div>;
}

// ── Error Boundary ────────────────────────────────────────────────────────────
// Catches any runtime crash inside the app and shows a friendly recovery UI
// instead of a blank white screen. Must be a class component (React requirement).
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false, error: null }; }
  static getDerivedStateFromError(error) { return { crashed: true, error }; }
  componentDidCatch(error, info) { console.error('Fixplain crashed:', error, info); }
  render() {
    if (!this.state.crashed) return this.props.children;
    const c = this.props.theme || darkTheme;
    return (
      <div style={{ minHeight: '100vh', background: c.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: '2rem', fontFamily: "'Sora', sans-serif" }}>
        <span style={{ fontSize: 32 }}>⚠</span>
        <p style={{ color: c.text1, fontSize: 16, fontWeight: 600, margin: 0 }}>Something went wrong</p>
        <p style={{ color: c.text3, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", margin: 0, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        <button onClick={() => { this.setState({ crashed: false, error: null }); window.location.hash = ''; }}
          style={{ marginTop: 8, padding: '10px 24px', borderRadius: 20, border: `1px solid ${c.tealDim}`, background: c.tealGlow, color: c.teal, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          ↺ Reload app
        </button>
      </div>
    );
  }
}

// ── Char limit ────────────────────────────────────────────────────────────────
const CHAR_LIMIT = 12000;
const CHAR_WARN  = 9000;

// ── Main App ──────────────────────────────────────────────────────────────────
function AppInner() {
  const [isDark, setIsDark] = useState(true);
  const [locale, setLocale] = useState('en');
  const [language, setLanguage] = useState('javascript');
  const [mode, setMode] = useState('both');
  const [codeInput, setCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('bugs');
  const [showDiff, setShowDiff] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [screenW, setScreenW] = useState(window.innerWidth);
  const [tabKey, setTabKey] = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [highlightLine, setHighlightLine] = useState(null);
  const [fixingBug, setFixingBug] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  const c = isDark ? darkTheme : lightTheme;
  const t = i18n[locale];
  const tf = locale === 'km' ? khmer : sans;
  const isMobile = screenW < 768;
  const isTablet = screenW >= 768 && screenW < 1024;
  const bugs = normalizeBugs(analysisResult?.bugsFound);
  const tabAccent = { bugs: c.red, fixed: c.green, commented: c.amber, explain: c.blue, suggest: c.purple };
  const langForHL = { nodejs: 'javascript', csharp: 'csharp', sql: 'sql', python: 'python', typescript: 'typescript', java: 'java', php: 'php' }[language] || 'javascript';

  // Inject keyframes
  useEffect(() => {
    if (document.getElementById('fp-styles')) return;
    const s = document.createElement('style');
    s.id = 'fp-styles';
    s.textContent = `@keyframes fpFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes fpShimmer{0%,100%{opacity:.3}50%{opacity:.8}}*{-webkit-tap-highlight-color:transparent;}[style*="scrollbarWidth"]::-webkit-scrollbar{display:none;}textarea::placeholder{color:#555e78;opacity:1;font-style:italic;}`;
    document.head.appendChild(s);
  }, []);

  // Responsive
  useEffect(() => { const fn = () => setScreenW(window.innerWidth); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);

  // Load history + check for shared result in URL hash
  useEffect(() => {
    const saved = localStorage.getItem('fixplain_history');
    if (saved) setHistory(JSON.parse(saved));
    const hash = window.location.hash.slice(1);
    if (hash) {
      decodeShare(hash).then(decoded => {
        if (decoded) {
          setAnalysisResult(decoded.result);
          setLanguage(decoded.language);
          setMode(decoded.mode);
          if (decoded.codeInput) setCodeInput(decoded.codeInput);
          switchTab('bugs');
        }
      });
    }
    if (!localStorage.getItem('fp_tour_done')) setShowTour(true);
  }, []);

  const showToast = msg => { setToastMsg(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 2200); };

  const handleCopy = (text, lang) => {
    const formatted = formatCode(text, lang || language);
    navigator.clipboard.writeText(formatted);
    showToast(t.copied);
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem('fixplain_history'); };

  const handleShare = async () => {
    if (!analysisResult) return;
    const encoded = await encodeShare(analysisResult, language, mode, codeInput);
    if (!encoded) return;
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    navigator.clipboard.writeText(url);
    showToast(t.shareCopied);
  };

  const handleDragOver = e => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = e => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = e => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0]; if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (EXT_MAP[ext]) setLanguage(EXT_MAP[ext]);
    const reader = new FileReader();
    reader.onload = ev => {
      setCodeInput(ev.target.result);
    };
    reader.readAsText(file);
  };

  const switchTab = key => { setActiveTab(key); setTabKey(k => k + 1); setShowDiff(false); };
  const loadExample = ex => { setCodeInput(ex.code); setLanguage(ex.lang); setAnalysisResult(null); setError(null); };

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true); setIsWarmingUp(false); setError(null); setAnalysisResult(null);
    setHighlightLine(null); setOriginalCode(codeInput); switchTab('bugs');

    const API = 'https://ffxplain-api.onrender.com';

    // Show "waking up server" only if no response after 3s — the analysis
    // request itself wakes Render, so no pre-ping needed.
    const warmupTimer = setTimeout(() => setIsWarmingUp(true), 3000);

    try {
      const res = await fetch(`${API}/api/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeInput,
          language,
          mode,
          locale,
          previousBugs: analysisResult ? normalizeBugs(analysisResult.bugsFound).map(b => b.issue) : [],
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAnalysisResult(data);
      if (!normalizeBugs(data.bugsFound).length) switchTab('fixed');
      const entry = { ...data, _meta: { language, mode, locale, time: Date.now(), codeInput } };
      const updated = [entry, ...history].slice(0, 5);
      setHistory(updated); localStorage.setItem('fixplain_history', JSON.stringify(updated));
      setCooldown(3);
    } catch {
      setError(t.errorMsg);
    } finally {
      clearTimeout(warmupTimer);
      setIsLoading(false);
      setIsWarmingUp(false);
    }
  }, [codeInput, language, mode, locale, history, t, analysisResult]);

  // Keyboard shortcut — handleAnalyze is defined above so no ReferenceError
  useEffect(() => {
    const fn = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (!isLoading && codeInput.trim() && cooldown === 0) handleAnalyze(); } };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, [isLoading, codeInput, cooldown, handleAnalyze]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Progress step cycling
  useEffect(() => {
    if (!isLoading) return;
    setProgressStep(0);
    const steps = t.progressSteps;
    let idx = 0;
    const interval = setInterval(() => { idx = (idx + 1) % steps.length; setProgressStep(idx); }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFixSingle = async (bug, idx) => {
    setFixingBug(idx);
    try {
      const res = await fetch('https://ffxplain-api.onrender.com/api/fix-single', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeInput, bugIssue: bug.issue, language }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.fixedCode) {
        const formatted = formatCode(data.fixedCode, language);
        setCodeInput(formatted);
        showToast(t.applyFix + ' ✓');
      }
    } catch { showToast('Fix failed'); }
    finally { setFixingBug(null); }
  };

  const lineCount = codeInput.split('\n').length;
  const charCount = codeInput.length;
  const healthScore = bugs.length > 0 || analysisResult ? computeHealthScore(bugs) : null;

  return (
    <div style={{ minHeight: '100vh', background: c.bgBase, color: c.text1, fontFamily: tf, display: 'flex', flexDirection: 'column', transition: 'background 0.2s, color 0.2s', overflowX: 'hidden', width: '100%' }}>

      {showTour && <OnboardingTour c={c} t={t} onDone={() => { setShowTour(false); localStorage.setItem('fp_tour_done', '1'); }} />}
      <AnimatedBackground isDark={isDark} />

      {/* ── Nav ── */}
      <nav style={{ borderBottom: `1px solid ${c.borderSoft}`, padding: isMobile ? '8px 0.75rem' : '0 1.25rem', minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.navBg, backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.teal, display: 'inline-block' }} />
          <span style={{ fontFamily: mono, fontSize: 15, fontWeight: 600, color: c.teal, letterSpacing: '-0.3px' }}>fixplain</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text1, fontFamily: mono, fontSize: 12, padding: '6px 6px', cursor: 'pointer', outline: 'none', maxWidth: isMobile ? 90 : 'none' }}>
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{isMobile ? l.label.substring(0, 4) : l.label}</option>)}
          </select>
          {!isMobile && <span style={{ fontSize: 10, fontFamily: mono, color: c.text3, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <kbd style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10, color: c.text3 }}>{navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}</kbd>
            <kbd style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10, color: c.text3 }}>Enter</kbd>
            <span>{t.toAnalyze}</span>
          </span>}
          <button onClick={() => setLocale(l => l === 'en' ? 'km' : 'en')} style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 10px', cursor: 'pointer', fontFamily: locale === 'km' ? mono : khmer, fontSize: 11, color: c.text2, transition: '0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = c.tealDim} onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>{t.langToggle}</button>
          <button onClick={() => setIsDark(p => !p)} style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: mono, fontSize: 11, color: c.text2, transition: '0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = c.tealDim} onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
            <span style={{ fontSize: 13 }}>{isDark ? '☀' : '☾'}</span>
            {!isMobile && (isDark ? t.light : t.dark)}
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: isMobile ? '1.5rem 1rem 0.5rem' : '2rem 1.25rem 0.75rem' }}>
        <h1 style={{ fontSize: isMobile ? 'clamp(20px,6vw,28px)' : 'clamp(26px,4vw,38px)', fontWeight: 600, letterSpacing: locale === 'km' ? 0 : '-1px', lineHeight: 1.3, margin: 0, fontFamily: tf }}>
          {locale === 'km' ? t.tagline : <>Fix it. <span style={{ color: c.teal }}>Explain it.</span> Learn from it.</>}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap', padding: '0 1rem' }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: c.text3 }}>{t.tryExample}:</span>
          {t.examples.map((ex, i) => (
            <button key={i} onClick={() => loadExample(ex)}
              style={{ fontFamily: mono, fontSize: 10, padding: '4px 10px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.tealDim; e.currentTarget.style.color = c.teal; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; }}>
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <main style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '100vw', overflowX: 'hidden', padding: isMobile ? '0.75rem 0.75rem 2rem' : '1.25rem 1.25rem 2rem', display: 'grid', gridTemplateColumns: isMobile || isTablet ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)', gap: '1rem', flex: 1 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 0, width: '100%' }}>
          <Panel c={c} style={{ flex: isMobile || isTablet ? 'none' : '1', minHeight: isMobile ? 280 : 380, height: isMobile || isTablet ? 320 : undefined, width: '100%', minWidth: 0 }}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            {/* Top row: dots + clear */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: c.text3, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Dot color={c.amber} /><Dot color={c.green} /><Dot color={c.red} />
                {!isMobile && <>&nbsp; input.{({ python: 'py', sql: 'sql', csharp: 'cs', java: 'java', php: 'php', typescript: 'ts' })[language] || 'js'}</>}
              </span>
              <button onClick={() => setCodeInput('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text3, fontSize: 11, fontFamily: mono, padding: '2px 6px', borderRadius: 5, flexShrink: 0 }}
                onMouseEnter={e => e.target.style.color = c.text1} onMouseLeave={e => e.target.style.color = c.text3}>{t.clearBtn}</button>
            </div>
            {/* Mode buttons row */}
            <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface, flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {MODES.map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ fontFamily: tf, fontSize: 10, padding: '4px 12px', borderRadius: 20, border: `1px solid ${mode === m ? c.tealDim : c.border}`, background: mode === m ? c.tealGlow : 'transparent', color: mode === m ? c.teal : c.text3, cursor: 'pointer', transition: '0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => { if (mode !== m) { e.currentTarget.style.borderColor = c.tealDim; e.currentTarget.style.color = c.teal; } }}
                  onMouseLeave={e => { if (mode !== m) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text3; } }}>
                  {t.modes[m]}
                </button>
              ))}
            </div>
            <LineNumberedEditor
              c={c}
              value={codeInput}
              onChange={setCodeInput}
              isDragging={isDragging}
              highlightLine={highlightLine}
              placeholder={locale === 'km' ? 'បិទភ្ជាប់កូដរបស់អ្នក ឬទម្លាក់ឯកសារទីនេះ...' : 'Paste your code here or drag & drop a file...'}
            />
            {/* Line/char count + size warning */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px', background: charCount >= CHAR_WARN ? (charCount >= CHAR_LIMIT ? c.redGlow : 'rgba(245,158,11,0.08)') : c.bgSurface, borderTop: `1px solid ${charCount >= CHAR_WARN ? (charCount >= CHAR_LIMIT ? c.red : c.amber) : c.borderSoft}`, transition: 'background 0.2s, border-color 0.2s' }}>
              {charCount >= CHAR_WARN
                ? <span style={{ fontFamily: mono, fontSize: 10, color: charCount >= CHAR_LIMIT ? c.red : c.amber }}>
                    {charCount >= CHAR_LIMIT ? '✗ Exceeds 12,000 char limit' : `⚠ Approaching limit (${CHAR_LIMIT - charCount} left)`}
                  </span>
                : <span />}
              <span style={{ fontFamily: mono, fontSize: 10, color: charCount >= CHAR_WARN ? (charCount >= CHAR_LIMIT ? c.red : c.amber) : c.text3 }}>{lineCount} {t.lines} · {charCount} {t.chars}</span>
            </div>
          </Panel>

          <button onClick={handleAnalyze} disabled={isLoading || !codeInput.trim() || cooldown > 0}
            style={{ fontFamily: tf, fontSize: isMobile ? 12 : 13, fontWeight: 600, padding: '12px 0', borderRadius: 30, border: `1.5px solid ${c.tealDim}`, background: isLoading ? 'transparent' : c.tealGlow, color: c.teal, cursor: (isLoading || !codeInput.trim() || cooldown > 0) ? 'not-allowed' : 'pointer', letterSpacing: '0.4px', transition: 'all 0.2s', opacity: (!codeInput.trim() && !isLoading) ? 0.4 : 1, width: '100%' }}>
            {isLoading
              ? (isWarmingUp ? t.warmingUp : t.analyzingBtn)
              : cooldown > 0 ? `${t.readyIn} ${cooldown}s`
              : analysisResult ? t.reanalyzeBtn
              : t.analyzeBtn}
          </button>

          {/* Health score */}
          {healthScore !== null && <HealthRing score={healthScore} c={c} label={t.codeHealth} isMobile={isMobile} />}

          {/* History */}
          {history.length > 0 && (
            <Panel c={c}>
              <PanelHeader c={c}>
                <span style={{ fontFamily: tf, fontSize: 11, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.history}</span>
                <button onClick={clearHistory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.red, fontFamily: tf, fontSize: 10, textTransform: 'uppercase' }}>{t.clearAll}</button>
              </PanelHeader>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((item, idx) => {
                  const meta = item._meta || {}, firstBug = item.bugsFound?.[0];
                  const bugLabel = typeof firstBug === 'string' ? firstBug : firstBug?.issue;
                  const score = computeHealthScore(normalizeBugs(item.bugsFound));
                  return (
                    <button key={idx} onClick={() => {
                        setAnalysisResult(item);
                        if (item._meta?.codeInput) setCodeInput(item._meta.codeInput);
                        switchTab('bugs');
                      }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text2, fontFamily: mono, fontSize: 12, cursor: 'pointer', transition: '0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = c.tealDim; e.currentTarget.style.color = c.teal; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                        {meta.language && <span style={{ fontFamily: mono, fontSize: 9, padding: '1px 6px', borderRadius: 10, background: c.tealGlow, color: c.teal }}>{LANGUAGES.find(l => l.value === meta.language)?.label}</span>}
                        {meta.mode && <span style={{ fontFamily: mono, fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', color: c.purple }}>{meta.mode}</span>}
                        {meta.locale === 'km' && <span style={{ fontFamily: mono, fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: c.amber }}>ខ្មែរ</span>}
                        <span style={{ fontFamily: mono, fontSize: 9, color: healthColor(score, c), marginLeft: 'auto' }}>{score}/100</span>
                        {meta.time && <span style={{ fontFamily: mono, fontSize: 9, color: c.text3 }}>{new Date(meta.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>◈  {bugLabel || t.historyEmpty}</div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>

        {/* RIGHT */}
        <Panel c={c} style={{ minHeight: isMobile ? 400 : 380, minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TAB_KEYS.map(key => {
              const accent = tabAccent[key], isActive = activeTab === key;
              const bugCount = key === 'bugs' && analysisResult ? bugs.length : 0;
              return (
                <button key={key} onClick={() => switchTab(key)}
                  style={{ fontFamily: tf, fontSize: isMobile ? 10 : 11, padding: isMobile ? '8px 8px' : '10px 13px', border: 'none', background: 'none', color: isActive ? accent : c.text3, borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = c.text1; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = c.text3; }}>
                  {isMobile ? t.tabs[key].split(' ')[0] : t.tabs[key]}
                  {bugCount > 0 && <span style={{ background: c.red, color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 20, lineHeight: 1.4 }}>{bugCount}</span>}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {error && <div style={{ margin: '1rem', padding: '12px 16px', background: c.redGlow, border: `1px solid ${c.red}`, borderLeft: `3px solid ${c.red}`, borderRadius: 10, color: c.red, fontFamily: tf, fontSize: 12 }}>{error}</div>}
            {isLoading && <LoadingSkeleton c={c} progressStep={isWarmingUp ? t.warmingUp : t.progressSteps[progressStep]} />}
            {!analysisResult && !isLoading && !error && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, padding: '3rem' }}>
                <span style={{ fontSize: 30, opacity: 0.2 }}>◈</span>
                <span style={{ color: c.text3, fontFamily: tf, fontSize: 12 }}>
                  {locale === 'km' ? 'បិទភ្ជាប់កូដ ហើយចុច ⌘Enter' : 'Paste code & press ⌘Enter'}
                </span>
              </div>
            )}

            {analysisResult && !isLoading && (
              <div key={tabKey} style={{ padding: '1rem 1.25rem', flex: 1, animation: 'fpFadeIn 0.2s ease' }}>

                {/* BUGS */}
                {activeTab === 'bugs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {!bugs.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '2rem', color: c.green }}>
                        <span style={{ fontSize: 28 }}>✓</span>
                        <span style={{ fontFamily: tf, fontSize: 12 }}>{t.noBugs}</span>
                      </div>
                    ) : bugs.map((b, i) => (
                      <div key={i} style={{ padding: '10px 14px', background: c.redGlow, borderLeft: `2px solid ${c.red}`, borderRadius: '0 8px 8px 0' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                          <span style={{ color: c.red, marginTop: 1, flexShrink: 0 }}>✗</span>
                          <span style={{ fontFamily: mono, fontSize: 12.5, color: c.text2, lineHeight: 1.65, flex: 1 }}>{b.issue}</span>
                          <SeverityBadge severity={b.severity} isDark={isDark} label={t.severity[b.severity] || b.severity} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {b.lineNumber && (
                            <button onClick={() => setHighlightLine(l => l === b.lineNumber ? null : b.lineNumber)}
                              style={{ fontFamily: mono, fontSize: 9, padding: '2px 8px', borderRadius: 10, border: `1px solid ${c.border}`, background: highlightLine === b.lineNumber ? c.tealGlow : 'transparent', color: highlightLine === b.lineNumber ? c.teal : c.text3, cursor: 'pointer', transition: '0.15s' }}>
                              line {b.lineNumber}
                            </button>
                          )}
                          <button onClick={() => handleFixSingle(b, i)} disabled={fixingBug !== null}
                            style={{ fontFamily: mono, fontSize: 9, padding: '2px 10px', borderRadius: 10, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: fixingBug !== null ? 'not-allowed' : 'pointer', transition: '0.15s', opacity: fixingBug !== null && fixingBug !== i ? 0.4 : 1 }}
                            onMouseEnter={e => { if (fixingBug === null) { e.currentTarget.style.borderColor = c.green; e.currentTarget.style.color = c.green; } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; }}>
                            {fixingBug === i ? t.applying : t.applyFix}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FIXED CODE */}
                {activeTab === 'fixed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[false, true].map(diff => (
                          <button key={String(diff)} onClick={() => setShowDiff(diff)}
                            style={{ fontFamily: mono, fontSize: 10, padding: '4px 10px', borderRadius: 20, border: `1px solid ${showDiff === diff ? c.tealDim : c.border}`, background: showDiff === diff ? c.tealGlow : 'transparent', color: showDiff === diff ? c.teal : c.text3, cursor: 'pointer', transition: '0.15s' }}>
                            {diff ? t.diffView : t.codeView}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <UseCodeBtn c={c} onClick={() => { setCodeInput(formatCode(analysisResult.fixedCode, language)); showToast(locale === 'km' ? 'បានដាក់ក្នុង editor' : 'Loaded into editor'); }} />
                        <CopyBtn c={c} onClick={() => handleCopy(analysisResult.fixedCode, language)} />
                      </div>
                    </div>
                    {showDiff
                      ? <DiffView original={originalCode} fixed={analysisResult.fixedCode} c={c} screenW={screenW} />
                      : <SyntaxHighlighter language={langForHL} style={c.codeTheme} wrapLines={true} wrapLongLines={true} customStyle={{ margin: 0, borderRadius: 10, fontSize: 12.5, lineHeight: 1.75, background: c.codeBg, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden' }}>{analysisResult.fixedCode}</SyntaxHighlighter>}
                  </div>
                )}

                {/* COMMENTED */}
                {activeTab === 'commented' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: tf, fontSize: 11, color: c.amber }}>{t.commentedLabel}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <UseCodeBtn c={c} onClick={() => { setCodeInput(formatCode(analysisResult.commentedCode || analysisResult.fixedCode, language)); showToast(locale === 'km' ? 'បានដាក់ក្នុង editor' : 'Loaded into editor'); }} />
                        <CopyBtn c={c} onClick={() => handleCopy(analysisResult.commentedCode || analysisResult.fixedCode, language)} />
                      </div>
                    </div>
                    {analysisResult.commentedCode
                      ? <SyntaxHighlighter language={langForHL} style={c.codeTheme} wrapLines={true} wrapLongLines={true} customStyle={{ margin: 0, borderRadius: 10, fontSize: 12.5, lineHeight: 1.75, background: c.codeBg, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden' }}>{analysisResult.commentedCode}</SyntaxHighlighter>
                      : <div style={{ padding: '1.5rem', background: c.bgSurface, borderRadius: 10, fontFamily: tf, fontSize: 12, color: c.text3, textAlign: 'center', lineHeight: 1.8 }}>{t.noCommented}<br /><span style={{ color: c.amber }}>{t.noCommentedHint}</span></div>}
                  </div>
                )}

                {/* EXPLANATION */}
                {activeTab === 'explain' && <p style={{ fontFamily: tf, fontSize: 13, color: c.text2, lineHeight: 1.9, margin: 0 }}>{analysisResult.explanation}</p>}

                {/* SUGGESTIONS */}
                {activeTab === 'suggest' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysisResult.improvementSuggestions?.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ minWidth: 24, height: 24, borderRadius: '50%', background: isDark ? 'rgba(167,139,250,0.1)' : 'rgba(124,58,237,0.08)', color: c.purple, fontSize: 10, fontWeight: 600, fontFamily: mono, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontFamily: tf, fontSize: 12.5, color: c.text2, lineHeight: 1.65 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom actions */}
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${c.borderSoft}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => exportToPDF(analysisResult, language, mode)}
                    style={{ fontFamily: tf, fontSize: 11, padding: '7px 16px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.red; e.currentTarget.style.color = c.red; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; }}>
                    ↓ {t.exportPDF}
                  </button>
                  <button onClick={handleShare}
                    style={{ fontFamily: tf, fontSize: 11, padding: '7px 16px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.blue; e.currentTarget.style.color = c.blue; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; }}>
                    ↗ {t.shareBtn}
                  </button>
                </div>

              </div>
            )}
          </div>
        </Panel>
      </main>

      {/* Status */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 10, color: c.text3, padding: `0 ${isMobile ? '0.75rem' : '1.25rem'} 1rem`, flexWrap: 'wrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.green, display: 'inline-block' }} />
        {t.connected} · ffxplain-api.onrender.com &nbsp;·&nbsp; {LANGUAGES.find(l => l.value === language)?.label} &nbsp;·&nbsp; {t.modes[mode]}
        {analysisResult?._provider && (
          <>&nbsp;·&nbsp; via <span style={{ color: c.teal }}>{analysisResult._provider}</span></>
        )}
      </div>

      <Toast message={toastMsg} visible={toastVisible} c={c} />
    </div>
  );
}

// ── Root export wrapped in ErrorBoundary ──────────────────────────────────────
export default function App() {
  const [isDark] = useState(true);
  return (
    <ErrorBoundary theme={isDark ? darkTheme : lightTheme}>
      <AppInner />
    </ErrorBoundary>
  );
}
