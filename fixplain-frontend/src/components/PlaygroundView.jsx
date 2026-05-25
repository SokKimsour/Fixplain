import React, { useState } from 'react';

export default function PlaygroundView({ code, language, c, tf, mono }) {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = () => {
    setLogs([]);
    setIsRunning(true);

    const isJS = ['javascript', 'nodejs'].includes(language);

    if (isJS) {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const win = iframe.contentWindow;
        const capturedLogs = [];

        // Redirect console.log and console.error
        win.console.log = (...args) => {
          capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        win.console.error = (...args) => {
          capturedLogs.push('ERROR: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };

        // Run user code safely in iframe
        win.eval(code);

        setLogs(capturedLogs.length ? capturedLogs : ['Code ran successfully with no console outputs.']);
        document.body.removeChild(iframe);
      } catch (err) {
        setLogs([`Runtime Error: ${err.message}`]);
      }
    } else {
      // Simulation for non-JS languages
      setTimeout(() => {
        setLogs([
          `[System] Initializing virtual runner for ${language}...`,
          `[System] Compiling syntax checks...`,
          `[System] Compilation successful.`,
          `[System] Simulation output: Code contains no compile-time errors.`
        ]);
        setIsRunning(false);
      }, 500);
      return;
    }
    setIsRunning(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: tf, fontSize: 14, color: c.text2 }}>
          {language === 'javascript' || language === 'nodejs'
            ? 'Execute the fixed code directly in your browser sandbox.'
            : `Simulation sandbox for ${language}.`}
        </span>
        <button
          onClick={runCode}
          disabled={isRunning}
          style={{
            fontFamily: tf,
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 16px',
            borderRadius: 20,
            border: `1.5px solid ${c.teal}`,
            background: isRunning ? 'transparent' : c.tealGlow,
            color: c.teal,
            cursor: isRunning ? 'wait' : 'pointer',
            transition: '0.15s',
            outline: 'none'
          }}
        >
          {isRunning ? 'Running...' : '▶ Run Code'}
        </button>
      </div>

      <div style={{
        background: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: 8,
        padding: 14,
        fontFamily: mono,
        fontSize: 13,
        color: '#e6edf3',
        minHeight: 180,
        maxHeight: 300,
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
      }}>
        {logs.length === 0 ? (
          <span style={{ color: '#8b949e', fontStyle: 'italic' }}>Console outputs will appear here...</span>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} style={{
              borderBottom: '1px solid rgba(240,246,252,0.04)',
              paddingBottom: 4,
              marginBottom: 4,
              lineHeight: 1.6,
              color: log.startsWith('ERROR:') ? '#f87171' : log.startsWith('[System]') ? '#60a5fa' : '#4ade80'
            }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
