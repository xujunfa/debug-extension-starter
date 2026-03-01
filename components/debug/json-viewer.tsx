import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface JsonViewerProps {
  data: JsonValue;
  className?: string;
  defaultExpanded?: boolean;
  maxDepth?: number;
}

interface JsonNodeProps {
  label?: string;
  value: JsonValue;
  depth: number;
  defaultExpanded: boolean;
  maxDepth: number;
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
}: JsonNodeProps) {
  const isExpandable =
    value !== null && typeof value === 'object';
  const [expanded, setExpanded] = React.useState(
    defaultExpanded && depth < maxDepth,
  );

  if (!isExpandable) {
    return (
      <div className="flex items-center gap-1 py-0.5 font-mono text-xs">
        <span className="w-4" />
        {label != null && (
          <span className="text-foreground/70">{label}: </span>
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
        className="flex w-full items-center gap-1 py-0.5 text-left hover:bg-accent/50"
      >
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
        {label != null && (
          <span className="text-foreground/70">{label}: </span>
        )}
        <Badge variant="outline" className="h-4 rounded px-1 text-[10px]">
          {Array.isArray(value) ? `[${value.length}]` : getPreview(value)}
        </Badge>
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
}: JsonViewerProps) {
  return (
    <div className={cn('overflow-auto rounded-md border bg-card p-2', className)}>
      <JsonNode
        value={data}
        depth={0}
        defaultExpanded={defaultExpanded}
        maxDepth={maxDepth}
      />
    </div>
  );
}

export { JsonViewer, type JsonValue, type JsonViewerProps };
