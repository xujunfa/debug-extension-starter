import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Eye, EyeOff, Hash, Activity, Pause, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SplitPane } from '@/components/layout/split-pane';
import { KvDisplay, type KvItem } from '@/components/debug/kv-display';
import {
  type ElementInfo,
  type QueryResult,
  type TimelineEvent,
  queryElements,
  highlightElements,
  clearHighlight,
  injectMonitor,
  readTimeline,
  cleanupMonitor,
} from './config';

function ElementCard({
  element,
  index,
  monitoringIndex,
  onMonitor,
}: {
  element: ElementInfo;
  index: number;
  monitoringIndex: number | null;
  onMonitor: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const summaryItems: KvItem[] = [
    { key: 'Tag', value: element.tagName },
    ...(element.id ? [{ key: 'ID', value: `#${element.id}`, highlight: true }] : []),
    ...(element.classNames.length > 0
      ? [{ key: 'Classes', value: element.classNames.map((c) => `.${c}`).join(' ') }]
      : []),
    { key: 'Size', value: `${element.rect.width} x ${element.rect.height}` },
    { key: 'Position', value: `(${element.rect.left}, ${element.rect.top})` },
    { key: 'Children', value: String(element.childCount) },
  ];

  const attrItems: KvItem[] = Object.entries(element.attributes).map(([key, value]) => ({
    key,
    value,
  }));

  const styleItems: KvItem[] = Object.entries(element.computedStyles)
    .filter(([, v]) => v && v !== 'none' && v !== 'normal' && v !== 'auto')
    .map(([key, value]) => ({ key, value }));

  const isMonitored = monitoringIndex === index;

  return (
    <div className={cn('rounded-md border bg-card', isMonitored && 'ring-2 ring-primary/50')}>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:bg-accent/50"
        >
          <Badge variant="outline" className="h-4 shrink-0 rounded px-1 font-mono text-[10px]">
            {index + 1}
          </Badge>
          <code className="flex-1 truncate text-xs">
            <span className="text-blue-600 dark:text-blue-400">{element.tagName}</span>
            {element.id && (
              <span className="text-green-600 dark:text-green-400">#{element.id}</span>
            )}
            {element.classNames.slice(0, 3).map((c) => (
              <span key={c} className="text-yellow-600 dark:text-yellow-400">.{c}</span>
            ))}
          </code>
          <span className="text-[10px] text-muted-foreground">
            {element.rect.width}x{element.rect.height}
          </span>
        </button>
        <Button
          variant={isMonitored ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => onMonitor(index)}
          title={isMonitored ? 'Monitoring this element' : 'Monitor this element'}
        >
          <Activity className="size-3" />
        </Button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 border-t p-2">
          <KvDisplay items={summaryItems} />

          {element.textContent && (
            <div className="rounded-md border p-2">
              <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                Text Content
              </p>
              <p className="text-xs text-foreground/80">{element.textContent}</p>
            </div>
          )}

          {attrItems.length > 0 && (
            <KvDisplay
              groups={[{ title: 'Attributes', items: attrItems }]}
            />
          )}

          {styleItems.length > 0 && (
            <KvDisplay
              groups={[{ title: 'Computed Styles', items: styleItems, defaultCollapsed: true }]}
            />
          )}
        </div>
      )}
    </div>
  );
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  attribute: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  style: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  resize: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  position: 'bg-green-500/15 text-green-700 dark:text-green-300',
  removed: 'bg-red-500/15 text-red-700 dark:text-red-300',
};

