import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect } from 'react';

// ── Design tokens ────────────────────────────────────────────────────────────
const t = {
  bgBase: '#0d0f12',
  bgPanel: '#13161b',
  bgSurface: '#1a1e26',
  bgHover: '#21262f',
  border: '#2a2f3d',
  borderSoft: '#1e2330',
  teal: '#2dd4bf',
  tealDim: '#1a8a7c',
  tealGlow: 'rgba(45,212,191,0.12)',
  red: '#f87171',
  redGlow: 'rgba(248,113,113,0.08)',
  green: '#4ade80',
  amber: '#f59e0b',
  blue: '#60a5fa',
  purple: '#a78bfa',
  text1: '#e8eaf0',
  text2: '#8b92a8',
  text3: '#555e78',
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "'Sora', 'Inter', sans-serif",
};

// ── Reusable styled primitives ───────────────────────────────────────────────
const Panel = ({ children, style = {} }) => (
  <div style={{
    background: t.bgPanel,
    border: `1px solid ${t.borderSoft}`,
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...style,
  }}>
    {children}
  </div>
);

const PanelHeader = ({ children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: `1px solid ${t.borderSoft}`,
    background: t.bgSurface,
  }}>
    {children}
  </div>
);

const PanelLabel = ({ children }) => (
  <span style={{
    fontFamily: t.mono, fontSize: 11, color: t.text3,
    letterSpacing: '0.6px', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: 6,
  }}>
    {children}
  </span>
);

const Dot = ({ color }) => (
  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
);

