import { WS_MONITOR_EVENT_KEY } from './config';

/**
 * Build the injection script string for `inspectedWindow.eval()`.
 * Monkey-patches `window.WebSocket` to intercept connections and messages,
 * sending events via `window.postMessage` for the content script to relay.
 */
function buildInjectionScript(): string {
  return `(function() {
  if (window.__wsMonitorInjected) return 'already_injected';

  var OriginalWebSocket = window.WebSocket;
  var connectionCounter = 0;

  function genId() {
    return 'ws-' + Date.now() + '-' + (++connectionCounter);
  }

  function post(payload) {
    window.postMessage({ ${WS_MONITOR_EVENT_KEY}: true, payload: payload }, '*');
  }

  function byteLength(data) {
    if (typeof data === 'string') return new Blob([data]).size;
    if (data instanceof ArrayBuffer) return data.byteLength;
    if (data instanceof Blob) return data.size;
    if (data && data.buffer instanceof ArrayBuffer) return data.byteLength;
    return 0;
  }

  function dataToString(data) {
    if (typeof data === 'string') return data;
    if (data instanceof ArrayBuffer) {
      try { return new TextDecoder().decode(data); } catch(e) { return '[ArrayBuffer ' + data.byteLength + ' bytes]'; }
    }
    if (data instanceof Blob) return '[Blob ' + data.size + ' bytes]';
    if (data && data.buffer instanceof ArrayBuffer) {
      try { return new TextDecoder().decode(data); } catch(e) { return '[TypedArray ' + data.byteLength + ' bytes]'; }
    }
    return String(data);
  }

  function PatchedWebSocket(url, protocols) {
    var ws = protocols !== undefined
      ? new OriginalWebSocket(url, protocols)
      : new OriginalWebSocket(url);

    var connId = genId();

    post({
      type: 'ws:connect',
      connectionId: connId,
      url: typeof url === 'string' ? url : url.toString(),
      timestamp: Date.now()
    });

    // Intercept incoming messages
    var origAddEventListener = ws.addEventListener.bind(ws);
    var messageListeners = [];

    ws.addEventListener = function(type, listener, options) {
      if (type === 'message' && typeof listener === 'function') {
        messageListeners.push(listener);
        var wrapped = function(event) {
          post({
            type: 'ws:message',
            connectionId: connId,
            direction: 'received',
            data: dataToString(event.data),
            size: byteLength(event.data),
            timestamp: Date.now()
          });
          listener.call(ws, event);
        };
        listener.__wsWrapped = wrapped;
        origAddEventListener(type, wrapped, options);
      } else {
        origAddEventListener(type, listener, options);
      }
    };

    // Track onmessage property
    var _onmessage = null;
    Object.defineProperty(ws, 'onmessage', {
      get: function() { return _onmessage; },
      set: function(fn) {
        _onmessage = fn;
        origAddEventListener('message', function(event) {
          post({
            type: 'ws:message',
            connectionId: connId,
            direction: 'received',
            data: dataToString(event.data),
            size: byteLength(event.data),
            timestamp: Date.now()
          });
        });
      },
      configurable: true
    });

    // Intercept send
    var origSend = ws.send.bind(ws);
    ws.send = function(data) {
      post({
        type: 'ws:message',
        connectionId: connId,
        direction: 'sent',
        data: dataToString(data),
        size: byteLength(data),
        timestamp: Date.now()
      });
      origSend(data);
    };

    // Track close
    ws.addEventListener('close', function(event) {
      post({
        type: 'ws:close',
        connectionId: connId,
        timestamp: Date.now(),
        closeCode: event.code,
        closeReason: event.reason
      });
    });

    return ws;
  }

  PatchedWebSocket.prototype = OriginalWebSocket.prototype;
  PatchedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
  PatchedWebSocket.OPEN = OriginalWebSocket.OPEN;
  PatchedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
  PatchedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

  window.WebSocket = PatchedWebSocket;
  window.__wsMonitorInjected = true;
  window.__wsMonitorOriginal = OriginalWebSocket;

  return 'injected';
})()`;
}

function buildCleanupScript(): string {
  return `(function() {
  if (!window.__wsMonitorInjected) return 'not_injected';
  if (window.__wsMonitorOriginal) {
    window.WebSocket = window.__wsMonitorOriginal;
  }
  delete window.__wsMonitorInjected;
  delete window.__wsMonitorOriginal;
  return 'cleaned';
})()`;
}

export function injectWsMonitor(): Promise<string> {
  const script = buildInjectionScript();
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(script, (result) => {
      resolve(result as unknown as string);
    });
  });
}

export function cleanupWsMonitor(): Promise<string> {
  const script = buildCleanupScript();
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(script, (result) => {
      resolve(result as unknown as string);
    });
  });
}
