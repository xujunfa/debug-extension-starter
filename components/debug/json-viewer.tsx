import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';


type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface HighlightRule {
  id: string;
  key: string;
  enabled: boolean;
}

interface JsonViewerProps {
  data: JsonValue;
  className?: string;
  defaultExpanded?: boolean;
  maxDepth?: number;
  highlightKeys?: HighlightRule[];
}

interface JsonNodeProps {
  label?: string;
  value: JsonValue;
  depth: number;
  defaultExpanded: boolean;
  maxDepth: number;
  highlightSet: Set<string>;
}

function getType(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getPreview(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `{${keys.length}}`;
  }
  return String(value);
}

function hasHighlightedDescendant(value: JsonValue, highlightSet: Set<string>): boolean {
  if (highlightSet.size === 0) return false;
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some((v) => hasHighlightedDescendant(v, highlightSet));
  }
  for (const [k, v] of Object.entries(value)) {
    if (highlightSet.has(k)) return true;
    if (hasHighlightedDescendant(v, highlightSet)) return true;
  }
  return false;
}

const typeColors: Record<string, string> = {
  string: 'text-green-600 dark:text-green-400',
  number: 'text-blue-600 dark:text-blue-400',
  boolean: 'text-purple-600 dark:text-purple-400',
  null: 'text-muted-foreground italic',
};

function ValueDisplay({ value }: { value: JsonValue }) {
  const type = getType(value);

  if (type === 'string') {
    return (
      <span className={typeColors.string}>
        &quot;{String(value)}&quot;
      </span>
    );
  }

  if (type === 'null') {
    return <span className={typeColors.null}>null</span>;
  }

  return (
    <span className={typeColors[type] ?? 'text-foreground'}>
      {String(value)}
    </span>
  );
}

function JsonNode({
  label,
  value,
  depth,
  defaultExpanded,
  maxDepth,
  highlightSet,
}: JsonNodeProps) {
  const isExpandable =
    value !== null && typeof value === 'object';
  const isHighlighted = label != null && highlightSet.has(label);
  const shouldAutoExpand = isExpandable && hasHighlightedDescendant(value, highlightSet);
  const [expanded, setExpanded] = React.useState(
    shouldAutoExpand || (defaultExpanded && depth < maxDepth),
  );

  React.useEffect(() => {
    if (shouldAutoExpand && !expanded) setExpanded(true);
  }, [shouldAutoExpand]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isExpandable) {
    return (
      <div
        className={cn(
          'flex items-center gap-1 py-0.5 font-mono text-xs',
          isHighlighted && 'rounded bg-yellow-500/15',
        )}
      >
        <span className="w-4" />
        {label != null && (
          <span className={cn('text-foreground/70', isHighlighted && 'font-semibold text-yellow-700 dark:text-yellow-300')}>
            {label}:{' '}
          </span>
        )}
        <ValueDisplay value={value} />
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, JsonValue>);

  return (
    <div className="font-mono text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-1 py-0.5 text-left hover:bg-accent/50',
          isHighlighted && 'rounded bg-yellow-500/15',
        )}
      >
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
        {label != null && (
          <span className={cn('text-foreground/70', isHighlighted && 'font-semibold text-yellow-700 dark:text-yellow-300')}>
            {label}:{' '}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/50">
          {Array.isArray(value) ? `[${value.length}]` : getPreview(value)}
        </span>
      </button>

      {expanded && (
        <div className="ml-4 border-l border-border pl-2">
          {entries.map(([key, val]) => (
            <JsonNode
              key={key}
              label={key}
              value={val}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
              maxDepth={maxDepth}
              highlightSet={highlightSet}
            />
          ))}
          {entries.length === 0 && (
            <span className="py-0.5 text-muted-foreground italic">
              {Array.isArray(value) ? 'empty array' : 'empty object'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function JsonViewer({
  data,
  className,
  defaultExpanded = true,
  maxDepth = 4,
  highlightKeys,
}: JsonViewerProps) {
  const highlightSet = React.useMemo(
    () => new Set((highlightKeys ?? []).filter((r) => r.enabled).map((r) => r.key)),
    [highlightKeys],
  );

  return (
    <div className={cn('overflow-auto rounded-md border bg-card p-2', className)}>
      <JsonNode
        value={data}
        depth={0}
        defaultExpanded={defaultExpanded}
        maxDepth={maxDepth}
        highlightSet={highlightSet}
      />
    </div>
  );
}

export { JsonViewer, type JsonValue, type JsonViewerProps, type HighlightRule };
