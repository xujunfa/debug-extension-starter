import { setupRelay, pushEvent } from '@/lib/messaging/relay';
import { onRequest } from '@/lib/messaging/request';
import { applyHeaderRules, clearHeaderRules } from '@/lib/header-rules';

export default defineBackground(() => {
  setupRelay();

  onRequest('GET_TAB_ID', (_payload, sender) => {
    return { tabId: sender.tab!.id! };
  });

  onRequest('APPLY_HEADER_RULES', async ({ tabId, headers }) => {
    await applyHeaderRules(tabId, headers);
    return { success: true };
  });

  onRequest('CLEAR_HEADER_RULES', async ({ tabId }) => {
    await clearHeaderRules(tabId);
    return { success: true };
  });

  onRequest('EVAL_IN_PAGE', async ({ tabId, expression }) => {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (expr: string) => {
          try {
            // eslint-disable-next-line no-eval
            return { value: eval(expr) };
          } catch (e) {
            return { error: (e as Error).message };
          }
        },
        args: [expression],
        world: 'MAIN',
      });
      if (result.result?.error) {
        return { success: false, error: result.result.error };
      }
      return { success: true, result: result.result?.value };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
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

  // Toggle floating window via Extension icon click
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_FLOATING_WINDOW' }).catch(() => {});
    }
  });

  // Toggle floating window via keyboard shortcut
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-floating-window') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_FLOATING_WINDOW' }).catch(() => {});
      }
    }
  });

  console.log('Debug Tool background service worker started', {
    id: browser.runtime.id,
  });
});
