import { useState, useEffect, useCallback, useRef } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import { WindowShell } from './components/window-shell';
import type { TabItem } from './components/title-bar';

const STORAGE_KEY = 'floating-window-state';

interface FloatingWindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  activeTab: string;
}

const DEFAULT_STATE: FloatingWindowState = {
  x: -1, // sentinel — will be computed on first render
  y: -1,
  width: 380,
  height: 480,
  collapsed: false,
  activeTab: 'placeholder',
};

const TABS: TabItem[] = [
  { id: 'placeholder', label: 'Home' },
];

function computeDefaultPosition(width: number, height: number) {
  return {
    x: Math.max(20, window.innerWidth - width - 20),
    y: Math.max(20, window.innerHeight - height - 20),
  };
}

export default function App() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<FloatingWindowState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load persisted state
  useEffect(() => {
    storageGet<FloatingWindowState>(STORAGE_KEY, DEFAULT_STATE).then((saved) => {
      if (saved.x === -1 || saved.y === -1) {
        const pos = computeDefaultPosition(saved.width, saved.height);
        saved = { ...saved, ...pos };
      }
      setState(saved);
      setLoaded(true);
    });
  }, []);

  // Persist state (debounced)
  const persistState = useCallback((next: FloatingWindowState) => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      storageSet(STORAGE_KEY, next);
    }, 300);
  }, []);

  // Listen for TOGGLE_FLOATING_WINDOW from background
  useEffect(() => {
    const handler = () => setVisible((v) => !v);
    document.addEventListener('debug-tool:toggle', handler);
    return () => document.removeEventListener('debug-tool:toggle', handler);
  }, []);

  const updateState = useCallback(
    (patch: Partial<FloatingWindowState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        persistState(next);
        return next;
      });
    },
    [persistState],
  );

  if (!loaded || !visible) return null;

  return (
    <WindowShell
      position={{ x: state.x, y: state.y }}
      size={{ width: state.width, height: state.height }}
      collapsed={state.collapsed}
      tabs={TABS}
      activeTab={state.activeTab}
      onTabChange={(tab) => updateState({ activeTab: tab })}
      onCollapseToggle={() => updateState({ collapsed: !state.collapsed })}
      onPositionChange={(pos) => updateState(pos)}
      onSizeChange={(size) => updateState(size)}
    >
      <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
        Floating window ready. Features coming in milestone 8.2+
      </div>
    </WindowShell>
  );
}
