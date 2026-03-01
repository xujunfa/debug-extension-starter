import type {
  RequestMap,
  RequestType,
  BusRequest,
  BusResponse,
} from './types';

type RequestHandler<T extends RequestType = RequestType> = (
  payload: RequestMap[T]['request'],
  sender: Browser.runtime.MessageSender,
) => RequestMap[T]['response'] | Promise<RequestMap[T]['response']>;

const handlers = new Map<string, RequestHandler<RequestType>>();

/**
 * Send a typed request to background service worker.
 * Set `forwardToTab` to relay the request to a specific tab's content script.
 */
export async function sendRequest<T extends RequestType>(
  type: T,
  payload: RequestMap[T]['request'],
  options?: { forwardToTab?: number },
): Promise<RequestMap[T]['response']> {
  const message: BusRequest = {
    __bus: 'request',
    type,
    payload,
    forwardToTab: options?.forwardToTab,
  };

  const response = (await browser.runtime.sendMessage(message)) as BusResponse;

  if (response?.error) {
    throw new Error(response.error);
  }

  return response.data as RequestMap[T]['response'];
}

/**
 * Register a handler for a specific request type.
 * Returns an unsubscribe function.
 */
export function onRequest<T extends RequestType>(
  type: T,
  handler: RequestHandler<T>,
): () => void {
  handlers.set(type, handler as unknown as RequestHandler<RequestType>);
  return () => {
    handlers.delete(type);
  };
}

/** @internal Used by relay.ts to dispatch to registered handlers */
export function _getHandler(
  type: string,
): RequestHandler<RequestType> | undefined {
  return handlers.get(type);
}

/**
 * Initialize the onMessage listener for content scripts.
 * In background, use setupRelay() from relay.ts instead.
 */
export function initRequestListener(): void {
  browser.runtime.onMessage.addListener(
    (
      message: unknown,
      sender: Browser.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      const msg = message as BusRequest;
      if (msg?.__bus !== 'request') return;

      const handler = handlers.get(msg.type);
      if (!handler) return;

      Promise.resolve(
        handler(msg.payload as RequestMap[RequestType]['request'], sender),
      )
        .then((data) => sendResponse({ __bus: 'response' as const, data }))
        .catch((err: Error) =>
          sendResponse({ __bus: 'response' as const, error: err.message }),
        );

      return true; // Keep channel open for async sendResponse
    },
  );
}
