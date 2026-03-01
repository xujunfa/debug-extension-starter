import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Search, ArrowDown, Save, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageGet, storageSet } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SplitPane } from '@/components/layout/split-pane';
import { KvDisplay } from '@/components/debug/kv-display';
import { JsonViewer, type JsonValue, type HighlightRule } from '@/components/debug/json-viewer';
import {
  type NetworkEntry,
  type View,
  STORAGE_KEY_VIEWS,
  STORAGE_KEY_HIGHLIGHT_RULES,
  parseHarEntry,
  formatBytes,
} from './config';

const statusColor = (status: number) => {
  if (status < 300) return 'text-green-600 dark:text-green-400';
  if (status < 400) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

function HighlightTagBar({
  rules,
  onUpdate,
}: {
  rules: HighlightRule[];
  onUpdate: (rules: HighlightRule[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState('');

  const addRule = () => {
    const key = newKey.trim();
    if (!key) return;
    const rule: HighlightRule = { id: `hl-${Date.now()}`, key, enabled: true };
    onUpdate([...rules, rule]);
    setNewKey('');
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 px-2 py-1">
      <span className="text-[10px] font-medium text-muted-foreground">Highlight:</span>
      {rules.map((rule) => (
        <Badge
          key={rule.id}
          variant={rule.enabled ? 'default' : 'outline'}
          className="h-5 cursor-pointer gap-1 rounded-full px-2 text-[10px]"
          onClick={() =>
            onUpdate(rules.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)))
          }
        >
          {rule.key}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(rules.filter((r) => r.id !== rule.id));
            }}
            className="ml-0.5 opacity-60 hover:opacity-100"
          >
            <X className="size-2.5" />
          </button>
        </Badge>
      ))}
      {adding ? (
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addRule();
            if (e.key === 'Escape') setAdding(false);
          }}
          onBlur={() => {
            if (newKey.trim()) addRule();
            else setAdding(false);
          }}
          placeholder="key name"
          className="h-5 w-24 px-1 text-[10px]"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex size-5 items-center justify-center rounded-full border border-dashed text-muted-foreground hover:bg-accent"
        >
          <Plus className="size-3" />
        </button>
      )}
    </div>
  );
}

