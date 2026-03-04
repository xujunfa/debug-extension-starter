/**
 * Manage declarativeNetRequest session rules for custom request headers.
 * Rules are scoped to a specific tabId using the `tabIds` condition.
 *
 * Rule IDs are allocated from a global counter and tracked per-tab in memory.
 */

let nextRuleId = 1;
const tabRuleIds = new Map<number, number[]>();

/** Remove all session rules belonging to a specific tab. */
async function clearTabRules(tabId: number): Promise<void> {
  const ids = tabRuleIds.get(tabId);
  if (ids && ids.length > 0) {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: ids,
    });
    tabRuleIds.delete(tabId);
  }
}

/** Apply header rules for a tab. Replaces any existing rules for that tab. */
export async function applyHeaderRules(
  tabId: number,
  headers: { name: string; value: string }[],
): Promise<void> {
  await clearTabRules(tabId);

  if (headers.length === 0) return;

  const ids = headers.map(() => nextRuleId++);
  tabRuleIds.set(tabId, ids);

  const addRules: chrome.declarativeNetRequest.Rule[] = headers.map(
    (h, i) => ({
      id: ids[i],
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            header: h.name,
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: h.value,
          },
        ],
      },
      condition: {
        tabIds: [tabId],
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
          chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          chrome.declarativeNetRequest.ResourceType.SCRIPT,
          chrome.declarativeNetRequest.ResourceType.STYLESHEET,
          chrome.declarativeNetRequest.ResourceType.IMAGE,
          chrome.declarativeNetRequest.ResourceType.FONT,
          chrome.declarativeNetRequest.ResourceType.MEDIA,
          chrome.declarativeNetRequest.ResourceType.OTHER,
        ],
      },
    }),
  );

  await chrome.declarativeNetRequest.updateSessionRules({ addRules });
}

/** Clear all header rules for a tab. */
export async function clearHeaderRules(
  tabId: number,
): Promise<void> {
  await clearTabRules(tabId);
}
