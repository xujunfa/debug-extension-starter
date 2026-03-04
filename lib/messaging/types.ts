/**
 * Request/response type map.
 * Extend this interface to add new message types:
 *
 * ```ts
 * declare module '@/lib/messaging/types' {
 *   interface RequestMap {
 *     GET_DATA: { request: { key: string }; response: { value: unknown } };
 *   }
 * }
 * ```
 */
export interface RequestMap {
  PING: {
    request: { source: string };
    response: { source: string; timestamp: number };
  };
  CONTENT_SCRIPT_READY: {
    request: Record<string, never>;
    response: { acknowledged: boolean };
  };
  APPLY_HEADER_RULES: {
    request: {
      tabId: number;
      headers: { name: string; value: string }[];
    };
    response: { success: boolean };
  };
  CLEAR_HEADER_RULES: {
    request: { tabId: number };
    response: { success: boolean };
  };
}

export type RequestType = keyof RequestMap;

/**
 * Event type map for pub/sub.
 * Extend this interface to add new event types.
 */
export interface EventMap {
  CONTENT_SCRIPT_STATUS: { ready: boolean };
}

export type EventType = keyof EventMap;

export interface BusRequest {
  __bus: 'request';
  type: string;
  payload: unknown;
  forwardToTab?: number;
}

export interface BusResponse {
  __bus: 'response';
  data?: unknown;
  error?: string;
}

export interface BusEvent {
  __bus: 'event';
  type: string;
  data: unknown;
}
