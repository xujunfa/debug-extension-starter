import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Square,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { connectToBackground, eventBus } from '@/lib/messaging/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

function MessageDetail({ message }: { message: WsMessage }) {
  let parsed: JsonValue | null = null;
  try {
    parsed = JSON.parse(message.data) as JsonValue;
  } catch {
    // not JSON
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={message.direction === 'sent' ? 'text-blue-500' : 'text-green-500'}>
            {message.direction === 'sent' ? 'Sent' : 'Received'}
          </span>
          <span>{formatTimestamp(message.timestamp)}</span>
          <span>{formatSize(message.size)}</span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {parsed ? (
            <JsonViewer data={parsed} />
          ) : (
            <pre className="whitespace-pre-wrap break-all rounded-md border bg-card p-2 font-mono text-xs">
              {message.data}
            </pre>
          )}
        </div>
      </ScrollArea>
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

  const connectionsRef = useRef<WsConnection[]>([]);
  const messagesRef = useRef<WsMessage[]>([]);
  const runningRef = useRef(false);

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

  // Filter messages by selected connections then by text filter
  const connFiltered =
    selectedConnIds.size === 0
      ? messages
      : messages.filter((m) => selectedConnIds.has(m.connectionId));
  const filtered = applyFilter(connFiltered, filter, filterType);

  const connectionMap = new Map(connections.map((c) => [c.id, c]));

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
                <span
                  className={cn(
                    'inline-block size-2 shrink-0 rounded-full',
                    conn.status === 'open' ? 'bg-green-500' : 'bg-muted-foreground',
                  )}
                  style={{ boxShadow: `0 0 0 1px ${conn.color}` }}
                />
                <span className="truncate text-muted-foreground">
                  {conn.url.replace(/^wss?:\/\//, '')}
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
      <ScrollArea className="flex-1">
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
                  {truncateMessage(msg.data)}
                </span>
                {conn && (
                  <span
                    className="size-2 shrink-0 rounded-full"
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
      </ScrollArea>

      {/* Status bar */}
      <div className="shrink-0 border-t bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground">
        {connections.length} connection{connections.length !== 1 ? 's' : ''}
        {' · '}
        {filtered.length} message{filtered.length !== 1 ? 's' : ''}
        {filter && ` (${messages.length} total)`}
      </div>
    </div>
  );

  if (!selectedMessage) return list;

  return (
    <SplitPane
      left={list}
      right={<MessageDetail key={selectedMessage.id} message={selectedMessage} />}
      defaultRatio={45}
    />
  );
}
