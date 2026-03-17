import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect } from 'react'; 
import './App.css';

function App() {
  // --- STATE ---
  const [codeInput, setCodeInput] = useState('// Paste your code here...\nfunction example() {\n  let x = 10\n  console.log(x)\n}');
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedHistory = localStorage.getItem('fixplain_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // --- ACTIONS ---
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

    } catch (err) {
      setError("Analysis failed. Please check your internet or backend status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Fixplain</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">Language:</span>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="nodejs">Node.js</option>
              <option value="csharp">C#</option>
              <option value="sql">SQL</option>
              <option value="python">Python</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        
        {/* LEFT: INPUT & HISTORY */}
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col flex-grow">
            <label className="text-xs font-bold text-gray-400 mb-2 uppercase">Input Code</label>
            <textarea
              className="flex-grow w-full min-h-[350px] bg-gray-900 text-indigo-100 font-mono p-5 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !codeInput.trim()}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition disabled:bg-gray-300"
            >
              {isLoading ? '🤖 Thinking...' : 'Analyze & Fix Code'}
            </button>
          </div>

          {/* HISTORY UI */}
          {history.length > 0 && (
            <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase">Recent History</h3>
                <button 
                  onClick={clearHistory}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setAnalysisResult(item)}
                    className="w-full text-left p-3 text-sm bg-white border rounded-lg hover:border-indigo-400 truncate shadow-sm transition"
                  >
                    💾 {item.bugsFound[0] || "Analysis result"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: RESULTS */}
        <div className="space-y-6 overflow-y-auto max-h-[85vh]">
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border-l-4 border-red-500">{error}</div>}

          {/* Skeletons */}
          {isLoading && [1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}

          {/* Empty State */}
          {!analysisResult && !isLoading && !error && (
            <div className="h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-10 text-gray-400 text-center">
              <div><p className="text-3xl mb-2">⚡</p><p>Ready for analysis</p></div>
            </div>
          )}

          {/* Result Content */}
          {analysisResult && !isLoading && (
            <div className="space-y-6 animate-fade-in pb-10">
              {/* Bugs Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                <h2 className="font-bold text-gray-800 mb-2">🐛 Bugs Found</h2>
                <ul className="text-sm text-gray-600 space-y-1">
                  {analysisResult.bugsFound.map((b, i) => <li key={i}>• {b}</li>)}
                </ul>
              </div>

              {/* Fixed Code Card */}
              <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 overflow-hidden">
                <div className="flex justify-between items-center bg-gray-50 px-6 py-3">
                  <h2 className="font-bold text-gray-800">✨ Fixed Code</h2>
                  <button onClick={() => handleCopy(analysisResult.fixedCode)} className="text-xs font-bold text-indigo-600 px-2 py-1 bg-white border rounded shadow-sm">
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <SyntaxHighlighter language={language === 'csharp' ? 'csharp' : 'javascript'} style={vscDarkPlus} customStyle={{margin:0, padding:'1.5rem'}}>
                  {analysisResult.fixedCode}
                </SyntaxHighlighter>
              </div>

              {/* Explanation & Tips */}
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <h2 className="font-bold text-gray-800 mb-2">🧠 Explanation</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{analysisResult.explanation}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <h2 className="font-bold text-gray-800 mb-2">🚀 Improvement Suggestions</h2>
                <ul className="text-sm text-gray-600 space-y-1">
                  {analysisResult.improvementSuggestions.map((s, i) => <li key={i}>→ {s}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;