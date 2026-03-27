import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight, dracula, atomDark, nord } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect, useCallback, useRef, Component } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
    fixAll: '⚡ Fix all', fixingAll: 'fixing all...',
    tryExample: 'Try an example',
    codeHealth: 'Code Health',
    readyIn: 'Ready in',
    lines: 'lines', chars: 'chars', lineLabel: 'line', dropFile: 'drop file here',
    autoDetected: 'Auto-detected',
    shareImage: 'Save card',
    theme: 'Theme',
    diffNoChanges: '✓ No changes — code already matches fixed version',
    confidenceLabel: 'confidence',
    scoreBreakdown: 'Score breakdown',
    healthy: 'Healthy', needsWork: 'Needs work', critical: 'Critical',
    diffOriginal: 'original', diffFixed: 'fixed',
    tour: {
      skip: 'Skip tour', next: 'Next →', back: '← Back', done: 'Start using Fixplain ✓',
      steps: [
        {
          icon: '✎',
          title: 'Paste your code',
          body: 'Drop any code into the editor. Supports 12 languages — JavaScript, Python, SQL, TypeScript and more. You can also drag & drop a file directly.',
        },
        {
          icon: '⚙',
          title: 'Choose a mode',
          body: 'Fix + Refactor fixes bugs AND cleans up your code. Fix Only is for bugs only. Refactor Only tidies code you know is correct.',
        },
        {
          icon: '⚡',
          title: 'Run the analysis',
          body: 'Click Analyze or press ⌘Enter. The AI scans for bugs, assigns severity levels, and generates a fix — usually in 5–10 seconds.',
        },
        {
          icon: '◈',
          title: 'Read your results',
          body: 'Five tabs: Bugs Found shows issues with severity. Fixed Code has the corrected version. Commented Code adds JSDoc. Explanation and Suggestions help you learn.',
        },
        {
          icon: '↑',
          title: 'Share & export',
          body: 'Use ↺ Apply fix to patch one bug at a time, or ⚡ Fix all for everything at once. Export a PDF report or share results via a link.',
        },
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
    tagline: 'ជួសជុល ពន្យល់ រៀនពីវា',
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
    fixAll: '⚡ ជួសជុលទាំងអស់', fixingAll: 'កំពុងជួសជុល...',
    tryExample: 'សាកល្បងឧទាហរណ៍',
    codeHealth: 'សុខភាពកូដ',
    readyIn: 'រួចរាល់ក្នុង',
    lines: 'បន្ទាត់', chars: 'តួអក្សរ', lineLabel: 'បន្ទាត់', dropFile: 'ទម្លាក់ឯកសារទីនេះ',
    autoDetected: 'រកឃើញដោយស្វ័យប្រវត្តិ',
    shareImage: 'រក្សាទុករូប',
    theme: 'រចនា',
    diffNoChanges: '✓ គ្មានការផ្លាស់ប្តូរ — កូដដូចគ្នា',
    confidenceLabel: 'ជឿជាក់',
    scoreBreakdown: 'ការបែងចែកពិន្ទុ',
    healthy: 'សុខភាពល្អ', needsWork: 'ត្រូវកែ', critical: 'គ្រោះថ្នាក់',
    diffOriginal: 'ដើម', diffFixed: 'ជួសជុល',
    tour: {
      skip: 'រំលង', next: 'បន្ទាប់ →', back: '← ថយក្រោយ', done: 'ចាប់ផ្តើមប្រើ Fixplain ✓',
      steps: [
        {
          icon: '✎',
          title: 'បិទភ្ជាប់កូដ',
          body: 'ដាក់កូដរបស់អ្នកក្នុងប្រអប់ខាងឆ្វេង។ គាំទ្រ 12 ភាសា — JavaScript, Python, SQL, TypeScript និងច្រើនទៀត។ អ្នកក៏អាចទម្លាក់ឯកសារផ្ទាល់ផងដែរ។',
        },
        {
          icon: '⚙',
          title: 'ជ្រើសរើសរបៀប',
          body: 'ជួសជុល + តម្រៀប ជួសជុលបញ្ហា ហើយធ្វើឱ្យកូដស្អាត។ ជួសជុលតែ សម្រាប់បញ្ហាប៉ុណ្ណោះ។ តម្រៀបតែ ធ្វើឱ្យស្អាតដោយមិនប៉ះពាល់តក្កវិជ្ជា។',
        },
        {
          icon: '⚡',
          title: 'ដំណើរការការវិភាគ',
          body: 'ចុចប៊ូតុង ឬចុច ⌘Enter។ AI ស្កែនរកបញ្ហា កំណត់កម្រិតធ្ងន់ធ្ងរ និងបង្កើតការជួសជុល — ជាធម្មតា 5–10 វិនាទី។',
        },
        {
          icon: '◈',
          title: 'អានលទ្ធផល',
          body: 'ប្រាំផ្ទាំង៖ បញ្ហាដែលរកឃើញ បង្ហាញបញ្ហា។ កូដដែលជួសជុល មានកូដដែលបានកែ។ កូដមានមតិ បន្ថែម JSDoc។ ការពន្យល់ និង ការណែនាំ ជួយអ្នករៀន។',
        },
        {
          icon: '↑',
          title: 'ចែករំលែក និងនាំចេញ',
          body: 'ប្រើ ↺ ជួសជុល ដើម្បីជួសជុលបញ្ហាមួយ ឬ ⚡ ជួសជុលទាំងអស់។ នាំចេញ PDF ឬចែករំលែកលទ្ធផលតាមតំណ។',
        },
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
const darkTheme = { bgBase: '#1e1e1e', bgPanel: '#252526', bgSurface: '#2d2d2d', border: '#333333', borderSoft: '#2a2a2a', teal: '#2dd4bf', tealDim: '#1a8a7c', tealGlow: 'rgba(45,212,191,0.12)', red: '#f87171', redGlow: 'rgba(248,113,113,0.08)', green: '#4ade80', amber: '#fbbf24', blue: '#60a5fa', purple: '#a78bfa', text1: '#f0f2f8', text2: '#c4c9d8', text3: '#8b92a8', navBg: 'rgba(30,30,30,0.92)', codeTheme: vscDarkPlus, codeBg: '#1e1e1e', lineNumBg: '#252526', lineNumColor: '#8b92a8', isDark: true };
const lightTheme = {
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

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' }, { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' }, { value: 'csharp', label: 'C#' },
  { value: 'sql', label: 'SQL' }, { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' }, { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' }, { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' }, { value: 'swift', label: 'Swift' },
  { value: 'cpp', label: 'C++' }, { value: 'kotlin', label: 'Kotlin' },
  { value: 'bash', label: 'Bash/Shell' }
];
const MODES = ['both', 'fix', 'refactor'];
const TAB_KEYS = ['bugs', 'fixed', 'commented', 'explain', 'suggest'];
const EXT_MAP = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', cs: 'csharp', sql: 'sql', java: 'java', php: 'php', rb: 'ruby', go: 'go', rs: 'rust', swift: 'swift', cpp: 'cpp', kt: 'kotlin', sh: 'bash' };

// Syntax highlight themes — dark and light options
const THEMES = {
  dark: { 'VS Dark': vscDarkPlus, 'Dracula': dracula, 'Atom Dark': atomDark, 'Nord': nord },
  light: { 'One Light': oneLight },
};

// Language keyword hints for auto-detection on paste
const LANG_HINTS = [
  { lang: 'python', patterns: [/^def\s+\w+\(/m, /^import\s+\w/m, /^from\s+\w+\s+import/m, /:\s*$\n\s+/m] },
  { lang: 'typescript', patterns: [/:\s*(string|number|boolean|any|void)\b/, /interface\s+\w+\s*\{/, /=>\s*\w+\s*:/, /<\w+>/] },
  { lang: 'sql', patterns: [/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/im] },
  { lang: 'nodejs', patterns: [/require\s*\(\s*['"]express['"]/, /require\s*\(\s*['"]fs['"]/, /require\s*\(\s*['"]path['"]/, /app\.(get|post|put|delete|use)\s*\(/, /module\.exports\s*=/, /process\.env\b/] },
  { lang: 'java', patterns: [/public\s+(class|static|void)\b/, /System\.out\.print/] },
  { lang: 'csharp', patterns: [/using\s+System[;.]/, /Console\.Write/, /namespace\s+\w+/] },
  { lang: 'ruby', patterns: [/^def\s+\w+/m, /\.each\s+do\s*\|/, /require\s+['"]/, /puts\s+/] },
  { lang: 'go', patterns: [/^package\s+\w+/m, /^func\s+\w+/m, /fmt\.Print/] },
  { lang: 'rust', patterns: [/^fn\s+\w+/m, /let\s+mut\s+/, /println!\(/, /use\s+std::/] },
  { lang: 'swift', patterns: [/^func\s+\w+/m, /var\s+\w+:\s*\w+/, /print\(/, /import\s+Foundation/] },
  { lang: 'php', patterns: [/^<\?php/m, /\$\w+\s*=/, /echo\s+/, /->/] },
  { lang: 'javascript', patterns: [/const\s+\w+\s*=/, /let\s+\w+\s*=/, /var\s+\w+\s*=/, /=>\s*\{/, /function\s+\w+\s*\(/, /console\.(log|error|warn)\s*\(/, /document\.|window\.|addEventListener/] },
];
const SEVERITY_STYLE = {
  high: { dark: { bg: '#450a0a', color: '#f87171' }, light: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' } },
  medium: { dark: { bg: '#422006', color: '#fbbf24' }, light: { bg: 'rgba(217,119,6,0.1)', color: '#d97706' } },
  low: { dark: { bg: '#172554', color: '#60a5fa' }, light: { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' } },
};

const mono = "'JetBrains Mono', monospace";
const sans = "'Sora', sans-serif";
const khmer = "'Hanuman', 'Noto Sans Khmer', sans-serif";

// ── Utilities ─────────────────────────────────────────────────────────────────
const normalizeBugs = bugs => !bugs?.length ? [] : bugs.map(b => typeof b === 'string' ? { issue: b, severity: 'medium', lineNumber: null } : b);

const computeHealthScore = bugs => {
  if (!bugs.length) return 100;
  // Only high (−20) and medium (−8) reduce the score; low bugs are ignored per PRD
  const realBugs = bugs.filter(b => b.severity === 'high' || b.severity === 'medium');
  if (!realBugs.length) return 100;
  const deductions = realBugs.reduce((sum, b) => sum + (b.severity === 'high' ? 20 : 8), 0);
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

const handleExport = async () => {
  const element = document.getElementById('hidden-pdf-document');
  if (!element) return;

  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const maxW = pdfWidth - margin * 2;
    const maxH = pdfHeight - margin * 2;

    const ratio = canvas.width / canvas.height;
    let imgW = maxW;
    let imgH = maxW / ratio;

    if (imgH > maxH) {
      imgH = maxH;
      imgW = maxH * ratio;
    }

    const x = (pdfWidth - imgW) / 2;
    const y = margin;

    pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
    pdf.save('Fixplain-Analysis.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

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
  return <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color, letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>;
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

// ── Onboarding Tour — spotlight style ────────────────────────────────────────
function OnboardingTour({ c, t, onDone }) {
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState(null);
  const steps = t.tour.steps;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  // Selector for each step's target element
  const selectors = ['[data-tour="editor"]', '[data-tour="modes"]', '[data-tour="analyze"]', '[data-tour="results"]', '[data-tour="actions"]'];

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
      {/* Dark overlay with spotlight hole using clip-path or SVG */}
      {sp && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'all' }}
          onClick={e => { if (e.target.tagName === 'path') return; }}>
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
      <div style={{
        position: 'absolute', ...cardStyle(),
        background: c.bgPanel,
        border: `1.5px solid ${c.teal}`,
        borderRadius: 16,
        padding: '20px 22px',
        pointerEvents: 'all',
        animation: 'fpFadeIn 0.2s ease',
        zIndex: 201,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 20, color: c.teal, lineHeight: 1 }}>{steps[step].icon}</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: c.teal, background: c.tealGlow, padding: '2px 8px', borderRadius: 20 }}>
              {step + 1} / {steps.length}
            </span>
          </div>
          <button onClick={onDone}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text3, fontFamily: mono, fontSize: 11, padding: '2px 6px', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = c.text1}
            onMouseLeave={e => e.currentTarget.style.color = c.text3}>
            {t.tour.skip}
          </button>
        </div>

        {/* Title */}
        <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: c.text1, margin: '0 0 8px' }}>
          {steps[step].title}
        </p>

        {/* Body */}
        <p style={{ fontFamily: sans, fontSize: 13, color: c.text2, lineHeight: 1.7, margin: '0 0 16px' }}>
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
              <button key={i} onClick={() => setStep(i)}
                style={{ width: i === step ? 16 : 6, height: 6, borderRadius: 3, background: i === step ? c.teal : c.border, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ fontFamily: mono, fontSize: 11, padding: '6px 12px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.tealDim; e.currentTarget.style.color = c.teal; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; }}>
                {t.tour.back}
              </button>
            )}
            <button onClick={() => isLast ? onDone() : setStep(s => s + 1)}
              style={{ fontFamily: mono, fontSize: 11, padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${c.tealDim}`, background: c.tealGlow, color: c.teal, cursor: 'pointer', fontWeight: 600, transition: '0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,212,191,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = c.tealGlow}>
              {isLast ? t.tour.done : t.tour.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Health Score Ring ─────────────────────────────────────────────────────────
function HealthRing({ score, c, label, isMobile, bugs, t }) {
  const r = 20, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = healthColor(score, c);
  const highBugs = bugs.filter(b => b.severity === 'high');
  const medBugs = bugs.filter(b => b.severity === 'medium');
  const deductions = highBugs.length * 25 + medBugs.length * 12;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 14px', background: c.bgSurface, borderRadius: 12, border: `1px solid ${c.borderSoft}`, width: isMobile ? '100%' : 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            {score >= 80 ? t.healthy : score >= 50 ? t.needsWork : t.critical}
          </p>
        </div>
      </div>
      {deductions > 0 && (
        <div style={{ borderTop: `1px solid ${c.borderSoft}`, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.scoreBreakdown}</span>
          {highBugs.length > 0 && <span style={{ fontFamily: mono, fontSize: 12, color: c.red }}>−{highBugs.length * 25} · {highBugs.length} high {highBugs.length === 1 ? 'bug' : 'bugs'} (×25)</span>}
          {medBugs.length > 0 && <span style={{ fontFamily: mono, fontSize: 12, color: c.amber }}>−{medBugs.length * 12} · {medBugs.length} medium {medBugs.length === 1 ? 'bug' : 'bugs'} (×12)</span>}
          <span style={{ fontFamily: mono, fontSize: 12, color }}>= {score}/100</span>
        </div>
      )}
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

// ── Diff view — git-style unified diff ───────────────────────────────────────
function DiffView({ original, fixed, c, screenW, isDark, t }) {
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
        <span style={{ fontSize: 24, color: c.green }}>✓</span>
        <span style={{ fontFamily: mono, fontSize: 12, color: c.text2 }}>{t?.diffNoChanges || 'No changes — code already matches fixed version'}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 10, border: `1px solid ${c.borderSoft}`, overflow: 'hidden' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px', background: c.bgSurface, borderBottom: `1px solid ${c.borderSoft}`, fontFamily: mono, fontSize: 10, flexWrap: 'wrap' }}>
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
        <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: 400, fontFamily: mono, fontSize: 12, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {rows.map((row, i) => {
            const s = typeStyle(row.type);
            const content = row.type === 'removed' ? row.orig : row.fixed;
            if (!content && row.type === 'same') return null;
            return (
              <div key={i} style={{ display: 'flex', background: s.bg, minHeight: 22, borderLeft: `2px solid ${row.type === 'same' ? 'transparent' : s.color}` }}>
                <span style={{ color: s.numColor, minWidth: 18, padding: '0 6px', userSelect: 'none', lineHeight: '22px', flexShrink: 0, fontWeight: 600, fontSize: 10 }}>{s.symbol}</span>
                <span style={{ color: s.color, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '22px', flex: 1, padding: '0 8px 0 0' }}>{content}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxHeight: 400, overflow: 'hidden' }}>
          {['orig', 'fixed'].map(side => (
            <div key={side} style={{ borderRight: side === 'orig' ? `1px solid ${c.borderSoft}` : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '4px 12px', background: c.bgSurface, borderBottom: `1px solid ${c.borderSoft}`, fontFamily: mono, fontSize: 10, color: side === 'orig' ? c.red : c.green, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 8 }}>●</span>
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
                      <span style={{ fontFamily: mono, fontSize: 10, color: isEmpty ? c.border : s.numColor, minWidth: 32, padding: '0 6px', userSelect: 'none', lineHeight: '22px', textAlign: 'right', flexShrink: 0 }}>
                        {isEmpty ? '' : (lineNum ?? '')}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 10, color: s.numColor, minWidth: 12, lineHeight: '22px', flexShrink: 0, opacity: isEmpty ? 0 : 1 }}>{row.type === 'same' ? ' ' : s.symbol}</span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: isEmpty ? 'transparent' : s.color, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '22px', flex: 1, padding: '0 8px 0 2px' }}>
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

// ── Line-numbered editor ──────────────────────────────────────────────────────
function LineNumberedEditor({ c, value, onChange, onPaste, isDragging, highlightLine, placeholder, dropFileLabel }) {
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
          <span style={{ fontFamily: mono, fontSize: 13, color: c.teal }}>{dropFileLabel || 'drop file here'}</span>
        </div>
      )}
      {value.trim() && (
        <div ref={lnRef} style={{ background: c.lineNumBg, borderRight: `1px solid ${c.borderSoft}`, padding: '1rem 8px 1rem 12px', textAlign: 'right', fontFamily: mono, fontSize: 13, lineHeight: 1.8, userSelect: 'none', overflowY: 'hidden', minWidth: 48, flexShrink: 0 }}>
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
        onPaste={onPaste}
        spellCheck={false}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: c.text1, fontFamily: mono, fontSize: 14, lineHeight: 1.8,
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
function Toast({ message, visible, c, undoable }) {
  return (
    <div
      onClick={undoable && window._fpUndo ? () => window._fpUndo() : undefined}
      style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: c.bgSurface, border: `1px solid ${c.green}`, color: c.green, fontFamily: mono, fontSize: 12, padding: '8px 18px', borderRadius: 20, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.25s, transform 0.25s', pointerEvents: visible && undoable ? 'all' : 'none', zIndex: 200, cursor: undoable ? 'pointer' : 'default' }}>
      ✓ {message}
    </div>
  );
}

// ── YouTube Video Card ────────────────────────────────────────────────────────
// Fetches a real video from our backend /api/youtube endpoint and shows a card.
function YouTubeCard({ query, c, locale }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true); setFailed(false); setVideo(null);
    fetch(`https://ffxplain-api.onrender.com/api/youtube?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (d.video) setVideo(d.video); else setFailed(true); })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(248,113,113,0.06)', borderRadius: 8, border: `1px solid rgba(248,113,113,0.15)` }}>
      <div style={{ width: 80, height: 45, background: 'rgba(248,113,113,0.1)', borderRadius: 6, flexShrink: 0, animation: 'fpShimmer 1.4s ease-in-out infinite' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ height: 9, width: '80%', background: 'rgba(248,113,113,0.1)', borderRadius: 4, animation: 'fpShimmer 1.4s ease-in-out 0.1s infinite' }} />
        <div style={{ height: 8, width: '50%', background: 'rgba(248,113,113,0.08)', borderRadius: 4, animation: 'fpShimmer 1.4s ease-in-out 0.2s infinite' }} />
      </div>
    </div>
  );

  if (failed || !video) return null;

  return (
    <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(248,113,113,0.06)', borderRadius: 8, border: `1px solid rgba(248,113,113,0.2)`, transition: '0.15s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)'; }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={video.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
        </div>
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#f87171', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{video.title}</p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: c.text3, margin: 0 }}>
          {video.channel}{video.viewCount ? ` · ${video.viewCount} views` : ''}
        </p>
      </div>
    </a>
  );
}
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
const CHAR_WARN = 9000;

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
  const [fixedView, setFixedView] = useState('code'); // 'code' | 'commented' | 'diff'
  const [isDragging, setIsDragging] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastUndoable, setToastUndoable] = useState(false);
  const [screenW, setScreenW] = useState(window.innerWidth);
  const [tabKey, setTabKey] = useState(0);
  const [progressStep, setProgressStep] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [highlightLine, setHighlightLine] = useState(null);
  const [fixingBug, setFixingBug] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [originalCode, setOriginalCode] = useState('');
  const [wasLoadedFromFix, setWasLoadedFromFix] = useState(false);
  const [codeThemeName, setCodeThemeName] = useState('VS Dark');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);

  const c = isDark ? darkTheme : lightTheme;
  const t = i18n[locale];
  const tf = locale === 'km' ? khmer : sans;
  const isMobile = screenW < 768;
  const isTablet = screenW >= 768 && screenW < 1024;
  const bugs = normalizeBugs(analysisResult?.bugsFound);
  const tabAccent = { bugs: c.red, fixed: c.green, commented: c.amber, explain: c.blue, suggest: c.purple };
  const langForHL = { nodejs: 'javascript', csharp: 'csharp', sql: 'sql', python: 'python', typescript: 'typescript', java: 'java', php: 'php', ruby: 'ruby', go: 'go', rust: 'rust', swift: 'swift' }[language] || 'javascript';
  const allThemes = isDark ? THEMES.dark : THEMES.light;
  const activeTheme = allThemes[codeThemeName] || Object.values(allThemes)[0];

  // Inject keyframes
  useEffect(() => {
    if (document.getElementById('fp-styles')) return;
    const s = document.createElement('style');
    s.id = 'fp-styles';
    s.textContent = `@keyframes fpFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes fpShimmer{0%,100%{opacity:.3}50%{opacity:.8}}*{-webkit-tap-highlight-color:transparent;}[style*="scrollbarWidth"]::-webkit-scrollbar,[style*="msOverflowStyle"]::-webkit-scrollbar{display:none;}textarea::placeholder{color:#8b92a8;opacity:1;font-style:italic;font-size:13px;}*:focus-visible{outline:2px solid #2dd4bf;outline-offset:2px;border-radius:4px;}@media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}`;
    document.head.appendChild(s);
  }, []);

  // Responsive
  useEffect(() => { const fn = () => setScreenW(window.innerWidth); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);


  // Load history + check for shared result in URL hash
  useEffect(() => {
    // Wake up Render immediately on page load — eliminates cold start delay
    fetch('https://ffxplain-api.onrender.com/api/ping').catch(() => { });

    // Fix: wrap in try/catch — JSON.parse throws on corrupted data or incognito mode
    try {
      const saved = localStorage.getItem('fixplain_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch { localStorage.removeItem('fixplain_history'); }

    const hash = window.location.hash.slice(1);
    if (hash) {
      decodeShare(hash).then(decoded => {
        if (decoded) {
          const result = decoded.result;
          if (decoded.locale) result._locale = decoded.locale;
          setAnalysisResult(result);
          setLanguage(decoded.language);
          setMode(decoded.mode);
          if (decoded.codeInput) setCodeInput(decoded.codeInput);
          switchTab('bugs');
        }
      });
    }
    // Fix: mark tour done immediately on first show, not only on completion
    // PRD says "never shown again" — closing mid-tour should also count
    if (!localStorage.getItem('fp_tour_done')) {
      setShowTour(true);
      localStorage.setItem('fp_tour_done', '1');
    }
  }, []);

  const showToast = msg => { setToastMsg(msg); setToastVisible(true); setToastUndoable(false); setTimeout(() => setToastVisible(false), 2200); };
  const showUndoToast = (msg, undoFn) => {
    setToastMsg(msg); setToastVisible(true); setToastUndoable(true);
    const timer = setTimeout(() => { setToastVisible(false); setToastUndoable(false); }, 4000);
    window._fpUndo = () => { clearTimeout(timer); undoFn(); setToastVisible(false); setToastUndoable(false); };
  };

  const handleCopy = async (text, lang) => {
    const formatted = formatCode(text, lang || language);
    try {
      await navigator.clipboard.writeText(formatted);
      showToast(t.copied);
    } catch {
      showToast(locale === 'km' ? 'ចម្លងបរាជ័យ — សូមជ្រើសអក្សរដោយដៃ' : 'Copy failed — select text manually');
    }
  };

  const clearHistory = () => { setHistory([]); localStorage.removeItem('fixplain_history'); };

  const handleShare = async () => {
    if (!analysisResult) return;
    const encoded = await encodeShare(analysisResult, language, mode, codeInput);
    if (!encoded) return;
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.shareCopied);
    } catch {
      showToast(locale === 'km' ? 'ចម្លងបរាជ័យ' : 'Copy failed');
    }
  };

  const handleCodeChange = val => {
    setCodeInput(val);
  };

  // Auto-detect language only on paste (large delta) — not on every keystroke
  const handleCodePaste = e => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (pasted.length > 50) {
      setTimeout(() => {
        const detected = detectLanguage(pasted);
        if (detected && detected !== language) {
          setLanguage(detected);
          showToast((locale === 'km' ? t.autoDetected : 'Auto-detected') + ': ' + LANGUAGES.find(l => l.value === detected)?.label);
        }
      }, 100);
    }
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

  const switchTab = key => { setActiveTab(key); setTabKey(k => k + 1); setFixedView('code'); };
  const loadExample = ex => { setCodeInput(ex.code); setLanguage(ex.lang); setAnalysisResult(null); setError(null); };

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true); setIsWarmingUp(false); setError(null); setAnalysisResult(null);
    setHighlightLine(null); setOriginalCode(codeInput); switchTab('bugs');
    const wasFixed = wasLoadedFromFix;
    setWasLoadedFromFix(false);

    // Auto-detect language if user forgot to pick — safety net before sending
    const detectedLang = detectLanguage(codeInput);
    if (detectedLang && detectedLang !== language) {
      setLanguage(detectedLang);
    }
    const effectiveLang = detectedLang || language;

    // Input validation — reject plain sentences, require code-like content
    const looksLikeCode = /[{};()\[\]=><]/.test(codeInput) || codeInput.split('\n').length > 2;
    if (!looksLikeCode) {
      setError(locale === 'km'
        ? 'សូមបញ្ចូលកូដ មិនមែនអក្សរធម្មតា។'
        : 'Please paste code, not plain text.');
      setIsLoading(false);
      setIsWarmingUp(false);
      return;
    }

    const API = 'https://ffxplain-api.onrender.com';
    const warmupTimer = setTimeout(() => setIsWarmingUp(true), 5000);

    try {
      const res = await fetch(`${API}/api/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeInput,
          language: effectiveLang,
          mode,
          locale,
          previousBugs: analysisResult ? normalizeBugs(analysisResult.bugsFound).map(b => b.issue) : [],
          wasAlreadyFixed: wasFixed,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      data._locale = locale;
      setAnalysisResult(data);
      // Auto-switch to Fixed Code tab when: no bugs found OR refactor-only mode
      if (!normalizeBugs(data.bugsFound).length || mode === 'refactor') switchTab('fixed');
      const entry = { ...data, _meta: { language: effectiveLang, mode, locale, time: Date.now(), codeInput } };
      const updated = [entry, ...history].slice(0, 5);
      setHistory(updated); localStorage.setItem('fixplain_history', JSON.stringify(updated));
      setCooldown(3);
    } catch {
      setError(t.errorMsg);
      setCooldown(0); // Fix: don't block retry after error
    } finally {
      clearTimeout(warmupTimer);
      setIsLoading(false);
      setIsWarmingUp(false);
    }
  }, [codeInput, language, mode, locale, history, t, analysisResult, wasLoadedFromFix]);

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

  // When the UI locale changes AND a result already exists, translate only the
  // explanation + suggestions via the lightweight /translate-text endpoint.
  // Code diffs are language-agnostic and are kept exactly as-is.
  useEffect(() => {
    const result = analysisResult;
    if (!result || (!result.explain && !result.explanation)) return;

    showToast(locale === 'km' ? 'កំពុងបកប្រែ...' : 'Translating...');

    const explain = result.explain || result.explanation || '';
    const suggest = result.suggest || result.improvementSuggestions || [];

    const API = 'https://ffxplain-api.onrender.com';
    fetch(`${API}/api/translate-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ explain, suggest, targetLocale: locale }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(translatedData => {
        setAnalysisResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            explain: translatedData.explain,
            suggest: translatedData.suggest,
            explanation: translatedData.explain, // keep for backward compat
            improvementSuggestions: translatedData.suggest, // keep for backward compat
            // Explicitly keep these the same
            fixedCode: prev.fixedCode,
            commentedCode: prev.commentedCode,
            bugs: prev.bugs || prev.bugsFound,
            bugsFound: prev.bugsFound, // keep for backward compat
            _locale: locale,
          };
        });
      })
      .catch(() => { /* silent — keep current result */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Keyboard tab navigation — left/right arrow keys when no input focused
  useEffect(() => {
    const fn = e => {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') { const i = TAB_KEYS.indexOf(activeTab); if (i < TAB_KEYS.length - 1) switchTab(TAB_KEYS[i + 1]); }
      if (e.key === 'ArrowLeft') { const i = TAB_KEYS.indexOf(activeTab); if (i > 0) switchTab(TAB_KEYS[i - 1]); }
    };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, [activeTab]);

  // Progress step cycling — clamps at last step so "Almost done..." stays visible
  useEffect(() => {
    if (!isLoading) return;
    setProgressStep(0);
    const steps = t.progressSteps;
    let idx = 0;
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, steps.length - 1);
      setProgressStep(idx);
    }, 2200);
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
        const prev = codeInput;
        setCodeInput(formatted);
        showUndoToast(locale === 'km' ? 'បានជួសជុល ✓ · ប្តូរត្រឡប់?' : t.applyFix + ' ✓ · Undo?', () => setCodeInput(prev));
      }
    } catch { showToast(locale === 'km' ? 'ជួសជុលបរាជ័យ' : 'Fix failed'); }
    finally { setFixingBug(null); }
  };

  // Fix all bugs at once — loads fixedCode into editor with undo
  const handleFixAll = () => {
    if (!analysisResult?.fixedCode) return;
    setFixingAll(true);
    setTimeout(() => {
      const prev = codeInput;
      setCodeInput(formatCode(analysisResult.fixedCode, language));
      setWasLoadedFromFix(true);
      showUndoToast(locale === 'km' ? 'បានជួសជុលទាំងអស់ ✓ · ប្តូរត្រឡប់?' : 'All bugs fixed ✓ · Undo?', () => { setCodeInput(prev); setWasLoadedFromFix(false); });
      setFixingAll(false);
    }, 400);
  };

  // Auto-detect language from code content
  const detectLanguage = code => {
    for (const { lang, patterns } of LANG_HINTS) {
      if (patterns.some(p => p.test(code))) return lang;
    }
    return null;
  };

  const lineCount = codeInput.split('\n').length;
  const charCount = codeInput.length;
  // Hide score (null) while loading so no stale value is shown
  const healthScore = isLoading ? null : (bugs.length > 0 || analysisResult ? computeHealthScore(bugs) : null);

  return (
    <div style={{ minHeight: '100vh', background: c.bgBase, color: c.text1, fontFamily: tf, display: 'flex', flexDirection: 'column', transition: 'background 0.2s, color 0.2s', overflowX: 'hidden', width: '100%' }}>

      {showTour && <OnboardingTour c={c} t={t} onDone={() => { setShowTour(false); }} />}
      <AnimatedBackground isDark={isDark} paused={isLoading} />

      {/* ── Nav ── */}
      <nav style={{ borderBottom: `1px solid ${c.borderSoft}`, padding: isMobile ? '8px 0.75rem' : '0 1.25rem', minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.navBg, backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {isDark ? (
            <svg width={isMobile ? 110 : 140} viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="80" height="80" rx="18" fill="#0d2d29" />
              <path d="M22 16 C16 16 13 20 13 25 L13 32 C13 37 10 39 8 40 C10 41 13 43 13 48 L13 55 C13 60 16 64 22 64" stroke="#2dd4bf" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M58 16 C64 16 67 20 67 25 L67 32 C67 37 70 39 72 40 C70 41 67 43 67 48 L67 55 C67 60 64 64 58 64" stroke="#2dd4bf" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <polyline points="26,41 34,51 54,29" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <text x="96" y="54" fontFamily="'JetBrains Mono', 'Courier New', monospace" fontSize="42" fontWeight="700" fill="#2dd4bf">fix</text>
              <text x="172" y="54" fontFamily="'JetBrains Mono', 'Courier New', monospace" fontSize="42" fontWeight="400" fill="#c8cdd8">plain</text>
            </svg>
          ) : (
            <svg width={isMobile ? 110 : 140} viewBox="0 0 400 80" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="80" height="80" rx="18" fill="#f0faf8" stroke="#d1d5db" strokeWidth="1" />
              <path d="M22 16 C16 16 13 20 13 25 L13 32 C13 37 10 39 8 40 C10 41 13 43 13 48 L13 55 C13 60 16 64 22 64" stroke="#0d9488" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M58 16 C64 16 67 20 67 25 L67 32 C67 37 70 39 72 40 C70 41 67 43 67 48 L67 55 C67 60 64 64 58 64" stroke="#0d9488" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <polyline points="26,41 34,51 54,29" fill="none" stroke="#111318" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <text x="96" y="54" fontFamily="'JetBrains Mono', 'Courier New', monospace" fontSize="42" fontWeight="700" fill="#0d9488">fix</text>
              <text x="172" y="54" fontFamily="'JetBrains Mono', 'Courier New', monospace" fontSize="42" fontWeight="400" fill="#111318">plain</text>
            </svg>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {!isMobile && <span style={{ fontSize: 10, fontFamily: mono, color: c.text3, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <kbd style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10, color: c.text3 }}>{navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}</kbd>
            <kbd style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 10, color: c.text3 }}>Enter</kbd>
            <span>{t.toAnalyze}</span>
          </span>}
          <button onClick={() => setLocale(l => l === 'en' ? 'km' : 'en')} style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 10px', cursor: 'pointer', fontFamily: locale === 'km' ? mono : khmer, fontSize: 11, color: c.text2, transition: '0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = c.tealDim} onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>{t.langToggle}</button>
          {/* Theme picker — only show on desktop */}
          {!isMobile && Object.keys(allThemes).length > 1 && (
            <select value={codeThemeName} onChange={e => setCodeThemeName(e.target.value)}
              style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text2, fontFamily: mono, fontSize: 10, padding: '5px 6px', cursor: 'pointer', outline: 'none' }}>
              {Object.keys(allThemes).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
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
        {/* Powered by Groq */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 22, color: c.text3 }}>{locale === 'km' ? 'ដំណើរការដោយ' : 'Powered by'}</span>
          <span style={{ fontFamily: mono, fontSize: 22, color: c.teal, fontWeight: 600 }}>Groq</span>
        </div>
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
          <Panel c={c} data-tour="editor" style={{ flex: isMobile || isTablet ? 'none' : '1', minHeight: isMobile ? 280 : 380, height: isMobile || isTablet ? 320 : undefined, width: '100%', minWidth: 0 }}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            {/* Top row: dots + clear */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: c.text3, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Dot color={c.amber} /><Dot color={c.green} /><Dot color={c.red} />
                {!isMobile && <>&nbsp; input.{({ python: 'py', sql: 'sql', csharp: 'cs', java: 'java', php: 'php', typescript: 'ts' })[language] || 'js'}</>}
              </span>
              <button onClick={() => {
                if (!codeInput.trim()) return;
                const prev = codeInput;
                setCodeInput('');
                showUndoToast(locale === 'km' ? 'បានលុបកូដ · ប្តូរត្រឡប់?' : 'Code cleared · Undo?', () => setCodeInput(prev));
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text3, fontSize: 11, fontFamily: mono, padding: '2px 6px', borderRadius: 5, flexShrink: 0 }}
                onMouseEnter={e => e.target.style.color = c.text1} onMouseLeave={e => e.target.style.color = c.text3}>{t.clearBtn}</button>
            </div>
            {/* Language selector row — below clear, easy to see and select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface }}>
              <span style={{ fontFamily: mono, fontSize: 10, color: c.text3, flexShrink: 0 }}>
                {locale === 'km' ? 'ភាសា:' : 'Language:'}
              </span>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                style={{ width: '120px', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: c.bgPanel, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text1, fontFamily: mono, fontSize: 12, padding: '5px 8px', cursor: 'pointer', outline: 'none', transition: '0.15s' }}
                onFocus={e => e.currentTarget.style.borderColor = c.tealDim}
                onBlur={e => e.currentTarget.style.borderColor = c.border}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              {/* Auto-detected badge — shows when language was auto-switched */}
              <span style={{ fontFamily: mono, fontSize: 9, color: c.teal, background: c.tealGlow, padding: '2px 7px', borderRadius: 20, flexShrink: 0, opacity: 0.85 }}>
                {locale === 'km' ? 'ស្វ័យប្រវត្តិ' : 'auto'}
              </span>
            </div>
            {/* Mode buttons row */}
            <div data-tour="modes" style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface }}>
              <div style={{ display: 'flex', gap: 6, padding: '8px 12px', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {MODES.map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    style={{ fontFamily: tf, fontSize: 11, padding: '5px 14px', borderRadius: 20, border: `1px solid ${mode === m ? c.tealDim : c.border}`, background: mode === m ? c.tealGlow : 'transparent', color: mode === m ? c.teal : c.text2, cursor: 'pointer', transition: '0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
                    onMouseEnter={e => { if (mode !== m) { e.currentTarget.style.borderColor = c.tealDim; e.currentTarget.style.color = c.teal; } }}
                    onMouseLeave={e => { if (mode !== m) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; } }}>
                    {t.modes[m]}
                  </button>
                ))}
              </div>
              {/* Mode description */}
              <div style={{ padding: '0 12px 7px', fontFamily: tf, fontSize: 11, color: c.text3, lineHeight: 1.5 }}>
                {{
                  both: locale === 'km' ? 'ជួសជុលបញ្ហា និងធ្វើឱ្យកូដស្អាតស្រស់ — ល្អបំផុតសម្រាប់ការប្រើប្រាស់ទូទៅ' : 'Fixes bugs and cleans up code structure — best for most cases',
                  fix: locale === 'km' ? 'ជួសជុលតែបញ្ហា ដោយមិនប៉ះពាល់ការរចនាបន្ថែម' : 'Fixes bugs only, without touching code structure or style',
                  refactor: locale === 'km' ? 'រៀបចំតែរចនាបន្ថែម ដោយសន្មត់ថាតក្ក វិជ្ជាកូដត្រឹមត្រូវ' : 'Cleans up code style only, assumes logic is already correct',
                }[mode]}
              </div>
            </div>
            <LineNumberedEditor
              c={c}
              value={codeInput}
              onChange={handleCodeChange}
              onPaste={handleCodePaste}
              isDragging={isDragging}
              highlightLine={highlightLine}
              dropFileLabel={t.dropFile}
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

          <button data-tour="analyze" onClick={handleAnalyze} disabled={isLoading || !codeInput.trim() || cooldown > 0}
            style={{ fontFamily: tf, fontSize: isMobile ? 13 : 15, fontWeight: 600, padding: '14px 0', borderRadius: 30, border: `1.5px solid ${isDark ? '#4338ca' : c.tealDim}`, background: isLoading ? 'transparent' : (isDark ? '#4f46e5' : c.tealGlow), color: isDark ? '#ffffff' : c.teal, cursor: (isLoading || !codeInput.trim() || cooldown > 0) ? 'not-allowed' : 'pointer', letterSpacing: '0.4px', transition: 'all 0.2s', opacity: (!codeInput.trim() && !isLoading) ? 0.4 : 1, width: '100%', animation: isLoading ? 'fpShimmer 1.5s ease-in-out infinite' : 'none' }}>
            {isLoading
              ? (isWarmingUp ? t.warmingUp : t.analyzingBtn)
              : cooldown > 0 ? `${t.readyIn} ${cooldown}s`
                : analysisResult ? t.reanalyzeBtn
                  : t.analyzeBtn}
          </button>

          {/* Health score — show spinner while loading, ring when done */}
          {isLoading && originalCode.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: c.bgSurface, borderRadius: 12, border: `1px solid ${c.borderSoft}` }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c.teal, display: 'inline-block', animation: `fpShimmer 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
              <span style={{ fontFamily: mono, fontSize: 11, color: c.teal }}>{locale === 'km' ? 'កំពុងគណនា...' : 'Calculating...'}</span>
            </div>
          )}
          {!isLoading && healthScore !== null && <HealthRing score={healthScore} c={c} label={t.codeHealth} isMobile={isMobile} bugs={bugs} t={t} />}

          {/* History */}
          {history.length > 0 && (
            <Panel c={c}>
              <PanelHeader c={c}>
                <span style={{ fontFamily: tf, fontSize: 11, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.history}</span>
                <button onClick={() => {
                  if (!clearConfirm) {
                    setClearConfirm(true);
                    setTimeout(() => setClearConfirm(false), 2500);
                  } else {
                    clearHistory();
                    setClearConfirm(false);
                  }
                }} style={{ background: 'none', border: clearConfirm ? `1px solid ${c.red}` : 'none', borderRadius: 20, padding: clearConfirm ? '2px 8px' : '0', cursor: 'pointer', color: c.red, fontFamily: tf, fontSize: 10, textTransform: 'uppercase', transition: '0.2s' }}>
                  {clearConfirm ? (locale === 'km' ? 'ប្រាកដ?' : 'confirm?') : t.clearAll}
                </button>
              </PanelHeader>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((item, idx) => {
                  const meta = item._meta || {}, firstBug = item.bugsFound?.[0];
                  const bugLabel = typeof firstBug === 'string' ? firstBug : firstBug?.issue;
                  const score = computeHealthScore(normalizeBugs(item.bugsFound));
                  return (
                    <button key={idx} onClick={() => {
                      const item2 = { ...item };
                      if (item._meta?.locale) item2._locale = item._meta.locale;
                      setAnalysisResult(item2);
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
                        {meta.time && <span style={{ fontFamily: mono, fontSize: 9, color: c.text3 }}>{(() => {
                          const d = new Date(meta.time), now = new Date();
                          const today = now.toDateString(), yesterday = new Date(now - 86400000).toDateString();
                          const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          if (d.toDateString() === today) return `Today ${time}`;
                          if (d.toDateString() === yesterday) return `Yesterday ${time}`;
                          return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
                        })()}</span>}
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
        <Panel id="pdf-export-content" c={c} data-tour="results" style={{ minHeight: isMobile ? 400 : 380, minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TAB_KEYS.map(key => {
              const accent = tabAccent[key], isActive = activeTab === key;
              const bugCount = key === 'bugs' && analysisResult ? bugs.length : 0;
              return (
                <button key={key} onClick={() => switchTab(key)}
                  style={{ fontFamily: tf, fontSize: isMobile ? 11 : 13, padding: isMobile ? '8px 8px' : '10px 13px', border: 'none', background: 'none', color: isActive ? accent : c.text3, borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = c.text1; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = c.text3; }}>
                  {isMobile ? t.tabs[key].split(' ')[0] : t.tabs[key]}
                  {bugCount > 0 && <span style={{ background: c.red, color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 20, lineHeight: 1.4 }}>{bugCount}</span>}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {error && (
              <div style={{ margin: '1rem', padding: '12px 16px', background: c.redGlow, border: `1px solid ${c.red}`, borderLeft: `3px solid ${c.red}`, borderRadius: 10, color: c.red, fontFamily: tf, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span>{error}</span>
                <button onClick={handleAnalyze} disabled={!codeInput.trim()}
                  style={{ fontFamily: tf, fontSize: 12, padding: '5px 14px', borderRadius: 20, border: `1px solid ${c.red}`, background: c.redGlow, color: c.red, cursor: 'pointer', flexShrink: 0, transition: '0.15s' }}>
                  {locale === 'km' ? '↺ ព្យាយាមម្តងទៀត' : '↺ Try again'}
                </button>
              </div>
            )}
            {isLoading && <LoadingSkeleton c={c} progressStep={isWarmingUp ? t.warmingUp : t.progressSteps[progressStep]} />}
            {!analysisResult && !isLoading && !error && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: '2.5rem 2rem' }}>
                <span style={{ fontSize: 28, opacity: 0.15 }}>◈</span>
                <p style={{ fontFamily: tf, fontSize: 13, color: c.text2, margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
                  {locale === 'km' ? 'បិទភ្ជាប់កូដ ហើយចុច ⌘Enter' : 'Paste code & press ⌘Enter'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
                  {[
                    { icon: '✗', color: c.red, text: locale === 'km' ? 'បញ្ហារកឃើញ ជាមួយកម្រិតធ្ងន់ធ្ងរ' : 'Bugs found with severity levels' },
                    { icon: '✓', color: c.green, text: locale === 'km' ? 'កូដដែលបានជួសជុល ត្រៀមចម្លង' : 'Fixed code ready to copy or use' },
                    { icon: '◈', color: c.blue, text: locale === 'km' ? 'ការពន្យល់ច្បាស់លាស់ជាភាសារបស់អ្នក' : 'Plain-language explanation of every change' },
                    { icon: '↑', color: c.purple, text: locale === 'km' ? '៣ ការណែនាំជាក់លាក់ដើម្បីកែលម្អ' : '3 actionable tips to improve your code' },
                  ].map(({ icon, color, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: c.bgSurface, borderRadius: 8, border: `1px solid ${c.borderSoft}` }}>
                      <span style={{ color, fontSize: 14, flexShrink: 0, width: 16, textAlign: 'center' }}>{icon}</span>
                      <span style={{ fontFamily: tf, fontSize: 12, color: c.text2, lineHeight: 1.4 }}>{text}</span>
                    </div>
                  ))}
                </div>
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
                        <span style={{ fontFamily: tf, fontSize: 14 }}>{t.noBugs}</span>
                      </div>
                    ) : (
                      <>
                        {/* Fix all button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={handleFixAll} disabled={fixingAll}
                            style={{ fontFamily: tf, fontSize: 10, padding: '5px 14px', borderRadius: 20, border: `1px solid ${c.green}`, background: 'rgba(74,222,128,0.08)', color: c.green, cursor: fixingAll ? 'wait' : 'pointer', transition: '0.15s' }}>
                            {fixingAll ? t.fixingAll : t.fixAll}
                          </button>
                        </div>
                        {bugs.map((b, i) => (
                          <div key={i} style={{ padding: '10px 14px', background: c.redGlow, borderLeft: `2px solid ${c.red}`, borderRadius: '0 8px 8px 0' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                              <span style={{ color: c.red, marginTop: 1, flexShrink: 0 }}>✗</span>
                              <span style={{ fontFamily: mono, fontSize: 14, color: c.text1, lineHeight: 1.65, flex: 1 }}>{b.issue}</span>
                              <SeverityBadge severity={b.severity} isDark={isDark} label={t.severity[b.severity] || b.severity} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {b.lineNumber && (
                                <button onClick={() => setHighlightLine(l => l === b.lineNumber ? null : b.lineNumber)}
                                  style={{ fontFamily: mono, fontSize: 9, padding: '2px 8px', borderRadius: 10, border: `1px solid ${c.border}`, background: highlightLine === b.lineNumber ? c.tealGlow : 'transparent', color: highlightLine === b.lineNumber ? c.teal : c.text3, cursor: 'pointer', transition: '0.15s' }}>
                                  {t.lineLabel} {b.lineNumber}
                                </button>
                              )}
                              {b.confidence != null && (
                                <span style={{ fontFamily: mono, fontSize: 9, color: b.confidence >= 90 ? c.green : b.confidence >= 70 ? c.amber : c.text3 }}>
                                  {b.confidence}% {t.confidenceLabel}
                                </span>
                              )}

                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* FIXED CODE — code / diff toggle */}
                {activeTab === 'fixed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[
                          { key: 'code', label: t.codeView },
                          { key: 'diff', label: t.diffView },
                        ].map(({ key, label }) => (
                          <button key={key} onClick={() => setFixedView(key)}
                            style={{ fontFamily: mono, fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${fixedView === key ? c.tealDim : c.border}`, background: fixedView === key ? c.tealGlow : 'transparent', color: fixedView === key ? c.teal : c.text1, cursor: 'pointer', transition: '0.15s' }}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <UseCodeBtn c={c} onClick={() => { setCodeInput(formatCode(analysisResult.fixedCode, language)); setWasLoadedFromFix(true); showToast(locale === 'km' ? 'បានដាក់ក្នុង editor' : 'Loaded into editor'); }} />
                        <CopyBtn c={c} onClick={() => handleCopy(analysisResult.fixedCode, language)} />
                      </div>
                    </div>
                    {fixedView === 'diff'
                      ? <DiffView original={originalCode} fixed={analysisResult.fixedCode} c={c} screenW={screenW} isDark={isDark} t={t} />
                      : <SyntaxHighlighter language={langForHL} style={activeTheme} wrapLines={true} wrapLongLines={true} customStyle={{ margin: 0, borderRadius: 10, fontSize: 14, lineHeight: 1.75, background: c.codeBg, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden' }}>{analysisResult.fixedCode}</SyntaxHighlighter>
                    }
                  </div>
                )}

                {/* COMMENTED CODE — dedicated tab per PRD */}
                {activeTab === 'commented' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: tf, fontSize: 12, color: c.amber }}>{t.commentedLabel}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <UseCodeBtn c={c} onClick={() => { setCodeInput(formatCode(analysisResult.commentedCode || analysisResult.fixedCode, language)); setWasLoadedFromFix(true); showToast(locale === 'km' ? 'បានដាក់ក្នុង editor' : 'Loaded into editor'); }} />
                        <CopyBtn c={c} onClick={() => handleCopy(analysisResult.commentedCode || analysisResult.fixedCode, language)} />
                      </div>
                    </div>
                    {analysisResult.commentedCode
                      ? <SyntaxHighlighter language={langForHL} style={activeTheme} wrapLines={true} wrapLongLines={true} customStyle={{ margin: 0, borderRadius: 10, fontSize: 14, lineHeight: 1.75, background: c.codeBg, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden' }}>{analysisResult.commentedCode}</SyntaxHighlighter>
                      : <div style={{ padding: '1.5rem', background: c.bgSurface, borderRadius: 10, fontFamily: tf, fontSize: 13, color: c.text1, textAlign: 'center', lineHeight: 1.8 }}>{t.noCommented}<br /><span style={{ color: c.amber }}>{t.noCommentedHint}</span></div>}
                  </div>
                )}

                {/* EXPLANATION */}
                {activeTab === 'explain' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysisResult._locale && analysisResult._locale !== locale && (
                      <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: `1px solid ${c.amber}`, borderRadius: 8, fontFamily: tf, fontSize: 12, color: c.amber, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>⚠</span>
                        <span>{locale === 'km' ? 'ការពន្យល់នេះជាភាសាអង់គ្លេស — ចុច ↺ វិភាគម្តងទៀត ដើម្បីទទួលបានភាសាខ្មែរ' : 'This explanation is in Khmer — click ↺ Re-analyze to get it in English'}</span>
                      </div>
                    )}
                    {(() => {
                      const raw = analysisResult.explanation || '';
                      // Try to parse structured format
                      const lines = raw.split('\n').filter(l => l.trim());
                      const blocks = [];
                      let currentBlock = null;

                      lines.forEach(line => {
                        const t = line.trim();
                        if (t.startsWith('OVERVIEW:') || t.startsWith('ទិដ្ឋភាពទូទៅ:') || t.startsWith('ទិដ្ឋភាព:')) {
                          blocks.push({ type: 'overview', text: t.replace(/^[^:]+:\s*/, '') });
                        } else if (t.startsWith('REMEMBER:') || t.startsWith('ចងចាំ:') || t.startsWith('ចំណាំ:')) {
                          blocks.push({ type: 'remember', text: t.replace(/^[^:]+:\s*/, '') });
                        } else if (/^LINE\s+\d+/i.test(t) || /^បន្ទាត់\s+\d+/i.test(t)) {
                          currentBlock = { type: 'line', title: t, bullets: [] };
                          blocks.push(currentBlock);
                        } else if ((t.startsWith('•') || t.startsWith('-') || t.startsWith('·')) && currentBlock?.type === 'line') {
                          currentBlock.bullets.push(t.replace(/^[•\-·]\s*/, ''));
                        } else if (currentBlock?.type === 'line') {
                          currentBlock.bullets.push(t);
                        } else {
                          blocks.push({ type: 'text', text: t });
                        }
                      });

                      // If no structured format detected, fall back to plain text
                      if (blocks.filter(b => b.type === 'line').length === 0) {
                        return <p style={{ fontFamily: tf, fontSize: 15, color: c.text1, lineHeight: 1.9, margin: 0 }}>{raw}</p>;
                      }

                      return blocks.map((block, i) => {
                        if (block.type === 'overview') return (
                          <div key={i} style={{ padding: '10px 14px', background: c.bgSurface, borderRadius: 8, border: `1px solid ${c.borderSoft}`, borderLeft: `3px solid ${c.teal}` }}>
                            <span style={{ fontFamily: mono, fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Overview</span>
                            <p style={{ fontFamily: tf, fontSize: 14, color: c.text1, lineHeight: 1.7, margin: 0 }}>{block.text}</p>
                          </div>
                        );
                        if (block.type === 'remember') return (
                          <div key={i} style={{ padding: '10px 14px', background: isDark ? 'rgba(45,212,191,0.06)' : 'rgba(13,122,110,0.06)', borderRadius: 8, border: `1px solid ${c.tealDim}`, borderLeft: `3px solid ${c.teal}` }}>
                            <span style={{ fontFamily: mono, fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Remember</span>
                            <p style={{ fontFamily: tf, fontSize: 14, color: c.text1, lineHeight: 1.7, margin: 0 }}>{block.text}</p>
                          </div>
                        );
                        if (block.type === 'line') return (
                          <div key={i} style={{ padding: '12px 14px', background: c.redGlow, borderRadius: 8, borderLeft: `3px solid ${c.red}` }}>
                            <p style={{ fontFamily: mono, fontSize: 12, color: c.red, fontWeight: 600, margin: '0 0 8px' }}>{block.title}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {block.bullets.map((bullet, bi) => {
                                const isProb = bullet.toLowerCase().startsWith('problem:') || bullet.startsWith('បញ្ហា:') || bullet.startsWith('• Problem');
                                const isFix = bullet.toLowerCase().startsWith('fix:') || bullet.startsWith('ការជួសជុល:') || bullet.startsWith('• Fix');
                                const isImp = bullet.toLowerCase().startsWith('impact:') || bullet.startsWith('ផលប៉ះពាល់:') || bullet.startsWith('• Impact');
                                const dotColor = isProb ? c.red : isFix ? c.green : isImp ? c.amber : c.text3;
                                const label = bullet.replace(/^(Problem|Fix|Impact|បញ្ហា|ការជួសជុល|ផលប៉ះពាល់):\s*/i, '');
                                const prefix = isProb ? 'Problem' : isFix ? 'Fix' : isImp ? 'Impact' : null;
                                return (
                                  <div key={bi} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <span style={{ color: dotColor, fontFamily: mono, fontSize: 10, fontWeight: 600, flexShrink: 0, marginTop: 3, minWidth: prefix ? 52 : 12 }}>
                                      {prefix || '·'}
                                    </span>
                                    <span style={{ fontFamily: tf, fontSize: 14, color: c.text1, lineHeight: 1.65 }}>{prefix ? label : bullet}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                        return <p key={i} style={{ fontFamily: tf, fontSize: 14, color: c.text1, lineHeight: 1.7, margin: 0 }}>{block.text}</p>;
                      });
                    })()}
                  </div>
                )}

                {/* SUGGESTIONS */}
                {activeTab === 'suggest' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysisResult._locale && analysisResult._locale !== locale && (
                      <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: `1px solid ${c.amber}`, borderRadius: 8, fontFamily: tf, fontSize: 12, color: c.amber, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>⚠</span>
                        <span>{locale === 'km' ? 'ការណែនាំនេះជាភាសាអង់គ្លេស — ចុច ↺ វិភាគម្តងទៀត ដើម្បីទទួលបានភាសាខ្មែរ' : 'These suggestions are in Khmer — click ↺ Re-analyze to get them in English'}</span>
                      </div>
                    )}

                    {/* Clean suggestion cards — no links here */}
                    {analysisResult.improvementSuggestions?.map((s, i) => {
                      const tip = typeof s === 'string' ? s : s?.tip;
                      return (
                        <div key={i} style={{ padding: '12px 14px', background: c.bgSurface, borderRadius: 10, border: `1px solid ${c.borderSoft}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ minWidth: 24, height: 24, borderRadius: '50%', background: isDark ? 'rgba(167,139,250,0.1)' : 'rgba(124,58,237,0.08)', color: c.purple, fontSize: 10, fontWeight: 600, fontFamily: mono, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                          <span style={{ fontFamily: tf, fontSize: 14, color: c.text1, lineHeight: 1.65 }}>{tip}</span>
                        </div>
                      );
                    })}

                    {/* ── References section — below all suggestions ── */}
                    {(() => {
                      // YouTube queries from suggestions (what to learn to improve)
                      const ytItems = (analysisResult.improvementSuggestions || [])
                        .filter(s => typeof s === 'object' && s?.youtubeQuery)
                        .map(s => ({ query: s.youtubeQuery, tip: s.tip }));
                      // MDN queries from suggestions
                      const mdnLinks = (analysisResult.improvementSuggestions || [])
                        .filter(s => typeof s === 'object' && s?.mdnQuery)
                        .map(s => ({ label: s.mdnQuery, url: `https://developer.mozilla.org/search?q=${encodeURIComponent(s.mdnQuery)}` }));

                      if (ytItems.length === 0 && mdnLinks.length === 0) return null;

                      return (
                        <div style={{ marginTop: 4, borderTop: `1px solid ${c.borderSoft}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <span style={{ fontFamily: mono, fontSize: 10, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                            {locale === 'km' ? 'ឯកសារយោង' : 'References'}
                          </span>

                          {/* YouTube videos — one per suggestion */}
                          {ytItems.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <span style={{ fontFamily: mono, fontSize: 10, color: c.red, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill={c.red}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                {locale === 'km' ? 'វីដេអូណែនាំ' : 'Tutorial videos'}
                              </span>
                              {ytItems.map((item, i) => (
                                <YouTubeCard key={i} query={item.query} c={c} locale={locale} />
                              ))}
                            </div>
                          )}

                          {/* MDN links */}
                          {mdnLinks.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <span style={{ fontFamily: mono, fontSize: 10, color: c.blue }}>
                                📄 {locale === 'km' ? 'ឯកសារ MDN' : 'MDN Documentation'}
                              </span>
                              {mdnLinks.map((link, i) => (
                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 11, color: c.blue, textDecoration: 'none', padding: '5px 12px', borderRadius: 8, border: `1px solid ${isDark ? 'rgba(96,165,250,0.25)' : 'rgba(29,78,216,0.2)'}`, background: isDark ? 'rgba(96,165,250,0.06)' : 'rgba(29,78,216,0.05)', width: 'fit-content', transition: '0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(96,165,250,0.14)' : 'rgba(29,78,216,0.1)'}
                                  onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(96,165,250,0.06)' : 'rgba(29,78,216,0.05)'}>
                                  → {link.label}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Bottom actions */}
                <div data-tour="actions" style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${c.borderSoft}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={handleExport}
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
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 10, color: c.text2, padding: `0 ${isMobile ? '0.75rem' : '1.25rem'} 1rem`, flexWrap: 'wrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.green, display: 'inline-block' }} />
        {t.connected} &nbsp;·&nbsp; {LANGUAGES.find(l => l.value === language)?.label} &nbsp;·&nbsp; {t.modes[mode]}
      </div>


      {analysisResult && (
        <div id="hidden-pdf-document" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '794px', backgroundColor: '#ffffff', color: '#334155', padding: '40px 48px', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', letterSpacing: '-0.5px', margin: 0 }}>Fixplain Analysis Report</h1>
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
              <div>{new Date().toLocaleString()}</div>
              <div>Language: {LANGUAGES.find(l => l.value === language)?.label || language}</div>
            </div>
          </div>

          {/* Bugs Section */}
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginTop: '24px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bugs Found</h2>
          <div>
            {normalizeBugs(analysisResult.bugsFound).length === 0 ? (
              <p style={{ fontSize: '15px' }}>No bugs detected.</p>
            ) : normalizeBugs(analysisResult.bugsFound).map((b, i) => {
              const bg = b.severity === 'high' ? '#fef2f2' : b.severity === 'medium' ? '#fffbeb' : '#f0fdf4';
              const borderCol = b.severity === 'high' ? '#ef4444' : b.severity === 'medium' ? '#f59e0b' : '#3b82f6';
              return (
                <div key={i} style={{ backgroundColor: bg, borderLeft: `4px solid ${borderCol}`, borderTop: '1px solid #f8fafc', borderRight: '1px solid #f8fafc', borderBottom: '1px solid #f8fafc', borderRadius: '4px', padding: '12px 16px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px', lineHeight: '1.4', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ backgroundColor: borderCol, color: '#ffffff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{(b.severity || 'MEDIUM').toUpperCase()}</span>
                    {b.lineNumber && <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Line {b.lineNumber}</span>}
                  </div>
                  <div style={{ color: '#0f172a' }}>{b.issue}</div>
                </div>
              );
            })}
          </div>

          {/* Explanation Section */}
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginTop: '32px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explanation & Suggestions</h2>
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '6px', color: '#334155', border: '1px solid #e2e8f0', fontSize: '15px', lineHeight: '1.6', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
              {(() => {
                const expDetails = analysisResult.explanation || '';
                return typeof expDetails === 'string' ? expDetails : (expDetails[locale] || expDetails.en || '');
              })()}
            </div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {(analysisResult.improvementSuggestions || []).map((s, i) => {
                const tipData = typeof s === 'string' ? s : s?.tip;
                const tip = typeof tipData === 'string' ? tipData : (tipData?.[locale] || tipData?.en || '');
                return <li key={i} style={{ marginBottom: 8 }}>{tip}</li>;
              })}
            </ul>
          </div>

          {/* Fixed Code Section */}
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginTop: '32px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fixed Code</h2>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', overflow: 'hidden', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <SyntaxHighlighter language={langForHL} style={oneLight} wrapLines={true} wrapLongLines={true} customStyle={{ margin: 0, padding: '16px', fontSize: '13px', backgroundColor: 'transparent', lineHeight: '1.5' }}>
              {analysisResult.fixedCode || ''}
            </SyntaxHighlighter>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
            Generated automatically by Fixplain — fixplain.com
          </div>
        </div>
      )}
      <Toast message={toastMsg} visible={toastVisible} undoable={toastUndoable} c={c} />
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