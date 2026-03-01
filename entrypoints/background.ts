import { setupRelay } from '@/lib/messaging/relay';

export default defineBackground(() => {
  setupRelay();

  console.log('Debug Tool background service worker started', {
    id: browser.runtime.id,
  });
});
