export const STORAGE_KEY_SNAPSHOTS = 'data-viewer-snapshots';
export const MAX_SNAPSHOTS = 50;

export interface SnapshotEntry {
  expressionId: string;
  expression: string;
  label?: string;
  value: unknown;
  error?: string;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  label?: string;
  entries: SnapshotEntry[];
}

export interface WatchExpression {
  id: string;
  expression: string;
  label?: string;
}

export const defaultExpressions: WatchExpression[] = [
  { id: 'location', expression: 'JSON.stringify({href:location.href,host:location.host,pathname:location.pathname})', label: 'Location' },
  { id: 'cookies', expression: 'document.cookie', label: 'Cookies' },
  { id: 'localStorage-keys', expression: 'JSON.stringify(Object.keys(localStorage))', label: 'LocalStorage Keys' },
  { id: 'title', expression: 'document.title', label: 'Page Title' },
];

export function evalInPage(expression: string): Promise<{ value: unknown; error?: string }> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(expression, (result, exceptionInfo) => {
      if (exceptionInfo) {
        resolve({
          value: null,
          error: exceptionInfo.description || exceptionInfo.value || 'Evaluation error',
        });
      } else {
        resolve({ value: result });
      }
    });
  });
}
