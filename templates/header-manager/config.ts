export const STORAGE_KEY_HEADER_GROUPS = 'header-groups';

export interface HeaderItem {
  id: string;
  name: string;
  value: string;
  enabled: boolean;
}

export interface HeaderGroup {
  id: string;
  name: string;
  enabled: boolean;
  headers: HeaderItem[];
  order: number;
}

export function createHeaderItem(
  partial?: Partial<HeaderItem>,
): HeaderItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    value: '',
    enabled: true,
    ...partial,
  };
}

export function createHeaderGroup(
  partial?: Partial<HeaderGroup>,
): HeaderGroup {
  return {
    id: crypto.randomUUID(),
    name: 'New Group',
    enabled: false,
    headers: [],
    order: 0,
    ...partial,
  };
}

/** Collect all active headers from groups, respecting dual-layer toggle. */
export function collectActiveHeaders(
  groups: HeaderGroup[],
): { name: string; value: string }[] {
  const headerMap = new Map<string, string>();

  // Process groups in order — later groups override earlier ones for same-name headers
  const sorted = [...groups].sort((a, b) => a.order - b.order);
  for (const group of sorted) {
    if (!group.enabled) continue;
    for (const header of group.headers) {
      if (!header.enabled) continue;
      if (header.name.trim()) {
        headerMap.set(header.name.trim(), header.value);
      }
    }
  }

  return Array.from(headerMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));
}
