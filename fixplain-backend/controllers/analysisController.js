import { callWithFallback } from '../config/ai.js';
import { formatCode } from '../utils/codeFormatter.js';
import { getCached, setCached } from '../middleware/cache.js';
import { hashKey } from '../utils/helpers.js';

const MAX_CODE_CHARS = 12000;

export async function fixCode(req, res) {
  const {
    codeInput,
    language = 'javascript',
    mode = 'both',
    locale = 'en',
    previousBugs = [],
    wasAlreadyFixed = false,
  } = req.body;

  if (!codeInput) return res.status(400).json({ error: 'No code provided.' });
  if (codeInput.length > MAX_CODE_CHARS) {
    return res.status(400).json({
      error: `Code exceeds the ${MAX_CODE_CHARS.toLocaleString()} character limit. Please split into smaller sections.`,
    });
  }

  const modeInstruction =
    mode === 'fix'
      ? 'Focus ONLY on finding and fixing bugs. Do not refactor beyond what is needed.'
      : mode === 'refactor'
        ? 'Assume the logic is correct. Focus ONLY on refactoring for readability and efficiency. Do not change function names.'
        : 'Both fix all bugs AND refactor the code for readability and efficiency. Do not change function names.';

  const localeInstruction = locale === 'km'
    ? `IMPORTANT — KHMER LANGUAGE OUTPUT RULES:

RULE A — CODE PRESERVATION (ABSOLUTE):
  Under NO circumstances should you translate variable names, function names, class names, method names, or any programming keywords into Khmer.
  The code inside "fixedCode" and "commentedCode" must remain 100% in its original programming language.
  Identifiers, operators, keywords (if, for, return, async, etc.), data string literals, and all structural code must be left completely untouched.
  ONLY the descriptive lines inside JSDoc comment blocks (/** ... */) written above functions in "commentedCode" may be written in Khmer.

RULE B — TARGETED TRANSLATION ONLY:
  Translate ONLY these fields into Khmer (ភាសាខ្មែរ):
  - Every "issue" string in "bugsFound" (e.g. "SQL injection vulnerability" → "ភាពងាយរងគ្រោះ SQL injection")
  - The entire "explanation" field
  - Every "tip" value in "improvementSuggestions"
  Do NOT translate: "youtubeQuery", "mdnQuery", "severity", JSON keys, or any code inside "fixedCode"/"commentedCode".

RULE C — CONSISTENCY (ALWAYS REFERENCE ENGLISH IDENTIFIERS):
  Even when writing explanations and suggestions entirely in Khmer, you MUST still refer to the original English variable names, function names, and class names exactly as they appear in the code — wrapped in backticks.
  Example: "អថេរ \`userCount\` មានបញ្ហា..." — keep the English identifier name inline inside the Khmer sentence.
  This ensures developers can map every explanation directly back to the code they see without confusion.`
    : '';

  const previousBugsInstruction = Array.isArray(previousBugs) && previousBugs.length > 0
    ? `\nPREVIOUS ANALYSIS CONTEXT: A prior review already identified these bugs. Do NOT re-report them if resolved:\n${previousBugs.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}`
    : '';

  const alreadyFixedInstruction = wasAlreadyFixed
    ? `\nIMPORTANT: This code was already processed and fixed by a previous AI analysis. It should be clean. Apply RULE 1 very strictly — only report genuine remaining bugs. If in doubt, do NOT report it. The expected result is bugsFound = [] and health = 100.`
    : '';

  const langRules = {
    javascript: `JAVASCRIPT-SPECIFIC: Watch for: == vs === (always use ===), missing await on async calls, var instead of const/let, unchecked null/undefined, callback missing error handling, string concatenation in queries.`,
    nodejs: `NODE.JS-SPECIFIC: Watch for: missing await, unhandled promise rejections, no error middleware, synchronous blocking calls, missing input validation, SQL/NoSQL injection via string concatenation.`,
    python: `PYTHON-SPECIFIC: Watch for: mutable default arguments (def f(x=[])), bare except clauses, == None instead of is None, integer division issues, missing error handling in file/network operations.`,
    sql: `SQL-SPECIFIC: Watch for: string concatenation in queries (SQL injection), missing WHERE clause on UPDATE/DELETE, SELECT * in production, missing indexes on JOIN columns, unparameterized user input.`,
    typescript: `TYPESCRIPT-SPECIFIC: Watch for: any type overuse, non-null assertions (!), missing type guards, implicit any, unhandled promise types, incorrect generic constraints.`,
    java: `JAVA-SPECIFIC: Watch for: NullPointerException risks, unchecked exceptions, resource leaks (unclosed streams), == for string comparison instead of .equals(), raw types instead of generics.`,
    csharp: `C#-SPECIFIC: Watch for: null reference exceptions, using blocks for IDisposable, async void methods, missing cancellation tokens, string comparison with == vs .Equals().`,
    php: `PHP-SPECIFIC: Watch for: SQL injection via string concatenation, missing input sanitization, loose comparison == vs ===, direct $_GET/$_POST usage without validation.`,
    ruby: `RUBY-SPECIFIC: Watch for: missing nil checks, unsafe eval usage, SQL injection in ActiveRecord raw queries, mass assignment without strong parameters.`,
    go: `GO-SPECIFIC: Watch for: ignored error returns, nil pointer dereferences, goroutine leaks, race conditions, unclosed response bodies.`,
    rust: `RUST-SPECIFIC: Watch for: unwrap() on Option/Result without handling, unsafe blocks, integer overflow in debug vs release, lifetime issues.`,
    swift: `SWIFT-SPECIFIC: Watch for: force unwrapping optionals (!), retain cycles in closures, missing weak/unowned references, incorrect error handling.`,
  }[language] || '';

  const systemPrompt = `Act as a world-class ${language} software engineer performing a professional code review.
${modeInstruction}
${langRules}
${localeInstruction}
${previousBugsInstruction}
${alreadyFixedInstruction}

OUTPUT FORMAT — THIS IS CRITICAL:
You must respond with ONLY a valid JSON object. No preamble. No explanation before or after. No markdown fences. No code blocks. No "Here is..." text. Start your response with { and end with }. Nothing else.

THINK FIRST: Before writing your JSON response, silently reason through:
  1. What does this code do overall?
  2. What can go wrong at runtime?
  3. Are there security vulnerabilities?
  4. What is the cleanest fix?
  Then write your JSON — do NOT include your thinking in the output.

STRICT RULES — read carefully before responding:

RULE 1 — A "bug" is ONLY one of these real problems:
  - Syntax error that prevents code from running
  - Runtime error (null/undefined dereference, division by zero, index out of bounds, missing await, unhandled rejection)
  - Logic error that produces wrong results
  - Security vulnerability (SQL injection, XSS, unsafe input handling)
  DO NOT report: style preferences, naming conventions, missing comments, performance micro-optimizations, or "could be improved" suggestions as bugs. Those belong in improvementSuggestions only.

RULE 2 — If the code is functional with no real bugs — return bugsFound as an EMPTY ARRAY and fixedCode as the original code (lightly refactored only if mode includes refactor). Health will show 100.

RULE 3 — Fix EVERY bug you list. If you put it in bugsFound, it MUST be resolved in fixedCode. No partial fixes.

RULE 4 — Self-verify fixedCode before responding:
  Re-read fixedCode line by line and confirm: no syntax errors, no runtime errors, no logic errors, no security holes, every listed bug is resolved. Fix anything remaining before submitting.

RULE 5 — Code formatting: 2-space indentation, real newlines, never a single line.

RULE 6 — Confidence and severity must be consistent:
  - If confidence < 70, do NOT include the bug in bugsFound at all.
  - If confidence 70–89, use "low" or "medium" severity only — never "high".
  - If confidence ≥ 90, any severity is appropriate.
  This prevents inflating the bug count with uncertain findings that lower the health score unfairly.

SEVERITY DEFINITIONS — use these exact criteria, no exceptions:
  "high"   = bugs that WILL cause a crash, data loss, or security breach at runtime. Examples: SQL injection, missing await on async call, null dereference, division by zero, assignment instead of comparison (= vs ===).
            → Each high bug deducts 25 points from the health score (100 − 25 per high bug).
  "medium" = bugs that produce WRONG results silently without crashing. Examples: off-by-one errors, wrong operator (=+ instead of +=), unhandled error callbacks, logic that returns incorrect values.
            → Each medium bug deducts 12 points from the health score.
  "low"    = code that works but has a clear quality issue. Examples: unused variables, unreachable code, redundant conditions.
            → Low bugs do NOT affect the health score — they are informational only.
  NEVER use "high" for style issues. NEVER use "low" for runtime crashes. The severity must match these definitions exactly — health score accuracy depends on it.
  CONSISTENCY CHECK: before assigning severity, ask yourself "will this crash at runtime?" → high. "Will this give wrong output silently?" → medium. "Does it still work correctly?" → low.

Respond ONLY in strict JSON with exactly these five keys:
- "bugsFound": array of objects each with:
    - "issue": (${locale === 'km' ? 'string in Khmer (ភាសាខ្មែរ)' : 'string'})
    - "severity": ("high"|"medium"|"low")
    - "lineNumber": (integer or null)
    - "confidence": (integer 0-100 — only report bugs with confidence ≥ 70). EMPTY ARRAY if no real bugs or mode is 'refactor'.
- "fixedCode": fully corrected production-quality code. No markdown fences.
- "commentedCode": fixedCode with JSDoc-style comment above each function. No markdown fences.
- "explanation": a clear, structured explanation written like a senior developer teaching a junior. Use this exact format:

    OVERVIEW: [One sentence — what this code is supposed to do]

    For each bug or change, use this block:
    LINE [X] — [Short title of what changed]
    • Problem: [What was wrong and why it is dangerous or incorrect]
    • Fix: [What was changed and why it solves the problem]
    • Impact: [What would happen in real life if this bug was left unfixed]

    REMEMBER: [One key takeaway the developer should not forget]

    Rules:
    - Use simple words. No jargon. Write for a beginner.
    - Every bug must have its own LINE block.
    - Keep each bullet point to 1-2 sentences maximum.
    - If code was already clean, write: "OVERVIEW: This code is correct. Here is what it does well:" then explain each part.
    ${locale === 'km' ? 'Write entirely in Khmer (ភាសាខ្មែរ). Keep the same format structure (OVERVIEW, LINE, Problem, Fix, Impact, REMEMBER) but translate all labels and content to Khmer.' : ''}
- "improvementSuggestions": array of exactly 3 objects, each with:
    - "tip": the actionable suggestion text. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}
    - "youtubeQuery": a short English search query (4-6 words) for a YouTube tutorial. Always English. Example: "javascript async await explained", "python error handling best practices".
    - "mdnQuery": a short English search query (3-5 words) for MDN Web Docs. Always English. Example: "Promise async await", "array methods javascript".`;

  try {
    // Check cache first — skip if wasAlreadyFixed (re-analysis context matters)
    const cacheKey = hashKey(`${language}:${mode}:${locale}:${codeInput}`);
    if (!wasAlreadyFixed && previousBugs.length === 0) {
      const cached = getCached(cacheKey);
      if (cached) {
        console.log('[Cache] Hit');
        return res.json({ ...cached, _provider: 'Cache' });
      }
    }

    const { result, provider } = await callWithFallback(
      systemPrompt,
      `Analyze this ${language} code:\n${codeInput}`
    );

    if (result.fixedCode) result.fixedCode = formatCode(result.fixedCode, language);
    if (result.commentedCode) result.commentedCode = formatCode(result.commentedCode, language);
    result._provider = provider;

    // Store in cache
    if (!wasAlreadyFixed) setCached(cacheKey, result);

    res.json(result);
  } catch (err) {
    console.error('All providers failed:', err.message);
    res.status(500).json({ error: 'AI analysis failed. All providers are currently unavailable.' });
  }
}

