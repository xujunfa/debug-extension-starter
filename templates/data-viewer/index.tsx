import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, X, Camera, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageGet, storageSet } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonViewer, type JsonValue } from '@/components/debug/json-viewer';
import {
  type WatchExpression,
  type Snapshot,
  STORAGE_KEY_SNAPSHOTS,
  MAX_SNAPSHOTS,
  defaultExpressions,
  evalInPage,
} from './config';

interface EvalResult {
  value: unknown;
  error?: string;
  updatedAt: number;
}

type SnapshotMap = Record<string, Snapshot[]>;

function SnapshotTimeline({
  snapshots,
  onDelete,
}: {
  snapshots: Snapshot[];
  onDelete: (id: string) => void;
}) {
  if (snapshots.length === 0) return null;

  return (
    <div className="border-t bg-muted/10">
      {snapshots.map((snap, i) => {
        const entry = snap.entries[0];
        if (!entry) return null;
        const prev = snapshots[i + 1]?.entries[0];
        const prevVal = prev?.error ?? (typeof prev?.value === 'string' ? prev.value : JSON.stringify(prev?.value));
        const curVal = entry.error ?? (typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value));
        const changed = prev != null && prevVal !== curVal;

        return (
          <div key={snap.id} className="flex items-start gap-2 border-b border-border/30 px-3 py-1">
            <span className="shrink-0 pt-0.5 text-[10px] text-muted-foreground">
              {new Date(snap.timestamp).toLocaleTimeString()}
            </span>
            <div className="min-w-0 flex-1">
              {entry.error ? (
                <span className="text-[10px] text-destructive">{entry.error}</span>
              ) : changed ? (
                <div className="flex flex-col gap-0.5 font-mono text-[10px]">
                  <div className="truncate rounded bg-red-500/10 px-1 text-red-700 dark:text-red-300">
                    - {prevVal}
                  </div>
                  <div className="truncate rounded bg-green-500/10 px-1 text-green-700 dark:text-green-300">
                    + {curVal}
                  </div>
                </div>
              ) : (
                <pre className="truncate font-mono text-[10px] text-muted-foreground">{curVal}</pre>
              )}
            </div>
            <Button variant="ghost" size="icon-xs" className="shrink-0" onClick={() => onDelete(snap.id)}>
              <X className="size-2.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function WatchCard({
  expr,
  result,
  snapshots,
  onRefresh,
  onRemove,
  onSnapshot,
  onDeleteSnapshot,
}: {
  expr: WatchExpression;
  result?: EvalResult;
  snapshots: Snapshot[];
  onRefresh: () => void;
  onRemove: () => void;
  onSnapshot: () => void;
  onDeleteSnapshot: (id: string) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  let display: JsonValue | null = null;
  if (result && !result.error) {
    if (typeof result.value === 'string') {
      try {
        display = JSON.parse(result.value) as JsonValue;
      } catch {
        display = result.value;
      }
    } else {
      display = result.value as JsonValue;
    }
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
        <span className="flex-1 truncate text-xs font-medium">
          {expr.label ?? expr.expression}
        </span>
        {result && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(result.updatedAt).toLocaleTimeString()}
          </span>
        )}
        <Button variant="ghost" size="icon-xs" onClick={onSnapshot} title="Take snapshot">
          <Camera className="size-3" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onRefresh}>
          <RefreshCw className="size-3" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onRemove}>
          <X className="size-3" />
        </Button>
      </div>
      <div className="p-2">
        {!result ? (
          <p className="text-xs text-muted-foreground italic">Not evaluated yet</p>
        ) : result.error ? (
          <p className="text-xs text-destructive">{result.error}</p>
        ) : display !== null && typeof display === 'object' ? (
          <JsonViewer data={display} defaultExpanded maxDepth={3} />
        ) : (
          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-foreground">
            {String(display)}
          </pre>
        )}
      </div>
      <div className="flex items-center border-t px-3 py-1">
        <code className="flex-1 truncate text-[10px] text-muted-foreground">{expr.expression}</code>
        {snapshots.length > 0 && (
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            {historyOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>
      {historyOpen && (
        <SnapshotTimeline snapshots={snapshots} onDelete={onDeleteSnapshot} />
      )}
    </div>
  );
}

export default function DataViewer() {
  const [expressions, setExpressions] = useState<WatchExpression[]>(defaultExpressions);
  const [results, setResults] = useState<Record<string, EvalResult>>({});
  const [newExpr, setNewExpr] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [snapshotMap, setSnapshotMap] = useState<SnapshotMap>({});

  useEffect(() => {
    storageGet<SnapshotMap>(STORAGE_KEY_SNAPSHOTS, {}).then(setSnapshotMap);
  }, []);

  const persistSnapshots = useCallback((next: SnapshotMap) => {
    // Limit per expression
    const limited: SnapshotMap = {};
    for (const [k, v] of Object.entries(next)) {
      limited[k] = v.slice(0, MAX_SNAPSHOTS);
    }
    setSnapshotMap(limited);
    storageSet(STORAGE_KEY_SNAPSHOTS, limited);
  }, []);

  const takeExprSnapshot = useCallback(
    (expr: WatchExpression) => {
      const r = results[expr.id];
      const snap: Snapshot = {
        id: `snap-${Date.now()}`,
        timestamp: Date.now(),
        label: expr.label ?? expr.expression,
        entries: [
          {
            expressionId: expr.id,
            expression: expr.expression,
            label: expr.label,
            value: r?.value ?? null,
            error: r?.error,
          },
        ],
      };
      const prev = snapshotMap[expr.id] ?? [];
      persistSnapshots({ ...snapshotMap, [expr.id]: [snap, ...prev] });
    },
    [results, snapshotMap, persistSnapshots],
  );

  const deleteSnapshot = useCallback(
    (exprId: string, snapId: string) => {
      const prev = snapshotMap[exprId] ?? [];
      persistSnapshots({ ...snapshotMap, [exprId]: prev.filter((s) => s.id !== snapId) });
    },
    [snapshotMap, persistSnapshots],
  );

  const takeAllSnapshots = useCallback(() => {
    const next = { ...snapshotMap };
    for (const expr of expressions) {
      const r = results[expr.id];
      const snap: Snapshot = {
        id: `snap-${Date.now()}-${expr.id}`,
        timestamp: Date.now(),
        label: expr.label ?? expr.expression,
        entries: [
          {
            expressionId: expr.id,
            expression: expr.expression,
            label: expr.label,
            value: r?.value ?? null,
            error: r?.error,
          },
        ],
      };
      next[expr.id] = [snap, ...(next[expr.id] ?? [])];
    }
    persistSnapshots(next);
  }, [expressions, results, snapshotMap, persistSnapshots]);

  const evaluateAll = useCallback(async () => {
    const newResults: Record<string, EvalResult> = {};
    for (const expr of expressions) {
      const { value, error } = await evalInPage(expr.expression);
      newResults[expr.id] = { value, error, updatedAt: Date.now() };
    }
    setResults(newResults);
  }, [expressions]);

  const evaluateOne = useCallback(async (expr: WatchExpression) => {
    const { value, error } = await evalInPage(expr.expression);
    setResults((prev) => ({
      ...prev,
      [expr.id]: { value, error, updatedAt: Date.now() },
    }));
  }, []);

  useEffect(() => {
    const run = autoRefresh
      ? setInterval(evaluateAll, 2000)
      : undefined;

    const initial = setTimeout(evaluateAll, 0);

    return () => {
      clearTimeout(initial);
      if (run) clearInterval(run);
    };
  }, [autoRefresh, evaluateAll]);

  const addExpression = () => {
    const trimmed = newExpr.trim();
    if (!trimmed) return;
    const expr: WatchExpression = {
      id: `custom-${Date.now()}`,
      expression: trimmed,
      label: newLabel.trim() || undefined,
    };
    setExpressions((prev) => [...prev, expr]);
    setNewExpr('');
    setNewLabel('');
    evaluateOne(expr);
  };

  const removeExpression = (id: string) => {
    setExpressions((prev) => prev.filter((e) => e.id !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
        <h3 className="text-xs font-semibold text-muted-foreground">Watch Expressions</h3>
        <Badge variant="outline" className="h-4 rounded px-1 text-[10px]">
          {expressions.length}
        </Badge>
        <div className="flex-1" />
        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          size="xs"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          <RefreshCw className={cn('size-3', autoRefresh && 'animate-spin')} />
          {autoRefresh ? 'Auto' : 'Manual'}
        </Button>
        <Button variant="outline" size="xs" onClick={evaluateAll}>
          Refresh All
        </Button>
        <Button variant="outline" size="xs" onClick={takeAllSnapshots}>
          <Camera className="mr-1 size-3" />
          Snapshot All
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col gap-2 p-3">
          {expressions.map((expr) => (
            <WatchCard
              key={expr.id}
              expr={expr}
              result={results[expr.id]}
              snapshots={snapshotMap[expr.id] ?? []}
              onRefresh={() => evaluateOne(expr)}
              onRemove={() => removeExpression(expr.id)}
              onSnapshot={() => takeExprSnapshot(expr)}
              onDeleteSnapshot={(snapId) => deleteSnapshot(expr.id, snapId)}
            />
          ))}

          <div className="rounded-md border border-dashed bg-card/50 p-3">
            <div className="flex items-center gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (optional)"
                className="h-6 flex-[0_0_120px] text-xs"
              />
              <Input
                value={newExpr}
                onChange={(e) => setNewExpr(e.target.value)}
                placeholder="JavaScript expression..."
                className="h-6 flex-1 font-mono text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addExpression()}
              />
              <Button variant="outline" size="icon-xs" onClick={addExpression}>
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
