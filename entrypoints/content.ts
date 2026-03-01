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

    sendRequest('CONTENT_SCRIPT_READY', {}).catch(() => {
      // Background may not be ready yet, ignore
    });
  },
});
