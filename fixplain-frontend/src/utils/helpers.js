export const normalizeBugs = bugs =>
  !bugs?.length ? [] : bugs.map(b => typeof b === 'string' ? { issue: b, severity: 'medium', lineNumber: null } : b);

export const computeHealthScore = bugs => {
  if (!bugs.length) return 100;
  // Only high (−20) and medium (−8) reduce the score; low bugs are ignored per PRD
  const realBugs = bugs.filter(b => b.severity === 'high' || b.severity === 'medium');
  if (!realBugs.length) return 100;
  const deductions = realBugs.reduce((sum, b) => sum + (b.severity === 'high' ? 20 : 8), 0);
  return Math.max(0, 100 - deductions);
};

export const healthColor = (score, c) => score >= 80 ? c.green : score >= 50 ? c.amber : c.red;

// ── Client-side code formatter ────────────────────────────────────────────────
export function formatCode(code, language) {
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
