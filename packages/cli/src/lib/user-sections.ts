/**
 * User section preservation for generated context files.
 *
 * Generated files include protected user sections that survive regeneration.
 * Two marker formats are supported:
 *   - markdown: <!-- ORBIT:USER-START --> / <!-- ORBIT:USER-END -->
 *   - comment:  # ORBIT:USER-START / # ORBIT:USER-END
 */

export type MarkerFormat = 'markdown' | 'comment';

const MARKERS = {
  markdown: {
    start: '<!-- ORBIT:USER-START -->',
    end: '<!-- ORBIT:USER-END -->',
  },
  comment: {
    start: '# ORBIT:USER-START',
    end: '# ORBIT:USER-END',
  },
} as const;

/**
 * Extract user-written content between ORBIT:USER-START and ORBIT:USER-END markers.
 * Returns null if markers are not found or the section is empty/default.
 */
export function extractUserSections(content: string, format: MarkerFormat): string | null {
  const { start, end } = MARKERS[format];

  const startIdx = content.indexOf(start);
  const endIdx = content.indexOf(end);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  const userContent = content.slice(startIdx + start.length, endIdx);

  // Trim and check if it's just the default placeholder or empty
  const trimmed = userContent.trim();
  if (
    trimmed === '' ||
    trimmed === '(Your custom rules and notes here - this section is preserved on regeneration)'
  ) {
    return null;
  }

  return userContent;
}

/**
 * Build the user section block with markers and content.
 * If userContent is null, includes a default placeholder.
 */
export function buildUserSection(userContent: string | null, format: MarkerFormat): string {
  const { start, end } = MARKERS[format];
  const inner = userContent ?? '\n(Your custom rules and notes here - this section is preserved on regeneration)\n';

  return `${start}${inner}${end}\n`;
}

/**
 * Determine the appropriate marker format for a given render target filename.
 */
export function getMarkerFormat(filename: string): MarkerFormat {
  // .cursorrules and .windsurfrules use comment-style markers
  if (filename === '.cursorrules' || filename === '.windsurfrules') {
    return 'comment';
  }
  // Everything else (CLAUDE.md, copilot-instructions.md, .mdc files) uses markdown markers
  return 'markdown';
}

/**
 * Append user section footer to generated content.
 * Used by renderers to add the markers at the end of generated output.
 */
export function appendUserSection(
  generatedContent: string,
  userContent: string | null,
  format: MarkerFormat,
): string {
  const separator = format === 'markdown'
    ? '<!-- ORBIT:AUTO-GENERATED - Do not edit above this line -->'
    : '# ORBIT:AUTO-GENERATED - Do not edit above this line';

  const lines: string[] = [];
  lines.push(generatedContent.trimEnd());
  lines.push('');
  lines.push(separator);
  lines.push('');
  lines.push('## Custom Rules');
  lines.push(buildUserSection(userContent, format));

  return lines.join('\n');
}
