import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Play,
  Square,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { highlightText } from '@/lib/highlight';
import { connectToBackground, eventBus } from '@/lib/messaging/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { SplitPane } from '@/components/layout/split-pane';
import { JsonViewer, type JsonValue } from '@/components/debug/json-viewer';
import { injectWsMonitor, cleanupWsMonitor } from './injector';
import {
  type WsConnection,
  type WsMessage,
  type WsMonitorPayload,
  nextConnectionColor,
  resetColorIndex,
  formatTimestamp,
  formatSize,
  truncateMessage,
} from './config';

function applyFilter(
  messages: WsMessage[],
  pattern: string,
  filterType: 'contains' | 'regex',
): WsMessage[] {
  if (!pattern) return messages;
  if (filterType === 'regex') {
    try {
      const re = new RegExp(pattern, 'i');
      return messages.filter((m) => re.test(m.data));
    } catch {
      return messages;
    }
  }
  const lower = pattern.toLowerCase();
  return messages.filter((m) => m.data.toLowerCase().includes(lower));
}

function MessageDetail({
  message,
  filter,
  filterType,
}: {
  message: WsMessage;
  filter?: string;
  filterType?: 'contains' | 'regex';
}) {
  const [copied, setCopied] = useState(false);

  let parsed: JsonValue | null = null;
  try {
    parsed = JSON.parse(message.data) as JsonValue;
  } catch {
    // not JSON
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message.data]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={message.direction === 'sent' ? 'text-blue-500' : 'text-green-500'}>
            {message.direction === 'sent' ? 'Sent' : 'Received'}
          </span>
          <span>{formatTimestamp(message.timestamp)}</span>
          <span>{formatSize(message.size)}</span>
          <button
            onClick={handleCopy}
            className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="size-3 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          {parsed ? (
            <JsonViewer data={parsed} searchText={filter} />
          ) : (
            <pre className="whitespace-pre-wrap break-all rounded-md border bg-card p-2 font-mono text-xs">
              {filter ? highlightText(message.data, filter, filterType) : message.data}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WsMonitor() {
  const [running, setRunning] = useState(false);
  const [connections, setConnections] = useState<WsConnection[]>([]);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [selectedConnIds, setSelectedConnIds] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<WsMessage | null>(null);
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState<'contains' | 'regex'>('contains');
  const [connectionsCollapsed, setConnectionsCollapsed] = useState(false);
  const [directionFilter, setDirectionFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  const connectionsRef = useRef<WsConnection[]>([]);
  const messagesRef = useRef<WsMessage[]>([]);
  const runningRef = useRef(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  const tabId = chrome.devtools.inspectedWindow.tabId;

  // Keep refs in sync
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  // Connect to background event bus
  useEffect(() => {
    const { disconnect } = connectToBackground(tabId);

    const unsub = eventBus.on('WS_MONITOR_EVENT', (data: WsMonitorPayload) => {
      if (!runningRef.current) return;

      if (data.type === 'ws:connect') {
        const conn: WsConnection = {
          id: data.connectionId,
          url: data.url ?? '',
          status: 'open',
          openedAt: data.timestamp,
          color: nextConnectionColor(),
        };
        connectionsRef.current = [...connectionsRef.current, conn];
        setConnections(connectionsRef.current);
      } else if (data.type === 'ws:message') {
        const msg: WsMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          connectionId: data.connectionId,
          direction: data.direction ?? 'received',
          data: data.data ?? '',
          timestamp: data.timestamp,
          size: data.size ?? 0,
        };
        messagesRef.current = [...messagesRef.current, msg];
        setMessages(messagesRef.current);
      } else if (data.type === 'ws:close') {
        connectionsRef.current = connectionsRef.current.map((c) =>
          c.id === data.connectionId
            ? {
                ...c,
                status: 'closed' as const,
                closedAt: data.timestamp,
                closeCode: data.closeCode,
                closeReason: data.closeReason,
              }
            : c,
        );
        setConnections(connectionsRef.current);
      }
    });

    return () => {
      unsub();
      disconnect();
    };
  }, [tabId]);

  const handleStart = useCallback(async () => {
    const result = await injectWsMonitor();
    if (result === 'injected' || result === 'already_injected') {
      setRunning(true);
    }
  }, []);

  const handleStop = useCallback(async () => {
    setRunning(false);
    await cleanupWsMonitor();
  }, []);

  const handleClear = useCallback(() => {
    connectionsRef.current = [];
    messagesRef.current = [];
    setConnections([]);
    setMessages([]);
    setSelectedConnIds(new Set());
    setSelectedMessage(null);
    resetColorIndex();
  }, []);

  const toggleConnection = useCallback(
    (connId: string, event: React.MouseEvent) => {
      setSelectedConnIds((prev) => {
        const next = new Set(prev);
        if (event.metaKey || event.ctrlKey) {
          // Multi-select toggle
          if (next.has(connId)) next.delete(connId);
          else next.add(connId);
        } else {
          // Single select
          if (next.size === 1 && next.has(connId)) {
            next.clear(); // Deselect → show all
          } else {
            next.clear();
            next.add(connId);
          }
        }
        return next;
      });
    },
    [],
  );

  const selectAll = useCallback(() => {
    setSelectedConnIds(new Set());
  }, []);

  // Filter messages: connections → direction → text
  const connFiltered =
    selectedConnIds.size === 0
      ? messages
      : messages.filter((m) => selectedConnIds.has(m.connectionId));
  const dirFiltered =
    directionFilter === 'all'
      ? connFiltered
      : connFiltered.filter((m) => m.direction === directionFilter);
  const filtered = applyFilter(dirFiltered, filter, filterType);

  const connectionMap = new Map(connections.map((c) => [c.id, c]));

  // Per-connection message count
  const connMsgCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of messages) {
      map.set(m.connectionId, (map.get(m.connectionId) ?? 0) + 1);
    }
    return map;
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!autoScroll || filtered.length === 0) return;
    requestAnimationFrame(() => {
      const el = messageListRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [filtered.length, autoScroll]);

  const list = (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="shrink-0 border-b bg-muted/30">
        <div className="flex items-center gap-2 px-2 py-1.5">
          {running ? (
            <Button variant="destructive" size="xs" onClick={handleStop}>
              <Square className="mr-1 size-3" />
              Stop
            </Button>
          ) : (
            <Button variant="default" size="xs" onClick={handleStart}>
              <Play className="mr-1 size-3" />
              Start
            </Button>
          )}
          <Button variant="ghost" size="icon-xs" onClick={handleClear}>
            <Trash2 className="size-3" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setDirectionFilter(directionFilter === 'sent' ? 'all' : 'sent')}
                  className={cn(
                    'shrink-0 rounded p-1 transition-colors',
                    directionFilter === 'sent'
                      ? 'bg-blue-500/15 text-blue-500'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  <ArrowUp className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Sent only</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setDirectionFilter(directionFilter === 'received' ? 'all' : 'received')}
                  className={cn(
                    'shrink-0 rounded p-1 transition-colors',
                    directionFilter === 'received'
                      ? 'bg-green-500/15 text-green-500'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  <ArrowDown className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Received only</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter messages..."
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
        </div>
      </div>

      {/* Connection list */}
      <div className="shrink-0 border-b">
        <button
          onClick={() => setConnectionsCollapsed(!connectionsCollapsed)}
          className="flex w-full items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent/50"
        >
          {connectionsCollapsed ? (
            <ChevronRight className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
          Connections ({connections.length})
        </button>
        {!connectionsCollapsed && (
          <div className="max-h-32 overflow-auto px-1 pb-1">
            <button
              onClick={selectAll}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-0.5 text-xs transition-colors hover:bg-accent/50',
                selectedConnIds.size === 0 && 'bg-accent',
              )}
            >
              <span className="text-muted-foreground">All</span>
            </button>
            {connections.map((conn) => (
              <button
                key={conn.id}
                onClick={(e) => toggleConnection(conn.id, e)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-0.5 text-xs transition-colors hover:bg-accent/50',
                  selectedConnIds.has(conn.id) && 'bg-accent',
                )}
              >
                {conn.status === 'open' ? (
                  <span className="relative inline-flex size-2.5 shrink-0">
                    <span
                      className="absolute inset-0 animate-ping rounded-full opacity-75"
                      style={{ backgroundColor: conn.color }}
                    />
                    <span
                      className="relative inline-flex size-2.5 rounded-full"
                      style={{ backgroundColor: conn.color }}
                    />
                  </span>
                ) : (
                  <span className="inline-flex size-2.5 shrink-0 rounded-full border border-muted-foreground/40 bg-muted-foreground/50" />
                )}
                <span className="truncate text-muted-foreground">
                  {filter
                    ? highlightText(conn.url.replace(/^wss?:\/\//, ''), filter, filterType)
                    : conn.url.replace(/^wss?:\/\//, '')}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground/60">
                  {connMsgCount.get(conn.id) ?? 0}
                </span>
                <Badge
                  variant="outline"
                  className="ml-auto h-4 shrink-0 rounded px-1 text-[9px]"
                  style={{ borderColor: conn.color, color: conn.color }}
                >
                  {conn.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message list */}
      <div ref={messageListRef} className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-8 text-muted-foreground">
            {!running ? (
              <p className="text-xs">Click Start to begin capturing WebSocket messages</p>
            ) : messages.length === 0 ? (
              <p className="text-xs">Waiting for WebSocket messages...</p>
            ) : (
              <p className="text-xs">No matching messages</p>
            )}
          </div>
        ) : (
          filtered.map((msg) => {
            const conn = connectionMap.get(msg.connectionId);
            return (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={cn(
                  'flex w-full items-center gap-2 border-b border-border/30 px-2 py-1 text-left text-xs transition-colors hover:bg-accent/50',
                  selectedMessage?.id === msg.id && 'bg-accent',
                )}
              >
                {msg.direction === 'sent' ? (
                  <ArrowUp className="size-3 shrink-0 text-blue-500" />
                ) : (
                  <ArrowDown className="size-3 shrink-0 text-green-500" />
                )}
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatTimestamp(msg.timestamp)}
                </span>
                <span className="flex-1 truncate font-mono text-[11px]">
                  {filter
                    ? highlightText(truncateMessage(msg.data), filter, filterType)
                    : truncateMessage(msg.data)}
                </span>
                {conn && (
                  <span
                    className="size-2.5 shrink-0 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: conn.color }}
                    title={conn.url}
                  />
                )}
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatSize(msg.size)}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between border-t bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground">
        <span>
          {connections.length} connection{connections.length !== 1 ? 's' : ''}
          {' · '}
          {filtered.length} message{filtered.length !== 1 ? 's' : ''}
          {filter && ` (${messages.length} total)`}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={cn(
                  'rounded p-0.5 transition-colors',
                  autoScroll
                    ? 'text-primary'
                    : 'text-muted-foreground/50 hover:text-muted-foreground',
                )}
              >
                <ArrowDownToLine className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  if (!selectedMessage) return list;

  return (
    <SplitPane
      left={list}
      right={
        <MessageDetail
          key={selectedMessage.id}
          message={selectedMessage}
          filter={filter}
          filterType={filterType}
        />
      }
      defaultRatio={45}
    />
  );
}
