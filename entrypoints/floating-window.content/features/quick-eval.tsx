import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Trash2, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageGet, storageSet } from '@/lib/storage';
import { sendRequest } from '@/lib/messaging/request';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonViewer, type JsonValue } from '@/components/debug/json-viewer';

/* ── Types ── */

interface HistoryEntry {
  id: string;
  expression: string;
  result?: unknown;
  error?: string;
  timestamp: number;
}

const STORAGE_KEY = 'quick-eval-history';
const MAX_HISTORY = 20;

/* ── Result Display ── */

function ResultDisplay({ entry }: { entry: HistoryEntry }) {
  if (entry.error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 font-mono text-[11px] text-destructive">
        {entry.error}
      </div>
    );
  }

  const result = entry.result;

  if (result === undefined) {
    return (
      <span className="font-mono text-[11px] text-muted-foreground italic">undefined</span>
    );
  }

  if (result !== null && typeof result === 'object') {
    return (
      <JsonViewer
        data={result as JsonValue}
        defaultExpanded
        maxDepth={3}
        className="border-none bg-transparent p-0"
      />
    );
  }

  return (
    <span
      className={cn(
        'font-mono text-[11px]',
        typeof result === 'string' && 'text-green-600 dark:text-green-400',
        typeof result === 'number' && 'text-blue-600 dark:text-blue-400',
        typeof result === 'boolean' && 'text-purple-600 dark:text-purple-400',
        result === null && 'text-muted-foreground italic',
      )}
    >
      {result === null ? 'null' : typeof result === 'string' ? `"${result}"` : String(result)}
    </span>
  );
}

/* ── History Item ── */

function HistoryItem({
  entry,
  onReuse,
}: {
  entry: HistoryEntry;
  onReuse: (expr: string) => void;
}) {
  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="group rounded-md border bg-card px-2 py-1.5">
      <div className="flex items-center gap-1">
        <Clock className="size-2.5 shrink-0 text-muted-foreground/50" />
        <span className="text-[10px] text-muted-foreground">{timeStr}</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon-xs"
          className="size-4 opacity-0 group-hover:opacity-100"
          onClick={() => onReuse(entry.expression)}
          title="Reuse expression"
        >
          <RotateCcw className="size-2.5" />
        </Button>
      </div>
      <div className="mt-0.5 truncate font-mono text-[11px] text-foreground/80">
        {entry.expression}
      </div>
      <div className="mt-1">
        <ResultDisplay entry={entry} />
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function QuickEval() {
  const [expression, setExpression] = useState('');
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const tabIdRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resolve tabId
  useEffect(() => {
    sendRequest('GET_TAB_ID', {}).then(({ tabId }) => {
      tabIdRef.current = tabId;
    });
  }, []);

  // Load history
  useEffect(() => {
    storageGet<HistoryEntry[]>(STORAGE_KEY, []).then((saved) => {
      setHistory(saved);
      setLoaded(true);
    });
  }, []);

  const persistHistory = useCallback((next: HistoryEntry[]) => {
    setHistory(next);
    storageSet(STORAGE_KEY, next);
  }, []);

  const runExpression = useCallback(async () => {
    const expr = expression.trim();
    if (!expr || running) return;

    const tabId = tabIdRef.current;
    if (tabId == null) return;

    setRunning(true);
    try {
      const res = await sendRequest('EVAL_IN_PAGE', { tabId, expression: expr });
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        expression: expr,
        result: res.success ? res.result : undefined,
        error: res.success ? undefined : res.error,
        timestamp: Date.now(),
      };
      persistHistory([entry, ...history].slice(0, MAX_HISTORY));
    } catch (e) {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        expression: expr,
        error: (e as Error).message,
        timestamp: Date.now(),
      };
      persistHistory([entry, ...history].slice(0, MAX_HISTORY));
    } finally {
      setRunning(false);
    }
  }, [expression, running, history, persistHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      runExpression();
    }
  };

  const reuseExpression = (expr: string) => {
    setExpression(expr);
    textareaRef.current?.focus();
  };

  const clearHistory = () => {
    persistHistory([]);
  };

  if (!loaded) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Input area */}
      <div className="shrink-0 border-b bg-muted/30 p-2">
        <textarea
          ref={textareaRef}
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter JavaScript expression..."
          className="w-full resize-none rounded-md border bg-background px-2 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
        />
        <div className="mt-1 flex items-center gap-1.5">
          <Button
            variant="default"
            size="xs"
            onClick={runExpression}
            disabled={!expression.trim() || running}
          >
            <Play className="mr-0.5 size-2.5" />
            {running ? 'Running...' : 'Run'}
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter
          </span>
          <div className="flex-1" />
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={clearHistory}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-0.5 size-2.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* History */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1.5 p-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-[11px]">No execution history</p>
              <p className="text-[10px]">Run an expression to see results here</p>
            </div>
          ) : (
            history.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onReuse={reuseExpression}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
