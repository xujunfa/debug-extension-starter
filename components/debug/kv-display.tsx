import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface KvItem {
  key: string;
  value: React.ReactNode;
  highlight?: boolean;
  collapsible?: boolean;
}

interface KvGroupProps {
  title: string;
  items: KvItem[];
  defaultCollapsed?: boolean;
}

interface KvDisplayProps {
  items?: KvItem[];
  groups?: KvGroupProps[];
  className?: string;
}

function KvRow({ item }: { item: KvItem }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 border-b border-border/50 px-3 py-1.5 text-xs last:border-b-0',
        item.highlight && 'bg-primary/5',
      )}
    >
      <span className="w-32 shrink-0 truncate font-medium text-muted-foreground">
        {item.key}
      </span>
      <span className="min-w-0 break-all font-mono text-foreground">
        {item.value}
      </span>
    </div>
  );
}

function KvGroup({ group }: { group: KvGroupProps }) {
  const [collapsed, setCollapsed] = React.useState(
    group.defaultCollapsed ?? false,
  );

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-1.5 bg-muted/50 px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
      >
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 transition-transform',
            !collapsed && 'rotate-90',
          )}
        />
        {group.title}
        <Badge variant="outline" className="ml-auto h-4 rounded px-1 text-[10px]">
          {group.items.length}
        </Badge>
      </button>

      {!collapsed && (
        <div>
          {group.items.map((item) => (
            <KvRow key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function KvDisplay({ items, groups, className }: KvDisplayProps) {
  return (
    <div className={cn('overflow-hidden rounded-md border bg-card', className)}>
      {items?.map((item) => <KvRow key={item.key} item={item} />)}
      {groups?.map((group) => (
        <KvGroup key={group.title} group={group} />
      ))}
      {!items?.length && !groups?.length && (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground italic">
          No data
        </div>
      )}
    </div>
  );
}

export { KvDisplay, type KvDisplayProps, type KvItem, type KvGroupProps };
