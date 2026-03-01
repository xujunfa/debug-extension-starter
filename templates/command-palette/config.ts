export const STORAGE_KEY_USER_SCRIPTS = 'command-user-scripts';

export interface UserScript {
  id: string;
  name: string;
  description: string;
  script: string;
  enabled: boolean;
  order: number;
}

export interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  script: string;
}

export interface CommandResult {
  commandId: string;
  output: unknown;
  error?: string;
  executedAt: number;
  duration: number;
}

export const builtinCommands: Command[] = [
  {
    id: 'page-info',
    name: 'Page Info',
    description: 'Get current page title, URL, and meta tags',
    category: 'Page',
    script: `(function() {
  const metas = {};
  document.querySelectorAll('meta[name],meta[property]').forEach(m => {
    metas[m.getAttribute('name') || m.getAttribute('property')] = m.getAttribute('content');
  });
  return JSON.stringify({ title: document.title, url: location.href, charset: document.characterSet, metas });
})()`,
  },
  {
    id: 'performance-timing',
    name: 'Performance Timing',
    description: 'Get page load performance metrics',
    category: 'Performance',
    script: `(function() {
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav) return JSON.stringify({ error: 'No navigation entry' });
  return JSON.stringify({
    dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
    tcp: Math.round(nav.connectEnd - nav.connectStart),
    ttfb: Math.round(nav.responseStart - nav.requestStart),
    download: Math.round(nav.responseEnd - nav.responseStart),
    domReady: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    load: Math.round(nav.loadEventEnd - nav.startTime),
    transferSize: nav.transferSize,
  });
})()`,
  },
  {
    id: 'list-event-listeners',
    name: 'Document Event Listeners',
    description: 'List event listeners attached to document',
    category: 'DOM',
    script: `(function() {
  const listeners = getEventListeners(document);
  const summary = {};
  for (const [type, arr] of Object.entries(listeners)) {
    summary[type] = arr.length;
  }
  return JSON.stringify(summary);
})()`,
  },
  {
    id: 'storage-usage',
    name: 'Storage Usage',
    description: 'Show localStorage and sessionStorage usage',
    category: 'Storage',
    script: `(function() {
  function getSize(storage) {
    let total = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      total += key.length + storage.getItem(key).length;
    }
    return { count: storage.length, bytes: total * 2 };
  }
  return JSON.stringify({
    localStorage: getSize(localStorage),
    sessionStorage: getSize(sessionStorage),
    cookies: { count: document.cookie.split(';').filter(Boolean).length, value: document.cookie.length * 2 },
  });
})()`,
  },
  {
    id: 'clear-console',
    name: 'Clear Console',
    description: 'Clear the browser console',
    category: 'Utility',
    script: 'console.clear(); "Console cleared"',
  },
  {
    id: 'scroll-top',
    name: 'Scroll to Top',
    description: 'Scroll page to the top',
    category: 'Utility',
    script: 'window.scrollTo({top:0,behavior:"smooth"}); "Scrolled to top"',
  },
];

export function executeCommand(script: string): Promise<CommandResult & { commandId: string }> {
  const start = Date.now();
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(script, (result, exceptionInfo) => {
      const duration = Date.now() - start;
      if (exceptionInfo) {
        resolve({
          commandId: '',
          output: null,
          error: exceptionInfo.description || exceptionInfo.value || 'Execution error',
          executedAt: Date.now(),
          duration,
        });
      } else {
        resolve({
          commandId: '',
          output: result,
          executedAt: Date.now(),
          duration,
        });
      }
    });
  });
}
