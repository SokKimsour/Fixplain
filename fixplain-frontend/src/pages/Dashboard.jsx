import React, { useState, useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ── Components ───────────────────────────────────────────────────────────────
import AnimatedBackground from '../components/AnimatedBackground';
import OnboardingTour from '../components/OnboardingTour';
import HealthRing from '../components/HealthRing';
import LoadingSkeleton from '../components/LoadingSkeleton';
import DiffView from '../components/Diff/DiffView';
import LineNumberedEditor from '../components/Editor/LineNumberedEditor';
import Toast from '../components/UI/Toast';
import YouTubeCard from '../components/YouTubeCard';
import { Panel, PanelHeader, Dot } from '../components/UI/Panel';
import { SeverityBadge } from '../components/UI/SeverityBadge';
import { CopyBtn, UseCodeBtn } from '../components/UI/Buttons';
import PlaygroundView from '../components/PlaygroundView';

// ── Constants ────────────────────────────────────────────────────────────────
import { LANGUAGES, MODES, TAB_KEYS } from '../constants/languages';
import { darkTheme, lightTheme, THEMES, mono, sans, khmer } from '../constants/themes';
import { i18n } from '../constants/i18n';

// ── Utilities ────────────────────────────────────────────────────────────────
import { normalizeBugs, computeHealthScore, formatCode, healthColor } from '../utils/helpers';
import { encodeShare, decodeShare } from '../utils/share';

const CHAR_LIMIT = 12000;
const CHAR_WARN = 9000;

export default function Dashboard() {
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
  const tabAccent = { bugs: c.red, fixed: c.green, commented: c.amber, explain: c.blue, suggest: c.purple, playground: c.teal };
  const langForHL = {
    nodejs: 'javascript',
    csharp: 'csharp',
    sql: 'sql',
    python: 'python',
    typescript: 'typescript',
    java: 'java',
    php: 'php',
    ruby: 'ruby',
    go: 'go',
    rust: 'rust',
    swift: 'swift'
  }[language] || 'javascript';
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
  useEffect(() => {
    const fn = () => setScreenW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Load history + check for shared result in URL hash
  useEffect(() => {
    // Wake up Render immediately on page load
    fetch('https://ffxplain-api.onrender.com/api/ping').catch(() => { });

    try {
      const saved = localStorage.getItem('fixplain_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      localStorage.removeItem('fixplain_history');
    }

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

    if (!localStorage.getItem('fp_tour_done')) {
      setShowTour(true);
      localStorage.setItem('fp_tour_done', '1');
    }
  }, []);

  const showToast = msg => {
    setToastMsg(msg);
    setToastVisible(true);
    setToastUndoable(false);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const showUndoToast = (msg, undoFn) => {
    setToastMsg(msg);
    setToastVisible(true);
    setToastUndoable(true);
    const timer = setTimeout(() => {
      setToastVisible(false);
      setToastUndoable(false);
    }, 4000);
    window._fpUndo = () => {
      clearTimeout(timer);
      undoFn();
      setToastVisible(false);
      setToastUndoable(false);
    };
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

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('fixplain_history');
  };

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

  const handleDragOver = e => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const EXT_MAP = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      cs: 'csharp',
      sql: 'sql',
      java: 'java',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      swift: 'swift',
      cpp: 'cpp',
      kt: 'kotlin',
      sh: 'bash'
    };
    if (EXT_MAP[ext]) setLanguage(EXT_MAP[ext]);
    const reader = new FileReader();
    reader.onload = ev => {
      setCodeInput(ev.target.result);
    };
    reader.readAsText(file);
  };

  const switchTab = key => {
    setActiveTab(key);
    setTabKey(k => k + 1);
    setFixedView('code');
  };

  const loadExample = ex => {
    setCodeInput(ex.code);
    setLanguage(ex.lang);
    setAnalysisResult(null);
    setError(null);
  };

  // Auto-detect language from code content
  const detectLanguage = code => {
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
    for (const { lang, patterns } of LANG_HINTS) {
      if (patterns.some(p => p.test(code))) return lang;
    }
    return null;
  };

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setIsWarmingUp(false);
    setError(null);
    setAnalysisResult(null);
    setHighlightLine(null);
    setOriginalCode(codeInput);
    switchTab('bugs');
    const wasFixed = wasLoadedFromFix;
    setWasLoadedFromFix(false);

    // Auto-detect language if user forgot to pick
    const detectedLang = detectLanguage(codeInput);
    if (detectedLang && detectedLang !== language) {
      setLanguage(detectedLang);
    }
    const effectiveLang = detectedLang || language;

    // Input validation
    const looksLikeCode = /[{};()\[\]=><]/.test(codeInput) || codeInput.split('\n').length > 2;
    if (!looksLikeCode) {
      setError(locale === 'km' ? 'សូមបញ្ចូលកូដ មិនមែនអក្សរធម្មតា។' : 'Please paste code, not plain text.');
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
          previousBugs: analysisResult ? normalizeBugs(analysisResult.bugsFound).map(b => b.issue_en || b.issue) : [],
          wasAlreadyFixed: wasFixed,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      data._locale = locale;
      setAnalysisResult(data);

      if (!normalizeBugs(data.bugsFound).length || mode === 'refactor') {
        switchTab('fixed');
      }

      const entry = { ...data, _meta: { language: effectiveLang, mode, locale, time: Date.now(), codeInput } };
      const updated = [entry, ...history].slice(0, 5);
      setHistory(updated);
      localStorage.setItem('fixplain_history', JSON.stringify(updated));
      setCooldown(3);
    } catch {
      setError(t.errorMsg);
      setCooldown(0);
    } finally {
      clearTimeout(warmupTimer);
      setIsLoading(false);
      setIsWarmingUp(false);
    }
  }, [codeInput, language, mode, history, t, analysisResult, wasLoadedFromFix]);

  // Keyboard shortcut
  useEffect(() => {
    const fn = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading && codeInput.trim() && cooldown === 0) {
          handleAnalyze();
        }
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isLoading, codeInput, cooldown, handleAnalyze]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);



  // Keyboard tab navigation
  useEffect(() => {
    const fn = e => {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') {
        const i = TAB_KEYS.indexOf(activeTab);
        if (i < TAB_KEYS.length - 1) switchTab(TAB_KEYS[i + 1]);
      }
      if (e.key === 'ArrowLeft') {
        const i = TAB_KEYS.indexOf(activeTab);
        if (i > 0) switchTab(TAB_KEYS[i - 1]);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [activeTab]);

  // Progress step cycling
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

  const handleFixAll = () => {
    if (!analysisResult?.fixedCode) return;
    setFixingAll(true);
    setTimeout(() => {
      const prev = codeInput;
      setCodeInput(formatCode(analysisResult.fixedCode, language));
      setWasLoadedFromFix(true);
      showUndoToast(locale === 'km' ? 'បានជួសជុលទាំងអស់ ✓ · ប្តូរត្រឡប់?' : 'All bugs fixed ✓ · Undo?', () => {
        setCodeInput(prev);
        setWasLoadedFromFix(false);
      });
      setFixingAll(false);
    }, 400);
  };

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

  const lineCount = codeInput.split('\n').length;
  const charCount = codeInput.length;
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
          {!isMobile && (
            <span style={{ fontSize: 12, fontFamily: mono, color: c.text3, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <kbd style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 12, color: c.text3 }}>
                {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <kbd style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 4, padding: '1px 5px', fontSize: 12, color: c.text3 }}>Enter</kbd>
              <span>{t.toAnalyze}</span>
            </span>
          )}
          <button
            onClick={() => setLocale(l => l === 'en' ? 'km' : 'en')}
            style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 10px', cursor: 'pointer', fontFamily: locale === 'km' ? mono : khmer, fontSize: 13, color: c.text2, transition: '0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = c.tealDim}
            onMouseLeave={e => e.currentTarget.style.borderColor = c.border}
          >
            {t.langToggle}
          </button>
          {!isMobile && Object.keys(allThemes).length > 1 && (
            <select
              value={codeThemeName}
              onChange={e => setCodeThemeName(e.target.value)}
              style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text2, fontFamily: mono, fontSize: 12, padding: '5px 6px', cursor: 'pointer', outline: 'none' }}
            >
              {Object.keys(allThemes).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          )}
          <button
            onClick={() => setIsDark(p => !p)}
            style={{ background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: mono, fontSize: 13, color: c.text2, transition: '0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = c.tealDim}
            onMouseLeave={e => e.currentTarget.style.borderColor = c.border}
          >
            <span style={{ fontSize: 15 }}>{isDark ? '☀' : '☾'}</span>
            {!isMobile && (isDark ? t.light : t.dark)}
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: isMobile ? '1.5rem 1rem 0.5rem' : '2rem 1.25rem 0.75rem' }}>
        <h1 style={{ fontSize: isMobile ? 'clamp(20px,6vw,28px)' : 'clamp(26px,4vw,38px)', fontWeight: 600, letterSpacing: locale === 'km' ? 0 : '-1px', lineHeight: 1.3, margin: 0, fontFamily: tf }}>
          {locale === 'km' ? t.tagline : <>Fix it. <span style={{ color: c.teal }}>Explain it.</span> Learn from it.</>}
        </h1>
        {/* Powered by Gemini */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 24, color: c.text3 }}>{locale === 'km' ? 'ដំណើរការដោយ' : 'Powered by'}</span>
          <span style={{ fontFamily: mono, fontSize: 24, color: c.teal, fontWeight: 600 }}>Gemini</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap', padding: '0 1rem' }}>
          <span style={{ fontFamily: mono, fontSize: 12, color: c.text3 }}>{t.tryExample}:</span>
          {t.examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => loadExample(ex)}
              style={{ fontFamily: mono, fontSize: 12, padding: '4px 10px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.15s' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = c.tealDim;
                e.currentTarget.style.color = c.teal;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = c.border;
                e.currentTarget.style.color = c.text2;
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <main style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '100vw', overflowX: 'hidden', padding: isMobile ? '0.75rem 0.75rem 2rem' : '1.25rem 1.25rem 2rem', display: 'grid', gridTemplateColumns: isMobile || isTablet ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)', gap: '1rem', flex: 1 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: 0, width: '100%' }}>
          <Panel
            c={c}
            data-tour="editor"
            style={{ flex: isMobile || isTablet ? 'none' : '1', minHeight: isMobile ? 280 : 380, height: isMobile || isTablet ? 320 : undefined, width: '100%', minWidth: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Top row: dots + clear */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface }}>
              <span style={{ fontFamily: mono, fontSize: 13, color: c.text3, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Dot color={c.amber} /><Dot color={c.green} /><Dot color={c.red} />
                {!isMobile && (
                  <>&nbsp; input.{({ python: 'py', sql: 'sql', csharp: 'cs', java: 'java', php: 'php', typescript: 'ts' })[language] || 'js'}</>
                )}
              </span>
              <button
                onClick={() => {
                  if (!codeInput.trim()) return;
                  const prev = codeInput;
                  setCodeInput('');
                  showUndoToast(locale === 'km' ? 'បានលុបកូដ · ប្តូរត្រឡប់?' : 'Code cleared · Undo?', () => setCodeInput(prev));
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text3, fontSize: 13, fontFamily: mono, padding: '2px 6px', borderRadius: 5, flexShrink: 0 }}
                onMouseEnter={e => e.target.style.color = c.text1}
                onMouseLeave={e => e.target.style.color = c.text3}
              >
                {t.clearBtn}
              </button>
            </div>
            {/* Language selector row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface }}>
              <span style={{ fontFamily: mono, fontSize: 12, color: c.text3, flexShrink: 0 }}>
                {locale === 'km' ? 'ភាសា:' : 'Language:'}
              </span>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                style={{ width: '120px', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: c.bgPanel, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text1, fontFamily: mono, fontSize: 14, padding: '5px 8px', cursor: 'pointer', outline: 'none', transition: '0.15s' }}
                onFocus={e => e.currentTarget.style.borderColor = c.tealDim}
                onBlur={e => e.currentTarget.style.borderColor = c.border}
              >
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <span style={{ fontFamily: mono, fontSize: 11, color: c.teal, background: c.tealGlow, padding: '2px 7px', borderRadius: 20, flexShrink: 0, opacity: 0.85 }}>
                {locale === 'km' ? 'ស្វ័យប្រវត្តិ' : 'auto'}
              </span>
            </div>
            {/* Mode buttons row */}
            <div data-tour="modes" style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${c.borderSoft}`, background: c.bgSurface }}>
              <div style={{ display: 'flex', gap: 6, padding: '8px 12px', flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {MODES.map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{ fontFamily: tf, fontSize: 13, padding: '5px 14px', borderRadius: 20, border: `1px solid ${mode === m ? c.tealDim : c.border}`, background: mode === m ? c.tealGlow : 'transparent', color: mode === m ? c.teal : c.text2, cursor: 'pointer', transition: '0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}
                    onMouseEnter={e => { if (mode !== m) { e.currentTarget.style.borderColor = c.tealDim; e.currentTarget.style.color = c.teal; } }}
                    onMouseLeave={e => { if (mode !== m) { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2; } }}
                  >
                    {t.modes[m]}
                  </button>
                ))}
              </div>
              <div style={{ padding: '0 12px 7px', fontFamily: tf, fontSize: 13, color: c.text3, lineHeight: 1.5 }}>
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
            {/* Line/char count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px', background: charCount >= CHAR_WARN ? (charCount >= CHAR_LIMIT ? c.redGlow : 'rgba(245,158,11,0.08)') : c.bgSurface, borderTop: `1px solid ${charCount >= CHAR_WARN ? (charCount >= CHAR_LIMIT ? c.red : c.amber) : c.borderSoft}`, transition: 'background 0.2s, border-color 0.2s' }}>
              {charCount >= CHAR_WARN ? (
                <span style={{ fontFamily: mono, fontSize: 12, color: charCount >= CHAR_LIMIT ? c.red : c.amber }}>
                  {charCount >= CHAR_LIMIT ? '✗ Exceeds 12,000 char limit' : `⚠ Approaching limit (${CHAR_LIMIT - charCount} left)`}
                </span>
              ) : <span />}
              <span style={{ fontFamily: mono, fontSize: 12, color: charCount >= CHAR_WARN ? (charCount >= CHAR_LIMIT ? c.red : c.amber) : c.text3 }}>
                {lineCount} {t.lines} · {charCount} {t.chars}
              </span>
            </div>
          </Panel>

          <button
            data-tour="analyze"
            onClick={handleAnalyze}
            disabled={isLoading || !codeInput.trim() || cooldown > 0}
            style={{ fontFamily: tf, fontSize: isMobile ? 13 : 15, fontWeight: 600, padding: '14px 0', borderRadius: 30, border: `1.5px solid ${isDark ? '#4338ca' : c.tealDim}`, background: isLoading ? 'transparent' : (isDark ? '#4f46e5' : c.tealGlow), color: isDark ? '#ffffff' : c.teal, cursor: (isLoading || !codeInput.trim() || cooldown > 0) ? 'not-allowed' : 'pointer', letterSpacing: '0.4px', transition: 'all 0.2s', opacity: (!codeInput.trim() && !isLoading) ? 0.4 : 1, width: '100%', animation: isLoading ? 'fpShimmer 1.5s ease-in-out infinite' : 'none' }}
          >
            {isLoading
              ? (isWarmingUp ? t.warmingUp : t.analyzingBtn)
              : cooldown > 0 ? `${t.readyIn} ${cooldown}s`
                : analysisResult ? t.reanalyzeBtn
                  : t.analyzeBtn}
          </button>

          {/* Health score */}
          {isLoading && originalCode.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: c.bgSurface, borderRadius: 12, border: `1px solid ${c.borderSoft}` }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c.teal, display: 'inline-block', animation: `fpShimmer 1.2s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
              <span style={{ fontFamily: mono, fontSize: 13, color: c.teal }}>
                {locale === 'km' ? 'កំពុងគណនា...' : 'Calculating...'}
              </span>
            </div>
          )}
          {!isLoading && healthScore !== null && (
            <HealthRing score={healthScore} c={c} label={t.codeHealth} isMobile={isMobile} bugs={bugs} t={t} />
          )}

          {/* History */}
          {history.length > 0 && (
            <Panel c={c}>
              <PanelHeader c={c}>
                <span style={{ fontFamily: tf, fontSize: 13, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{t.history}</span>
                <button
                  onClick={() => {
                    if (!clearConfirm) {
                      setClearConfirm(true);
                      setTimeout(() => setClearConfirm(false), 2500);
                    } else {
                      clearHistory();
                      setClearConfirm(false);
                    }
                  }}
                  style={{ background: 'none', border: clearConfirm ? `1px solid ${c.red}` : 'none', borderRadius: 20, padding: clearConfirm ? '2px 8px' : '0', cursor: 'pointer', color: c.red, fontFamily: tf, fontSize: 12, textTransform: 'uppercase', transition: '0.2s' }}
                >
                  {clearConfirm ? (locale === 'km' ? 'ប្រាកដ?' : 'confirm?') : t.clearAll}
                </button>
              </PanelHeader>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((item, idx) => {
                  const meta = item._meta || {};
                  const firstBug = item.bugsFound?.[0];
                  const bugLabel = typeof firstBug === 'string' ? firstBug : firstBug?.issue;
                  const score = computeHealthScore(normalizeBugs(item.bugsFound));
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        const item2 = { ...item };
                        if (item._meta?.locale) item2._locale = item._meta.locale;
                        setAnalysisResult(item2);
                        if (item._meta?.codeInput) setCodeInput(item._meta.codeInput);
                        switchTab('bugs');
                      }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text2, fontFamily: mono, fontSize: 14, cursor: 'pointer', transition: '0.15s' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = c.tealDim;
                        e.currentTarget.style.color = c.teal;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = c.border;
                        e.currentTarget.style.color = c.text2;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                        {meta.language && (
                          <span style={{ fontFamily: mono, fontSize: 11, padding: '1px 6px', borderRadius: 10, background: c.tealGlow, color: c.teal }}>
                            {LANGUAGES.find(l => l.value === meta.language)?.label}
                          </span>
                        )}
                        {meta.mode && (
                          <span style={{ fontFamily: mono, fontSize: 11, padding: '1px 6px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', color: c.purple }}>
                            {meta.mode}
                          </span>
                        )}
                        {meta.locale === 'km' && (
                          <span style={{ fontFamily: mono, fontSize: 11, padding: '1px 6px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: c.amber }}>
                            ខ្មែរ
                          </span>
                        )}
                        <span style={{ fontFamily: mono, fontSize: 11, color: healthColor(score, c), marginLeft: 'auto' }}>
                          {score}/100
                        </span>
                        {meta.time && (
                          <span style={{ fontFamily: mono, fontSize: 11, color: c.text3 }}>
                            {(() => {
                              const d = new Date(meta.time), now = new Date();
                              const today = now.toDateString(), yesterday = new Date(now - 86400000).toDateString();
                              const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              if (d.toDateString() === today) return `Today ${time}`;
                              if (d.toDateString() === yesterday) return `Yesterday ${time}`;
                              return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
                            })()}
                          </span>
                        )}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ◈ {bugLabel || t.historyEmpty}
                      </div>
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
                <button
                  key={key}
                  onClick={() => switchTab(key)}
                  style={{ fontFamily: tf, fontSize: isMobile ? 11 : 13, padding: isMobile ? '8px 8px' : '10px 13px', border: 'none', background: 'none', color: isActive ? accent : c.text3, borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = c.text1; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = c.text3; }}
                >
                  {isMobile ? t.tabs[key].split(' ')[0] : t.tabs[key]}
                  {bugCount > 0 && (
                    <span style={{ background: c.red, color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 5px', borderRadius: 20, lineHeight: 1.4 }}>
                      {bugCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {error && (
              <div style={{ margin: '1rem', padding: '12px 16px', background: c.redGlow, border: `1px solid ${c.red}`, borderLeft: `3px solid ${c.red}`, borderRadius: 10, color: c.red, fontFamily: tf, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span>{error}</span>
                <button
                  onClick={handleAnalyze}
                  disabled={!codeInput.trim()}
                  style={{ fontFamily: tf, fontSize: 14, padding: '5px 14px', borderRadius: 20, border: `1px solid ${c.red}`, background: c.redGlow, color: c.red, cursor: 'pointer', flexShrink: 0, transition: '0.15s' }}
                >
                  {locale === 'km' ? '↺ ព្យាយាមម្តងទៀត' : '↺ Try again'}
                </button>
              </div>
            )}
            {isLoading && (
              <LoadingSkeleton c={c} progressStep={isWarmingUp ? t.warmingUp : t.progressSteps[progressStep]} />
            )}
            {!analysisResult && !isLoading && !error && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: '2.5rem 2rem' }}>
                <span style={{ fontSize: 30, opacity: 0.15 }}>◈</span>
                <p style={{ fontFamily: tf, fontSize: 15, color: c.text2, margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
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
                      <span style={{ color, fontSize: 16, flexShrink: 0, width: 16, textAlign: 'center' }}>{icon}</span>
                      <span style={{ fontFamily: tf, fontSize: 14, color: c.text2, lineHeight: 1.4 }}>{text}</span>
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
                        <span style={{ fontSize: 30 }}>✓</span>
                        <span style={{ fontFamily: tf, fontSize: 16 }}>{t.noBugs}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={handleFixAll}
                            disabled={fixingAll}
                            style={{ fontFamily: tf, fontSize: 12, padding: '5px 14px', borderRadius: 20, border: `1px solid ${c.green}`, background: 'rgba(74,222,128,0.08)', color: c.green, cursor: fixingAll ? 'wait' : 'pointer', transition: '0.15s' }}
                          >
                            {fixingAll ? t.fixingAll : t.fixAll}
                          </button>
                        </div>
                        {bugs.map((b, i) => (
                          <div key={i} style={{ padding: '10px 14px', background: c.redGlow, borderLeft: `2px solid ${c.red}`, borderRadius: '0 8px 8px 0' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                              <span style={{ color: c.red, marginTop: 1, flexShrink: 0 }}>✗</span>
                              <span style={{ fontFamily: tf, fontSize: 16, color: c.text1, lineHeight: 1.65, flex: 1 }}>{locale === 'km' ? (b.issue_km || b.issue) : (b.issue_en || b.issue)}</span>
                              <SeverityBadge severity={b.severity} isDark={isDark} label={t.severity[b.severity] || b.severity} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {b.lineNumber && (
                                <button
                                  onClick={() => setHighlightLine(l => l === b.lineNumber ? null : b.lineNumber)}
                                  style={{ fontFamily: mono, fontSize: 11, padding: '2px 8px', borderRadius: 10, border: `1px solid ${c.border}`, background: highlightLine === b.lineNumber ? c.tealGlow : 'transparent', color: highlightLine === b.lineNumber ? c.teal : c.text3, cursor: 'pointer', transition: '0.15s' }}
                                >
                                  {t.lineLabel} {b.lineNumber}
                                </button>
                              )}
                              {b.confidence != null && (
                                <span style={{ fontFamily: mono, fontSize: 11, color: b.confidence >= 90 ? c.green : b.confidence >= 70 ? c.amber : c.text3 }}>
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

                {/* FIXED CODE */}
                {activeTab === 'fixed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[
                          { key: 'code', label: t.codeView },
                          { key: 'diff', label: t.diffView },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setFixedView(key)}
                            style={{ fontFamily: mono, fontSize: 13, padding: '4px 10px', borderRadius: 20, border: `1px solid ${fixedView === key ? c.tealDim : c.border}`, background: fixedView === key ? c.tealGlow : 'transparent', color: fixedView === key ? c.teal : c.text1, cursor: 'pointer', transition: '0.15s' }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <UseCodeBtn
                          c={c}
                          onClick={() => {
                            setCodeInput(formatCode(analysisResult.fixedCode, language));
                            setWasLoadedFromFix(true);
                            showToast(locale === 'km' ? 'បានដាក់ក្នុង editor' : 'Loaded into editor');
                          }}
                        />
                        <CopyBtn c={c} onClick={() => handleCopy(analysisResult.fixedCode, language)} />
                      </div>
                    </div>
                    {fixedView === 'diff' ? (
                      <DiffView original={originalCode} fixed={analysisResult.fixedCode} c={c} screenW={screenW} isDark={isDark} t={t} />
                    ) : (
                      <SyntaxHighlighter
                        language={langForHL}
                        style={activeTheme}
                        wrapLines={true}
                        wrapLongLines={true}
                        customStyle={{ margin: 0, borderRadius: 10, fontSize: 16, lineHeight: 1.75, background: c.codeBg, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden' }}
                      >
                        {analysisResult.fixedCode}
                      </SyntaxHighlighter>
                    )}
                  </div>
                )}

                {/* COMMENTED CODE */}
                {activeTab === 'commented' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: tf, fontSize: 14, color: c.amber }}>{t.commentedLabel}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <UseCodeBtn
                          c={c}
                          onClick={() => {
                            setCodeInput(formatCode(analysisResult.commentedCode || analysisResult.fixedCode, language));
                            setWasLoadedFromFix(true);
                            showToast(locale === 'km' ? 'បានដាក់ក្នុង editor' : 'Loaded into editor');
                          }}
                        />
                        <CopyBtn c={c} onClick={() => handleCopy(analysisResult.commentedCode || analysisResult.fixedCode, language)} />
                      </div>
                    </div>
                    {analysisResult.commentedCode ? (
                      <SyntaxHighlighter
                        language={langForHL}
                        style={activeTheme}
                        wrapLines={true}
                        wrapLongLines={true}
                        customStyle={{ margin: 0, borderRadius: 10, fontSize: 16, lineHeight: 1.75, background: c.codeBg, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'hidden' }}
                      >
                        {analysisResult.commentedCode}
                      </SyntaxHighlighter>
                    ) : (
                      <div style={{ padding: '1.5rem', background: c.bgSurface, borderRadius: 10, fontFamily: tf, fontSize: 15, color: c.text1, textAlign: 'center', lineHeight: 1.8 }}>
                        {t.noCommented}
                        <br />
                        <span style={{ color: c.amber }}>{t.noCommentedHint}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* EXPLANATION */}
                {activeTab === 'explain' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(() => {
                      const raw = (locale === 'km' ? analysisResult.explanation_km : analysisResult.explanation_en) || analysisResult.explanation || '';
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

                      if (blocks.filter(b => b.type === 'line').length === 0) {
                        return <p style={{ fontFamily: tf, fontSize: 17, color: c.text1, lineHeight: 1.9, margin: 0 }}>{raw}</p>;
                      }

                      return blocks.map((block, i) => {
                        if (block.type === 'overview') return (
                          <div key={i} style={{ padding: '10px 14px', background: c.bgSurface, borderRadius: 8, border: `1px solid ${c.borderSoft}`, borderLeft: `3px solid ${c.teal}` }}>
                            <span style={{ fontFamily: mono, fontSize: 12, color: c.teal, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Overview</span>
                            <p style={{ fontFamily: tf, fontSize: 16, color: c.text1, lineHeight: 1.7, margin: 0 }}>{block.text}</p>
                          </div>
                        );
                        if (block.type === 'remember') return (
                          <div key={i} style={{ padding: '10px 14px', background: isDark ? 'rgba(45,212,191,0.06)' : 'rgba(13,122,110,0.06)', borderRadius: 8, border: `1px solid ${c.tealDim}`, borderLeft: `3px solid ${c.teal}` }}>
                            <span style={{ fontFamily: mono, fontSize: 12, color: c.teal, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Remember</span>
                            <p style={{ fontFamily: tf, fontSize: 16, color: c.text1, lineHeight: 1.7, margin: 0 }}>{block.text}</p>
                          </div>
                        );
                        if (block.type === 'line') return (
                          <div key={i} style={{ padding: '12px 14px', background: c.redGlow, borderRadius: 8, borderLeft: `3px solid ${c.red}` }}>
                            <p style={{ fontFamily: mono, fontSize: 14, color: c.red, fontWeight: 600, margin: '0 0 8px' }}>{block.title}</p>
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
                                    <span style={{ color: dotColor, fontFamily: mono, fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 3, minWidth: prefix ? 52 : 12 }}>
                                      {prefix || '·'}
                                    </span>
                                    <span style={{ fontFamily: tf, fontSize: 16, color: c.text1, lineHeight: 1.65 }}>{prefix ? label : bullet}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                        return <p key={i} style={{ fontFamily: tf, fontSize: 16, color: c.text1, lineHeight: 1.7, margin: 0 }}>{block.text}</p>;
                      });
                    })()}
                  </div>
                )}

                {/* SUGGESTIONS */}
                {activeTab === 'suggest' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {analysisResult.improvementSuggestions?.map((s, i) => {
                      const tip = typeof s === 'string' ? s : (locale === 'km' ? s?.tip_km : s?.tip_en) || s?.tip;
                      return (
                        <div key={i} style={{ padding: '12px 14px', background: c.bgSurface, borderRadius: 10, border: `1px solid ${c.borderSoft}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ minWidth: 24, height: 24, borderRadius: '50%', background: isDark ? 'rgba(167,139,250,0.1)' : 'rgba(124,58,237,0.08)', color: c.purple, fontSize: 12, fontWeight: 600, fontFamily: mono, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontFamily: tf, fontSize: 16, color: c.text1, lineHeight: 1.65 }}>{tip}</span>
                        </div>
                      );
                    })}

                    {(() => {
                      const ytItems = (analysisResult.improvementSuggestions || [])
                        .filter(s => typeof s === 'object' && s?.youtubeQuery)
                        .map(s => ({ query: s.youtubeQuery, tip: (locale === 'km' ? s.tip_km : s.tip_en) || s.tip }));
                      const mdnLinks = (analysisResult.improvementSuggestions || [])
                        .filter(s => typeof s === 'object' && s?.mdnQuery)
                        .map(s => ({ label: s.mdnQuery, url: `https://developer.mozilla.org/search?q=${encodeURIComponent(s.mdnQuery)}` }));

                      if (ytItems.length === 0 && mdnLinks.length === 0) return null;

                      return (
                        <div style={{ marginTop: 4, borderTop: `1px solid ${c.borderSoft}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <span style={{ fontFamily: mono, fontSize: 12, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                            {locale === 'km' ? 'ឯកសារយោង' : 'References'}
                          </span>

                          {ytItems.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <span style={{ fontFamily: mono, fontSize: 12, color: c.red, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill={c.red}>
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                                {locale === 'km' ? 'វីដេអូណែនាំ' : 'Tutorial videos'}
                              </span>
                              {ytItems.map((item, i) => (
                                <YouTubeCard key={i} query={item.query} c={c} locale={locale} />
                              ))}
                            </div>
                          )}

                          {mdnLinks.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <span style={{ fontFamily: mono, fontSize: 12, color: c.blue }}>
                                📄 {locale === 'km' ? 'ឯកសារ MDN' : 'MDN Documentation'}
                              </span>
                              {mdnLinks.map((link, i) => (
                                <a
                                  key={i}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 13, color: c.blue, textDecoration: 'none', padding: '5px 12px', borderRadius: 8, border: `1px solid ${isDark ? 'rgba(96,165,250,0.25)' : 'rgba(29,78,216,0.2)'}`, background: isDark ? 'rgba(96,165,250,0.06)' : 'rgba(29,78,216,0.05)', width: 'fit-content', transition: '0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(96,165,250,0.14)' : 'rgba(29,78,216,0.1)'}
                                  onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(96,165,250,0.06)' : 'rgba(29,78,216,0.05)'}
                                >
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

                {/* PLAYGROUND */}
                {activeTab === 'playground' && (
                  <PlaygroundView code={analysisResult.fixedCode || codeInput} language={language} c={c} tf={tf} mono={mono} />
                )}

                {/* Bottom actions */}
                <div data-tour="actions" style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${c.borderSoft}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleExport}
                    style={{ fontFamily: tf, fontSize: 13, padding: '7px 16px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.2s' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = c.red;
                      e.currentTarget.style.color = c.red;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.color = c.text2;
                    }}
                  >
                    ↓ {t.exportPDF}
                  </button>
                  <button
                    onClick={handleShare}
                    style={{ fontFamily: tf, fontSize: 13, padding: '7px 16px', borderRadius: 20, border: `1px solid ${c.border}`, background: 'transparent', color: c.text2, cursor: 'pointer', transition: '0.2s' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = c.blue;
                      e.currentTarget.style.color = c.blue;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.color = c.text2;
                    }}
                  >
                    ↗ {t.shareBtn}
                  </button>
                </div>

              </div>
            )}
          </div>
        </Panel>
      </main>

      {/* Status */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 12, color: c.text2, padding: `0 ${isMobile ? '0.75rem' : '1.25rem'} 1rem`, flexWrap: 'wrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.green, display: 'inline-block' }} />
        {t.connected} &nbsp;·&nbsp; {LANGUAGES.find(l => l.value === language)?.label} &nbsp;·&nbsp; {t.modes[mode]}
      </div>

      {analysisResult && (
        <div id="hidden-pdf-document" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '794px', backgroundColor: '#ffffff', color: '#334155', padding: '40px 48px', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', letterSpacing: '-0.5px', margin: 0 }}>Fixplain Analysis Report</h1>
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
              <div>{new Date().toLocaleString()}</div>
              <div>Language: {LANGUAGES.find(l => l.value === language)?.label || language}</div>
            </div>
          </div>

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
                  <div style={{ color: '#0f172a' }}>{locale === 'km' ? (b.issue_km || b.issue) : (b.issue_en || b.issue)}</div>
                </div>
              );
            })}
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginTop: '32px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explanation & Suggestions</h2>
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '6px', color: '#334155', border: '1px solid #e2e8f0', fontSize: '15px', lineHeight: '1.6', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
              {(() => {
                const expDetails = (locale === 'km' ? analysisResult.explanation_km : analysisResult.explanation_en) || analysisResult.explanation || '';
                return expDetails;
              })()}
            </div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {(analysisResult.improvementSuggestions || []).map((s, i) => {
                const tip = typeof s === 'string' ? s : (locale === 'km' ? s?.tip_km : s?.tip_en) || s?.tip;
                return <li key={i} style={{ marginBottom: 8 }}>{tip}</li>;
              })}
            </ul>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginTop: '32px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fixed Code</h2>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', overflow: 'hidden', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <SyntaxHighlighter language={langForHL} style={oneLight} wrapLines={true} wrapLongLines={true} customStyle={{ margin: 0, padding: '16px', fontSize: '13px', backgroundColor: 'transparent', lineHeight: '1.5' }}>
              {analysisResult.fixedCode || ''}
            </SyntaxHighlighter>
          </div>

          <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
            Generated automatically by Fixplain — fixplain.com
          </div>
        </div>
      )}
      <Toast message={toastMsg} visible={toastVisible} undoable={toastUndoable} c={c} />
    </div>
  );
}
