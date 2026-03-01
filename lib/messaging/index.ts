export type {
  RequestMap,
  RequestType,
  EventMap,
  EventType,
} from './types';

export { sendRequest, onRequest, initRequestListener } from './request';
export { eventBus, connectToBackground } from './events';
export { setupRelay, pushEvent } from './relay';