const SectionCard = ({ accentColor, children }) => (
  <div style={{
    background: t.bgPanel,
    border: `1px solid ${t.borderSoft}`,
    borderLeft: `2px solid ${accentColor}`,
    borderRadius: 12,
    overflow: 'hidden',
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <p style={{
    fontFamily: t.mono, fontSize: 11, fontWeight: 600,
    color: t.text3, letterSpacing: '0.7px',
    textTransform: 'uppercase', margin: 0,
  }}>
    {children}
  </p>
);

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [codeInput, setCodeInput] = useState('// Paste your code here...\nfunction example() {\n  let x = 10\n  console.log(x)\n}');
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('fixplain_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('fixplain_history');
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const response = await fetch('https://ffxplain-api.onrender.com/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeInput, language }),
      });
      if (!response.ok) throw new Error('Failed to fetch analysis.');
      const data = await response.json();
      setAnalysisResult(data);
      const updatedHistory = [data, ...history].slice(0, 3);
      setHistory(updatedHistory);
      localStorage.setItem('fixplain_history', JSON.stringify(updatedHistory));
    } catch {
      setError('Analysis failed. Please check your internet or backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: t.bgBase,
      color: t.text1, fontFamily: t.sans,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Nav ── */}
      <nav style={{
        borderBottom: `1px solid ${t.borderSoft}`,
        padding: '0 1.25rem', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(13,15,18,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.teal, display: 'inline-block' }} />
          <span style={{ fontFamily: t.mono, fontSize: 15, fontWeight: 600, color: t.teal, letterSpacing: '-0.3px' }}>
            fixplain
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontFamily: t.mono, color: t.text3 }}>Language:</span>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{
              background: t.bgSurface, border: `1px solid ${t.border}`,
              borderRadius: 8, color: t.text1, fontFamily: t.mono,
              fontSize: 12, padding: '6px 10px', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="nodejs">Node.js</option>
            <option value="csharp">C#</option>
            <option value="sql">SQL</option>
            <option value="python">Python</option>
          </select>
          <span style={{
            fontSize: 11, fontFamily: t.mono, color: t.text3,
            background: t.bgSurface, border: `1px solid ${t.border}`,
            borderRadius: 20, padding: '3px 10px',
          }}>
            v1.0 · Sok Kimsour
          </span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', padding: '2.5rem 1.25rem 1rem' }}>
        <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 600, letterSpacing: '-1px', lineHeight: 1.15, margin: 0 }}>
          Fix it. <span style={{ color: t.teal }}>Explain it.</span> Learn from it.
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: t.text2, fontWeight: 300 }}>
          Paste your code — get instant bug fixes, refactors &amp; plain-language explanations.
        </p>
      </div>

      {/* ── Main grid ── */}
      <main style={{
        width: '100%',
        padding: '1.5rem 1.25rem 2rem',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem',
        flex: 1,
      }}>

        {/* ── LEFT: Input + History ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <Panel style={{ flex: 1, minHeight: 380 }}>
            <PanelHeader>
              <PanelLabel>
                <Dot color="#f59e0b" /><Dot color="#4ade80" /><Dot color="#f87171" />
                &nbsp; input.{language === 'python' ? 'py' : language === 'sql' ? 'sql' : language === 'csharp' ? 'cs' : 'js'}
              </PanelLabel>
              <button
                onClick={() => setCodeInput('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: t.text3, fontSize: 12, fontFamily: t.mono,
                  padding: '2px 8px', borderRadius: 5,
                }}
                onMouseEnter={e => e.target.style.color = t.text1}
                onMouseLeave={e => e.target.style.color = t.text3}
              >
                clear ✕
              </button>
            </PanelHeader>
            <textarea
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: t.text1, fontFamily: t.mono, fontSize: 13, lineHeight: 1.8,
                padding: '1rem 1.25rem', resize: 'none', tabSize: 2,
              }}
            />
          </Panel>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !codeInput.trim()}
            style={{
              fontFamily: t.mono, fontSize: 13, fontWeight: 600,
              padding: '13px 0', borderRadius: 30,
              border: `1.5px solid ${t.tealDim}`,
              background: isLoading ? 'transparent' : t.tealGlow,
              color: t.teal, cursor: isLoading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.4px', transition: 'all 0.2s',
              opacity: (!codeInput.trim() && !isLoading) ? 0.4 : 1,
              width: '100%',
            }}
          >
            {isLoading ? '◌ Analyzing...' : '⚡ Analyze & Fix Code'}
          </button>

          {/* History */}
          {history.length > 0 && (
            <Panel>
              <PanelHeader>
                <PanelLabel>Recent history</PanelLabel>
                <button
                  onClick={clearHistory}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: t.red, fontFamily: t.mono, fontSize: 10,
                    letterSpacing: '0.6px', textTransform: 'uppercase',
                  }}
                >
                  clear all
                </button>
              </PanelHeader>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnalysisResult(item)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '9px 12px',
                      background: t.bgSurface,
                      border: `1px solid ${t.border}`,
                      borderRadius: 8, color: t.text2,
                      fontFamily: t.mono, fontSize: 12,
                      cursor: 'pointer', transition: '0.15s',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = t.tealDim; e.currentTarget.style.color = t.teal; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text2; }}
                  >
                    ◈ {item.bugsFound?.[0] || 'Analysis result'}
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </div>

        {/* ── RIGHT: Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '85vh' }}>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px', background: t.redGlow,
              border: `1px solid ${t.red}`, borderLeft: `3px solid ${t.red}`,
              borderRadius: 10, color: t.red, fontFamily: t.mono, fontSize: 12,
            }}>
              {error}
            </div>
          )}

          {/* Skeletons */}
          {isLoading && [1, 2, 3].map(i => (
            <Panel key={i} style={{ padding: '1.25rem', gap: 10 }}>
              <div style={{ height: 10, background: t.bgSurface, borderRadius: 4, width: '30%', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 8, background: t.bgSurface, borderRadius: 4, width: '90%', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 8, background: t.bgSurface, borderRadius: 4, width: '70%', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }`}</style>
            </Panel>
          ))}

          {/* Empty state */}
          {!analysisResult && !isLoading && !error && (
            <div style={{
              flex: 1, border: `1.5px dashed ${t.border}`, borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '3rem', textAlign: 'center',
              minHeight: 320,
            }}>
              <div>
                <p style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>◈</p>
                <p style={{ color: t.text3, fontFamily: t.mono, fontSize: 12 }}>Ready for analysis</p>
              </div>
            </div>
          )}

          {/* Results */}
          {analysisResult && !isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>

              {/* Bugs Found */}
              <SectionCard accentColor={t.red}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.borderSoft}`, background: t.bgSurface }}>
                  <SectionTitle>Bugs Found</SectionTitle>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analysisResult.bugsFound?.map((b, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      fontFamily: t.mono, fontSize: 12.5, color: t.text2, lineHeight: 1.6,
                    }}>
                      <span style={{ color: t.red, minWidth: 14 }}>✗</span>
                      {b}
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Fixed Code */}
              <SectionCard accentColor={t.green}>
                <div style={{
                  padding: '10px 16px', borderBottom: `1px solid ${t.borderSoft}`,
                  background: t.bgSurface, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <SectionTitle>Fixed Code</SectionTitle>
                  <button
                    onClick={() => handleCopy(analysisResult.fixedCode)}
                    style={{
                      fontFamily: t.mono, fontSize: 10, fontWeight: 600,
                      padding: '4px 12px', borderRadius: 20,
                      border: `1px solid ${isCopied ? t.green : t.border}`,
                      background: isCopied ? 'rgba(74,222,128,0.1)' : 'transparent',
                      color: isCopied ? t.green : t.text2,
                      cursor: 'pointer', transition: '0.2s', letterSpacing: '0.5px',
                    }}
                  >
                    {isCopied ? '✓ copied' : 'copy'}
                  </button>
                </div>
                <SyntaxHighlighter
                  language={language === 'csharp' ? 'csharp' : 'javascript'}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '1.25rem', background: t.bgPanel, fontSize: 12.5, lineHeight: 1.75 }}
                >
                  {analysisResult.fixedCode}
                </SyntaxHighlighter>
              </SectionCard>

              {/* Explanation */}
              <SectionCard accentColor={t.blue}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.borderSoft}`, background: t.bgSurface }}>
                  <SectionTitle>Explanation</SectionTitle>
                </div>
                <p style={{
                  padding: '14px 16px', fontFamily: t.sans,
                  fontSize: 13, color: t.text2, lineHeight: 1.8, margin: 0,
                }}>
                  {analysisResult.explanation}
                </p>
              </SectionCard>

              {/* Suggestions */}
              <SectionCard accentColor={t.purple}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.borderSoft}`, background: t.bgSurface }}>
                  <SectionTitle>Improvement Suggestions</SectionTitle>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analysisResult.improvementSuggestions?.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{
                        minWidth: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(167,139,250,0.1)', color: t.purple,
                        fontSize: 10, fontWeight: 600, fontFamily: t.mono,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 2,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontFamily: t.mono, fontSize: 12.5, color: t.text2, lineHeight: 1.6 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

            </div>
          )}
        </div>
      </main>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: t.mono, fontSize: 10, color: t.text3,
        padding: '0 1.25rem 1rem',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.green, display: 'inline-block' }} />
        Connected · ffxplain-api.onrender.com
      </div>

    </div>
  );
}

export default App;
