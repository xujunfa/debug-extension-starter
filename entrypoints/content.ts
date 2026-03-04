import { onRequest, initRequestListener, sendRequest } from '@/lib/messaging/request';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    initRequestListener();

    onRequest('PING', () => {
      return {
        source: 'content',
        timestamp: Date.now(),
      };
    });

    // Relay WS monitor events from injected page script to background
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data?.__ws_monitor) return;
      browser.runtime.sendMessage({
        __bus: 'ws_monitor_relay',
        payload: event.data.payload,
      }).catch(() => {
        // Background may not be ready
      });
    });

    sendRequest('CONTENT_SCRIPT_READY', {}).catch(() => {
      // Background may not be ready yet, ignore
    });
  },
});
