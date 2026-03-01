import type { EventMap, EventType, BusEvent } from './types';

type EventHandler<T extends EventType = EventType> = (
  data: EventMap[T],
) => void;

/**
 * Local pub/sub event bus. Supports multiple listeners per event type.
 * Used within a single extension context (devtools panel, background, etc.).
 * For cross-context events, use connectToBackground() in devtools panel.
 */
class LocalEventBus {
  private listeners = new Map<string, Set<EventHandler<EventType>>>();

  on<T extends EventType>(type: T, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler as EventHandler<EventType>);
    return () => {
      this.listeners.get(type)?.delete(handler as EventHandler<EventType>);
    };
  }

  emit<T extends EventType>(type: T, data: EventMap[T]): void {
    this.listeners.get(type)?.forEach((handler) => handler(data));
  }
}

export const eventBus = new LocalEventBus();

/**
 * Connect DevTools panel to background to receive pushed events.
 * Events received via the port are automatically dispatched to the local eventBus.
 *
 * @param tabId - The inspected tab ID from browser.devtools.inspectedWindow.tabId
 * @returns Object with disconnect function and the underlying port
 */
export function connectToBackground(tabId: number): {
  port: Browser.runtime.Port;
  disconnect: () => void;
} {
  const port = browser.runtime.connect({ name: `devtools-${tabId}` });

  port.onMessage.addListener((message: unknown) => {
    const msg = message as BusEvent;
    if (msg?.__bus === 'event') {
      eventBus.emit(msg.type as EventType, msg.data as EventMap[EventType]);
    }
  });

  return {
    port,
    disconnect: () => port.disconnect(),
  };
}
