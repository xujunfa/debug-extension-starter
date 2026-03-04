/** postMessage discriminator key used by injected script → content script */
export const WS_MONITOR_EVENT_KEY = '__ws_monitor';

export type WsEventType = 'ws:connect' | 'ws:message' | 'ws:close';

export interface WsConnection {
  id: string;
  url: string;
  status: 'open' | 'closed';
  openedAt: number;
  closedAt?: number;
  closeCode?: number;
  closeReason?: string;
  color: string;
}

export type WsDirection = 'sent' | 'received';

export interface WsMessage {
  id: string;
  connectionId: string;
  direction: WsDirection;
  data: string;
  timestamp: number;
  size: number;
}

/** Payload shape coming from injected script via postMessage */
export interface WsMonitorPayload {
  type: WsEventType;
  connectionId: string;
  url?: string;
  direction?: WsDirection;
  data?: string;
  size?: number;
  timestamp: number;
  closeCode?: number;
  closeReason?: string;
}

/** 8-color cycle for connection identification */
const CONNECTION_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

let colorIndex = 0;

export function nextConnectionColor(): string {
  const color = CONNECTION_COLORS[colorIndex % CONNECTION_COLORS.length];
  colorIndex++;
  return color;
}

export function resetColorIndex(): void {
  colorIndex = 0;
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function truncateMessage(data: string, maxLen = 120): string {
  if (data.length <= maxLen) return data;
  return data.slice(0, maxLen) + '...';
}
