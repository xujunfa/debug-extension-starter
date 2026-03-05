import type { ReactNode } from 'react';

/**
 * Split `text` by `pattern` and wrap matched segments with <mark>.
 * Returns the original string when pattern is empty or invalid.
 */
export function highlightText(
  text: string,
  pattern: string,
  filterType: 'contains' | 'regex' = 'contains',
): ReactNode {
  if (!pattern || !text) return text;

  let regex: RegExp;
  try {
    regex =
      filterType === 'regex'
        ? new RegExp(`(${pattern})`, 'gi')
        : new RegExp(`(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  } catch {
    return text;
  }

  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="rounded-sm bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