export async function fixSingleBug(req, res) {
  const { codeInput, bugIssue, language = 'javascript' } = req.body;
  if (!codeInput || !bugIssue) return res.status(400).json({ error: 'Missing fields.' });
  if (codeInput.length > MAX_CODE_CHARS) return res.status(400).json({ error: 'Code exceeds size limit.' });

  const systemPrompt = `Act as a world-class ${language} software engineer.
Fix ONLY this specific bug: "${bugIssue}"

OUTPUT FORMAT — THIS IS CRITICAL:
Respond with ONLY a valid JSON object. No preamble. No explanation before or after. No markdown fences. Start with { and end with }. Nothing else.

STRICT RULES:
- Do not change any other logic, function names, or variable names.
- Ensure the fix is complete — no partial fixes.
- Do not introduce any new bugs or issues while fixing.
- Self-verify: after writing fixedCode, re-read it and confirm the bug is resolved and no new issues exist.
- Use proper 2-space indentation and formatting.
- The fixed code must be production-quality with no syntax errors, runtime errors, or logic errors.

Respond ONLY in strict JSON with one key:
- "fixedCode": the complete code with only that specific bug fixed. No markdown fences.`;

  try {
    const { result, provider } = await callWithFallback(systemPrompt, `Code:\n${codeInput}`);
    if (result.fixedCode) result.fixedCode = formatCode(result.fixedCode, language);
    result._provider = provider;
    res.json(result);
  } catch (err) {
    console.error('All providers failed:', err.message);
    res.status(500).json({ error: 'Fix failed. All providers are currently unavailable.' });
  }
}
