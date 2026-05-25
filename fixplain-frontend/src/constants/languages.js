export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'csharp', label: 'C#' },
  { value: 'sql', label: 'SQL' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'cpp', label: 'C++' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'bash', label: 'Bash/Shell' }
];

export const MODES = ['both', 'fix', 'refactor'];
export const TAB_KEYS = ['bugs', 'fixed', 'commented', 'explain', 'suggest'];

export const EXT_MAP = {
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

export const LANG_HINTS = [
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
