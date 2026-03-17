import { useState } from 'react';
import './App.css';

function App() {
  // 1. Define all our state variables here
  const [codeInput, setCodeInput] = useState('function buggyFunction() {\n  let x = 10\n  console.log(x)\n}');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // 2. The function that runs when you click the button
  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Calling your new Node.js backend
      const response = await fetch('https://ffxplain-api.onrender.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codeInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis from server.');
      }


      // Getting the real JSON back from Gemini
      const data = await response.json();
      setAnalysisResult(data);

    } catch (err) {
      console.error(err);
      setError("Failed to analyze code. Please check if the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-baseline gap-4">
          <h1 className="text-2xl font-bold text-indigo-600">Fixplain</h1>
          <p className="text-gray-500 italic hidden sm:block">"Fix it. Explain it. Learn from it."</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column (Input) */}
          <div className="flex flex-col h-full">
            <label htmlFor="code-input" className="mb-2 font-semibold text-gray-800">
              Paste your code
            </label>
            <textarea
              id="code-input"
              className="flex-1 w-full min-h-[300px] max-h-[500px] bg-gray-900 text-gray-100 font-mono rounded-lg p-4 border border-gray-300 outline-none focus:ring-2 focus:ring-indigo-500 resize-y transition"
              placeholder="// Paste your code here..."
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !codeInput.trim()}
              className="mt-6 w-full py-3 px-5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow transition disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? 'Analyzing with AI...' : 'Analyze & Fix Code'}
            </button>
          </div>

          {/* Right Column (Output) */}
          <div className="flex flex-col h-full space-y-6">
            
            {/* Error State */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Empty State (Before clicking button) */}
            {!analysisResult && !isLoading && !error && (
              <div className="flex flex-1 items-center justify-center h-full min-h-[350px] border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-400 text-center text-base px-6">
                  Paste your broken code on the left and hit Analyze. <br/> Your fixed code and explanations will appear here.
                </div>
              </div>
            )}

            {/* Populated Results State */}
            {analysisResult && !isLoading && (
              <div className="space-y-6 animate-fade-in">
                {/* Bugs Found */}
                <div className="bg-white shadow-sm rounded-lg p-6 border-l-4 border-red-500">
                  <h2 className="font-semibold text-lg mb-2 text-gray-800">🐛 Bugs Found</h2>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {analysisResult.bugsFound.map((bug, idx) => (
                      <li key={idx}>{bug}</li>
                    ))}
                  </ul>
                </div>

                {/* Fixed Code */}
                <div className="bg-white shadow-sm rounded-lg p-6 border-l-4 border-green-500">
                  <h2 className="font-semibold text-lg mb-2 text-gray-800">✨ Fixed Code</h2>
                  <pre className="bg-gray-900 rounded-md p-4 overflow-x-auto text-sm font-mono text-green-400">
                    {analysisResult.fixedCode}
                  </pre>
                </div>

                {/* Explanation */}
                <div className="bg-white shadow-sm rounded-lg p-6 border-l-4 border-blue-500">
                  <h2 className="font-semibold text-lg mb-2 text-gray-800">🧠 Explanation</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {analysisResult.explanation}
                  </p>
                </div>

                {/* Improvement Suggestions */}
                <div className="bg-white shadow-sm rounded-lg p-6 border-l-4 border-purple-500">
                  <h2 className="font-semibold text-lg mb-2 text-gray-800">🚀 Improvement Suggestions</h2>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {analysisResult.improvementSuggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm">
        <p>Built with 💻 and 🤖 by Sok Kimsour | Prompt Engineering Curriculum 2026</p>
      </footer>
    </div>
  );
}

export default App;