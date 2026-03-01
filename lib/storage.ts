type StorageKey = string;

export async function storageGet<T>(key: StorageKey, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

export async function storageSet<T>(key: StorageKey, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function storageRemove(key: StorageKey): Promise<void> {
  await chrome.storage.local.remove(key);
}
