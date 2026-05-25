// ── LCS-based diff algorithm ──────────────────────────────────────────────────
// Produces accurate line-level diffs (added / removed / same) instead of
// naive index-based zipping. Falls back to zip for very large files.
export function computeDiff(original, fixed) {
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