export default function DomInspector() {
  const [selector, setSelector] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [highlighting, setHighlighting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [monitoringIndex, setMonitoringIndex] = useState<number | null>(null);
  const [monitoredDesc, setMonitoredDesc] = useState('');
  const [paused, setPaused] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set(['attribute', 'style', 'resize', 'position', 'removed']));
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleQuery = useCallback(async () => {
    const trimmed = selector.trim();
    if (!trimmed) return;

    setLoading(true);
    const queryResult = await queryElements(trimmed);
    setResult(queryResult);
    setLoading(false);

    if (highlighting) {
      await highlightElements(trimmed);
    }
  }, [selector, highlighting]);

  const toggleHighlight = useCallback(async () => {
    const next = !highlighting;
    setHighlighting(next);
    if (next && result && !result.error) {
      await highlightElements(selector);
    } else {
      await clearHighlight();
    }
  }, [highlighting, result, selector]);

  const startMonitor = useCallback(async (elementIdx: number) => {
    if (!selector.trim() || !result || result.error) return;
    const desc = await injectMonitor(selector, elementIdx);
    setMonitoring(true);
    setMonitoringIndex(elementIdx);
    setMonitoredDesc(desc);
    setPaused(false);
    setTimeline([]);
  }, [selector, result]);

  const stopMonitor = useCallback(async () => {
    setMonitoring(false);
    setMonitoringIndex(null);
    setMonitoredDesc('');
    setPaused(false);
    await cleanupMonitor();
  }, []);

  useEffect(() => {
    if (monitoring && !paused) {
      pollRef.current = setInterval(async () => {
        const events = await readTimeline();
        if (events.length > 0) {
          setTimeline((prev) => [...prev, ...events]);
          // If a "removed" event was detected, refresh the query list
          if (events.some((e) => e.type === 'removed')) {
            const queryResult = await queryElements(selector);
            setResult(queryResult);
          }
        }
      }, 500);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [monitoring, paused, selector]);

  useEffect(() => {
    return () => {
      clearHighlight();
      cleanupMonitor();
    };
  }, []);

  const filteredTimeline = timeline.filter((e) => typeFilter.has(e.type));

  const toggleType = (type: string) => {
    const next = new Set(typeFilter);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setTypeFilter(next);
  };

  const queryPanel = (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder="CSS selector (e.g., .class, #id, div > span)"
            className="h-7 pl-7 font-mono text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
        </div>
        <Button variant="default" size="xs" onClick={handleQuery} disabled={loading || !selector.trim()}>
          {loading ? 'Querying...' : 'Query'}
        </Button>
        <Button
          variant={highlighting ? 'default' : 'outline'}
          size="icon-xs"
          onClick={toggleHighlight}
          title={highlighting ? 'Disable highlight' : 'Enable highlight'}
        >
          {highlighting ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
        </Button>
        {monitoring && (
          <Button variant="destructive" size="xs" onClick={stopMonitor}>
            <Activity className="mr-1 size-3" />
            Stop
          </Button>
        )}
      </div>

      {result && (
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1">
          <Hash className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">{result.count}</strong> element
            {result.count !== 1 ? 's' : ''} matched
          </span>
          <code className="text-[10px] text-muted-foreground">{result.selector}</code>
        </div>
      )}

      <ScrollArea className="flex-1">
        {!result ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Search className="size-8 opacity-30" />
            <p className="text-xs">Enter a CSS selector to inspect elements</p>
          </div>
        ) : result.error ? (
          <div className="p-4">
            <p className="text-xs text-destructive">{result.error}</p>
          </div>
        ) : result.elements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <p className="text-xs">No elements found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 p-3">
            {result.elements.map((element, i) => (
              <ElementCard
                key={i}
                element={element}
                index={i}
                monitoringIndex={monitoringIndex}
                onMonitor={(idx) => startMonitor(idx)}
              />
            ))}
            {result.count > result.elements.length && (
              <p className="py-2 text-center text-[10px] text-muted-foreground">
                Showing {result.elements.length} of {result.count} elements
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const timelinePanel = (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-2 py-1.5">
        <Activity className="size-3 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">Timeline</span>
        {monitoredDesc && (
          <code className="truncate rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium">
            {monitoredDesc}
          </code>
        )}
        <Badge variant="outline" className="h-4 rounded px-1 text-[10px]">
          {filteredTimeline.length}
        </Badge>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setPaused(!paused)}
          title={paused ? 'Resume' : 'Pause'}
        >
          {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={() => setTimeline([])}>
          <Trash2 className="size-3" />
        </Button>
      </div>
      <div className="flex shrink-0 flex-wrap gap-1 border-b px-2 py-1">
        {(['attribute', 'style', 'resize', 'position', 'removed'] as const).map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
              typeFilter.has(type) ? EVENT_TYPE_COLORS[type] : 'bg-muted text-muted-foreground/50',
            )}
          >
            {type}
          </button>
        ))}
      </div>
      <ScrollArea className="flex-1">
        {filteredTimeline.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground italic">
            {monitoring ? 'Waiting for changes...' : 'Start monitoring to capture changes'}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 p-2">
            {filteredTimeline.map((event, i) => (
              <div key={i} className={cn('rounded-md border bg-card px-2 py-1', event.type === 'removed' && 'border-red-500/50')}>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('h-4 rounded px-1 text-[10px]', EVENT_TYPE_COLORS[event.type])}
                  >
                    {event.type}
                  </Badge>
                  <span className="flex-1 truncate font-mono text-[10px]">
                    <span className="text-muted-foreground">{event.elementDesc}</span>
                    {' '}
                    {event.detail.property}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.type !== 'removed' && (
                  <div className="mt-1 flex flex-col gap-0.5 font-mono text-[10px]">
                    <div className="truncate rounded bg-red-500/10 px-1 text-red-700 dark:text-red-300">
                      - {event.detail.before}
                    </div>
                    <div className="truncate rounded bg-green-500/10 px-1 text-green-700 dark:text-green-300">
                      + {event.detail.after}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (!monitoring && timeline.length === 0) return queryPanel;

  return (
    <SplitPane
      left={queryPanel}
      right={timelinePanel}
      direction="vertical"
      defaultRatio={55}
    />
  );
}
