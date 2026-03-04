import { setupRelay } from '@/lib/messaging/relay';
import { onRequest } from '@/lib/messaging/request';
import { applyHeaderRules, clearHeaderRules } from '@/lib/header-rules';

export default defineBackground(() => {
  setupRelay();

  onRequest('APPLY_HEADER_RULES', async ({ tabId, headers }) => {
    await applyHeaderRules(tabId, headers);
    return { success: true };
  });

  onRequest('CLEAR_HEADER_RULES', async ({ tabId }) => {
    await clearHeaderRules(tabId);
    return { success: true };
  });

  console.log('Debug Tool background service worker started', {
    id: browser.runtime.id,
  });
});