function RequestDetail({ entry }: { entry: NetworkEntry }) {
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'headers' | 'request' | 'response'>('headers');
  const [highlightRules, setHighlightRules] = useState<HighlightRule[]>([]);

  useEffect(() => {
    storageGet<HighlightRule[]>(STORAGE_KEY_HIGHLIGHT_RULES, []).then(setHighlightRules);
  }, []);

  const updateHighlightRules = useCallback((rules: HighlightRule[]) => {
    setHighlightRules(rules);
    storageSet(STORAGE_KEY_HIGHLIGHT_RULES, rules);
  }, []);

  const loadResponseBody = useCallback(() => {
    setActiveTab('response');
    if (responseBody !== null) return;
    // entry object from HAR has getContent method on the original request object
    // but we already parsed it, so we mark it as loaded
    setResponseBody(entry.responseBody ?? '(no body)');
  }, [entry.responseBody, responseBody]);

  const headerItems = [
    { key: 'URL', value: entry.url, highlight: true },
    { key: 'Method', value: entry.method },
    { key: 'Status', value: `${entry.status} ${entry.statusText}` },
    { key: 'Type', value: entry.type },
    { key: 'Size', value: formatBytes(entry.size) },
    { key: 'Time', value: `${entry.time} ms` },
  ];

  const requestHeaderItems = Object.entries(entry.requestHeaders).map(
    ([key, value]) => ({ key, value }),
  );

  const responseHeaderItems = Object.entries(entry.responseHeaders).map(
    ([key, value]) => ({ key, value }),
  );

  let parsedBody: JsonValue | null = null;
  const bodyText = activeTab === 'request' ? entry.requestBody : responseBody;
  if (bodyText) {
    try {
      parsedBody = JSON.parse(bodyText) as JsonValue;
    } catch {
      // not JSON
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-1 border-b bg-muted/30 px-2 py-1">
        {(['headers', 'request', 'response'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => (tab === 'response' ? loadResponseBody() : setActiveTab(tab))}
            className={cn(
              'rounded px-2 py-0.5 text-xs font-medium capitalize transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {activeTab === 'headers' && (
            <div className="flex flex-col gap-2">
              <KvDisplay items={headerItems} />
              {requestHeaderItems.length > 0 && (
                <KvDisplay
                  groups={[{ title: 'Request Headers', items: requestHeaderItems }]}
                />
              )}
              {responseHeaderItems.length > 0 && (
                <KvDisplay
                  groups={[{ title: 'Response Headers', items: responseHeaderItems, defaultCollapsed: true }]}
                />
              )}
            </div>
          )}

          {activeTab === 'request' && (
            entry.requestBody ? (
              parsedBody ? (
                <JsonViewer data={parsedBody} />
              ) : (
                <pre className="whitespace-pre-wrap break-all rounded-md border bg-card p-2 font-mono text-xs">
                  {entry.requestBody}
                </pre>
              )
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground italic">
                No request body
              </p>
            )
          )}

          {activeTab === 'response' && (
            <>
              <HighlightTagBar rules={highlightRules} onUpdate={updateHighlightRules} />
              {responseBody ? (
                parsedBody ? (
                  <JsonViewer data={parsedBody} highlightKeys={highlightRules} />
                ) : (
                  <pre className="whitespace-pre-wrap break-all rounded-md border bg-card p-2 font-mono text-xs">
                    {responseBody}
                  </pre>
                )
              ) : (
                <p className="py-4 text-center text-xs text-muted-foreground italic">
                  Loading...
                </p>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function applyFilter(entries: NetworkEntry[], pattern: string, filterType: 'contains' | 'regex'): NetworkEntry[] {
  if (!pattern) return entries;
  if (filterType === 'regex') {
    try {
      const re = new RegExp(pattern, 'i');
      return entries.filter((e) => re.test(e.url) || re.test(e.method));
    } catch {
      return entries;
    }
  }
  const lower = pattern.toLowerCase();
  return entries.filter(
    (e) => e.url.toLowerCase().includes(lower) || e.method.toLowerCase().includes(lower),
  );
}

export default function NetworkPanel() {
  const [entries, setEntries] = useState<NetworkEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState<'contains' | 'regex'>('contains');
  const [selected, setSelected] = useState<NetworkEntry | null>(null);
  const [recording, setRecording] = useState(true);
  const entriesRef = useRef<NetworkEntry[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  useEffect(() => {
    storageGet<View[]>(STORAGE_KEY_VIEWS, []).then(setViews);
  }, []);

  const persistViews = useCallback((next: View[]) => {
    setViews(next);
    storageSet(STORAGE_KEY_VIEWS, next);
  }, []);

  const saveView = useCallback(() => {
    if (!filter.trim()) return;
    const view: View = {
      id: `view-${Date.now()}`,
      name: filter.trim(),
      filterType,
      pattern: filter.trim(),
    };
    persistViews([...views, view]);
  }, [filter, filterType, views, persistViews]);

  const deleteView = useCallback(
    (id: string) => {
      persistViews(views.filter((v) => v.id !== id));
      if (activeViewId === id) setActiveViewId(null);
    },
    [views, activeViewId, persistViews],
  );

  const toggleView = useCallback(
    (view: View) => {
      if (activeViewId === view.id) {
        setActiveViewId(null);
        setFilter('');
        setFilterType('contains');
      } else {
        setActiveViewId(view.id);
        setFilter(view.pattern);
        setFilterType(view.filterType);
      }
    },
    [activeViewId],
  );

  useEffect(() => {
    const handler = (request: chrome.devtools.network.Request) => {
      if (!recording) return;
      const entry = parseHarEntry(request);

      request.getContent((content) => {
        if (content) {
          entry.responseBody = content;
        }
      });

      entriesRef.current = [...entriesRef.current, entry];
      setEntries(entriesRef.current);
    };

    chrome.devtools.network.onRequestFinished.addListener(handler);
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(handler);
    };
  }, [recording]);

  const filtered = applyFilter(entries, filter, filterType);

  const handleClear = () => {
    entriesRef.current = [];
    setEntries([]);
    setSelected(null);
  };

  const list = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-muted/30">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setActiveViewId(null);
              }}
              placeholder="Filter by URL or method..."
              className="h-6 pl-7 text-xs"
            />
          </div>
          <button
            onClick={() => setFilterType(filterType === 'contains' ? 'regex' : 'contains')}
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
              filterType === 'regex'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {filterType === 'regex' ? '.*' : 'Aa'}
          </button>
          <Button variant="outline" size="icon-xs" onClick={saveView} disabled={!filter.trim()}>
            <Save className="size-3" />
          </Button>
          <Button
            variant={recording ? 'destructive' : 'outline'}
            size="xs"
            onClick={() => setRecording(!recording)}
          >
            {recording ? 'Pause' : 'Record'}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={handleClear}>
            <Trash2 className="size-3" />
          </Button>
        </div>
        {views.length > 0 && (
          <div className="flex flex-wrap gap-1 px-2 pb-1.5">
            {views.map((view) => (
              <Badge
                key={view.id}
                variant={activeViewId === view.id ? 'default' : 'outline'}
                className="h-5 cursor-pointer gap-1 rounded-full px-2 text-[10px]"
                onClick={() => toggleView(view)}
              >
                {view.filterType === 'regex' && <span className="opacity-60">.*</span>}
                {view.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteView(view.id);
                  }}
                  className="ml-0.5 opacity-60 hover:opacity-100"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 grid grid-cols-[60px_1fr_60px_60px_60px] gap-1 border-b bg-muted/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Method</span>
        <span>URL</span>
        <span className="text-right">Status</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-8 text-muted-foreground">
            <ArrowDown className="size-5" />
            <p className="text-xs">
              {entries.length === 0
                ? 'Waiting for network requests...'
                : 'No matching requests'}
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelected(entry)}
              className={cn(
                'grid w-full grid-cols-[60px_1fr_60px_60px_60px] gap-1 border-b border-border/30 px-2 py-1 text-left text-xs transition-colors hover:bg-accent/50',
                selected?.id === entry.id && 'bg-accent',
              )}
            >
              <span className="font-medium">{entry.method}</span>
              <span className="truncate text-muted-foreground">
                {new URL(entry.url).pathname}
              </span>
              <span className={cn('text-right font-mono', statusColor(entry.status))}>
                {entry.status}
              </span>
              <span className="text-right text-muted-foreground">
                {formatBytes(entry.size)}
              </span>
              <span className="text-right text-muted-foreground">
                {entry.time}ms
              </span>
            </button>
          ))
        )}
      </ScrollArea>

      <div className="shrink-0 border-t bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground">
        {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        {filter && ` (${entries.length} total)`}
      </div>
    </div>
  );

  if (!selected) return list;

  return (
    <SplitPane
      left={list}
      right={<RequestDetail key={selected.id} entry={selected} />}
      defaultRatio={45}
    />
  );
}
