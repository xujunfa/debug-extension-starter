import { setupRelay, pushEvent } from '@/lib/messaging/relay';
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

  // Relay WS monitor events from content script to DevTools panel
  browser.runtime.onMessage.addListener(
    (message: unknown, sender: Browser.runtime.MessageSender) => {
      const msg = message as { __bus?: string; payload?: unknown };
      if (msg?.__bus !== 'ws_monitor_relay' || !sender.tab?.id) return;
      pushEvent(sender.tab.id, 'WS_MONITOR_EVENT', msg.payload as {
        type: 'ws:connect' | 'ws:message' | 'ws:close';
        connectionId: string;
        url?: string;
        direction?: 'sent' | 'received';
        data?: string;
        size?: number;
        timestamp: number;
        closeCode?: number;
        closeReason?: string;
      });
    },
  );

  console.log('Debug Tool background service worker started', {
    id: browser.runtime.id,
  });
});
