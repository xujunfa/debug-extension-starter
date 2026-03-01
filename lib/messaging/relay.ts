import type {
  BusRequest,
  BusResponse,
  BusEvent,
  EventMap,
  EventType,
  RequestMap,
  RequestType,
} from './types';
import { _getHandler } from './request';

const devtoolsPorts = new Map<number, Browser.runtime.Port>();
const contentScriptTabs = new Set<number>();

/**
 * Push an event to the DevTools panel connected for a specific tab.
 */
export function pushEvent<T extends EventType>(
  tabId: number,
  type: T,
  data: EventMap[T],
): void {
  const port = devtoolsPorts.get(tabId);
  if (port) {
    port.postMessage({ __bus: 'event', type, data } as BusEvent);
  }
}

function registerContentScript(tabId: number): void {
  contentScriptTabs.add(tabId);
  pushEvent(tabId, 'CONTENT_SCRIPT_STATUS', { ready: true });
}

function unregisterContentScript(tabId: number): void {
  contentScriptTabs.delete(tabId);
  pushEvent(tabId, 'CONTENT_SCRIPT_STATUS', { ready: false });
}

/**
 * Set up the background service worker message relay.
 * Handles:
 * - Port connections from DevTools panels
 * - Message routing (forward to content script or handle locally)
 * - Content script lifecycle tracking
 */
export function setupRelay(): void {
  // Track DevTools panel connections
  browser.runtime.onConnect.addListener((port) => {
    const match = port.name.match(/^devtools-(\d+)$/);
    if (!match) return;

    const tabId = parseInt(match[1], 10);
    devtoolsPorts.set(tabId, port);

    // Notify current content script status
    pushEvent(tabId, 'CONTENT_SCRIPT_STATUS', {
      ready: contentScriptTabs.has(tabId),
    });

    port.onDisconnect.addListener(() => {
      devtoolsPorts.delete(tabId);
    });
  });

  // Route request messages — use sendResponse + return true for async
  browser.runtime.onMessage.addListener(
    (
      message: unknown,
      sender: Browser.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      const msg = message as BusRequest;
      if (msg?.__bus !== 'request') return;

      // Forward to content script if requested
      if (msg.forwardToTab != null) {
        browser.tabs
          .sendMessage(msg.forwardToTab, {
            __bus: 'request',
            type: msg.type,
            payload: msg.payload,
          } satisfies BusRequest)
          .then(
            (response: unknown) => sendResponse(response),
            (error: Error) =>
              sendResponse({ __bus: 'response', error: error.message } satisfies BusResponse),
          );
        return true;
      }

      // Handle CONTENT_SCRIPT_READY specially
      if (msg.type === 'CONTENT_SCRIPT_READY' && sender.tab?.id != null) {
        registerContentScript(sender.tab.id);
        sendResponse({
          __bus: 'response',
          data: { acknowledged: true },
        } satisfies BusResponse);
        return;
      }

      // Dispatch to locally registered handlers
      const handler = _getHandler(msg.type);
      if (handler) {
        Promise.resolve(
          handler(
            msg.payload as RequestMap[RequestType]['request'],
            sender,
          ),
        )
          .then(
            (data) =>
              sendResponse({ __bus: 'response' as const, data } satisfies BusResponse),
          )
          .catch(
            (err: Error) =>
              sendResponse({ __bus: 'response' as const, error: err.message } satisfies BusResponse),
          );
        return true;
      }
    },
  );

  // Clean up when tabs are closed
  browser.tabs.onRemoved.addListener((tabId) => {
    unregisterContentScript(tabId);
    devtoolsPorts.delete(tabId);
  });
}
