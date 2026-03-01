export const STORAGE_KEY_VIEWS = 'network-views';
export const STORAGE_KEY_HIGHLIGHT_RULES = 'network-highlight-rules';

export interface HighlightRule {
  id: string;
  key: string;
  enabled: boolean;
}

export interface View {
  id: string;
  name: string;
  filterType: 'contains' | 'regex';
  pattern: string;
}

export interface NetworkEntry {
  id: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  type: string;
  size: number;
  time: number;
  timestamp: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
}

export function parseHarEntry(entry: chrome.devtools.network.Request): NetworkEntry {
  const { request, response, time, startedDateTime } = entry;

  const requestHeaders: Record<string, string> = {};
  request.headers.forEach((h) => {
    requestHeaders[h.name] = h.value;
  });

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((h) => {
    responseHeaders[h.name] = h.value;
  });

  const postData = request.postData?.text;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method: request.method,
    url: request.url,
    status: response.status,
    statusText: response.statusText,
    type: response.content.mimeType.split('/')[0] || 'other',
    size: response.content.size,
    time: Math.round(time),
    timestamp: new Date(startedDateTime).getTime(),
    requestHeaders,
    responseHeaders,
    requestBody: postData,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
