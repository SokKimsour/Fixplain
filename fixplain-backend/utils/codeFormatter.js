import pkg from 'js-beautify';
const { js: beautifyJS } = pkg;

// ── Format code ───────────────────────────────────────────────────────────────
export function formatCode(code, language) {
  if (!code || typeof code !== 'string') return code;
  const opts = {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: 2,
    preserve_newlines: true,
    keep_array_indentation: false,
    break_chained_methods: false,
    brace_style: 'collapse',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: false,
    end_with_newline: false,
    wrap_line_length: 0,
    comma_first: false,
  };
  try {
    switch (language) {
      case 'javascript':
      case 'nodejs':
      case 'typescript':
      case 'java':
      case 'csharp':
      case 'php':
        return beautifyJS(code, opts);
      default:
        return code
          .replace(/;\s+/g, ';\n')
          .replace(/\{\s+/g, '{\n  ')
          .replace(/\s+\}/g, '\n}');
    }
  } catch {
    return code;
  }
}
