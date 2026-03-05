import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
}

interface TitleBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
}

const TITLE_BAR_HEIGHT = 36;

export function TitleBar({
  tabs,
  activeTab,
  onTabChange,
  collapsed,
  onCollapseToggle,
  onPointerDown,
}: TitleBarProps) {
  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={onCollapseToggle}
      style={{ height: TITLE_BAR_HEIGHT }}
      className="flex shrink-0 select-none items-center gap-1 border-b border-border bg-muted/50 px-2"
    >
      {/* Drag handle + title */}
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <span className="shrink-0 text-xs font-medium text-foreground/80">Debug</span>

      {/* Tab pills */}
      <div className="flex min-w-0 flex-1 items-center gap-0.5 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'rounded-sm px-2 py-0.5 text-[10px] font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onCollapseToggle}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        {collapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
    </div>
  );
}

export { TITLE_BAR_HEIGHT };
