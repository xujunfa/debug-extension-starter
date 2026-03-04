import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageGet, storageSet } from '@/lib/storage';
import { sendRequest } from '@/lib/messaging/request';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type HeaderGroup,
  type HeaderItem,
  STORAGE_KEY_HEADER_GROUPS,
  createHeaderGroup,
  createHeaderItem,
  collectActiveHeaders,
} from './config';

const tabId = chrome.devtools.inspectedWindow.tabId;

function HeaderRow({
  header,
  groupEnabled,
  onUpdate,
  onRemove,
}: {
  header: HeaderItem;
  groupEnabled: boolean;
  onUpdate: (patch: Partial<HeaderItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <Checkbox
        checked={header.enabled}
        onCheckedChange={(checked) =>
          onUpdate({ enabled: checked === true })
        }
        disabled={!groupEnabled}
        className="size-3.5"
      />
      <Input
        value={header.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Header name"
        className="h-6 flex-1 font-mono text-xs"
      />
      <Input
        value={header.value}
        onChange={(e) => onUpdate({ value: e.target.value })}
        placeholder="Value"
        className="h-6 flex-1 font-mono text-xs"
      />
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        title="Remove header"
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}

function GroupCard({
  group,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  group: HeaderGroup;
  onUpdate: (patch: Partial<HeaderGroup>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}) {
  const updateHeader = (
    headerId: string,
    patch: Partial<HeaderItem>,
  ) => {
    onUpdate({
      headers: group.headers.map((h) =>
        h.id === headerId ? { ...h, ...patch } : h,
      ),
    });
  };

  const removeHeader = (headerId: string) => {
    onUpdate({
      headers: group.headers.filter((h) => h.id !== headerId),
    });
  };

  const addHeader = () => {
    onUpdate({
      headers: [...group.headers, createHeaderItem()],
    });
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        'rounded-lg border bg-card transition-colors',
        group.enabled ? 'border-primary/30' : 'border-border',
      )}
    >
      {/* Group header */}
      <div className="flex items-center gap-2 border-b px-2 py-1.5">
        <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/50" />
        <Switch
          checked={group.enabled}
          onCheckedChange={(checked) => onUpdate({ enabled: checked })}
          size="sm"
        />
        <Input
          value={group.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-6 flex-1 border-none bg-transparent px-1 text-xs font-medium shadow-none focus-visible:ring-0"
          placeholder="Group name"
        />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRemove}
          title="Delete group"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {/* Headers */}
      <div className="px-2 py-1.5">
        {group.headers.length === 0 ? (
          <p className="py-1 text-center text-[10px] text-muted-foreground italic">
            No headers — click + to add one
          </p>
        ) : (
          group.headers.map((header) => (
            <HeaderRow
              key={header.id}
              header={header}
              groupEnabled={group.enabled}
              onUpdate={(patch) => updateHeader(header.id, patch)}
              onRemove={() => removeHeader(header.id)}
            />
          ))
        )}
        <Button
          variant="ghost"
          size="xs"
          className="mt-1 w-full text-muted-foreground"
          onClick={addHeader}
        >
          <Plus className="mr-1 size-3" />
          Add Header
        </Button>
      </div>
    </div>
  );
}

export default function HeaderManager() {
  const [groups, setGroups] = useState<HeaderGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Load from storage on mount
  useEffect(() => {
    storageGet<HeaderGroup[]>(STORAGE_KEY_HEADER_GROUPS, []).then(
      (saved) => {
        setGroups(saved);
        setLoaded(true);
      },
    );
  }, []);

  // Persist and sync rules whenever groups change
  const persist = useCallback(
    (next: HeaderGroup[]) => {
      setGroups(next);
      storageSet(STORAGE_KEY_HEADER_GROUPS, next);

      const active = collectActiveHeaders(next);
      if (active.length > 0) {
        sendRequest('APPLY_HEADER_RULES', {
          tabId,
          headers: active,
        });
      } else {
        sendRequest('CLEAR_HEADER_RULES', { tabId });
      }
    },
    [],
  );

  // Re-apply rules on mount once data is loaded
  useEffect(() => {
    if (!loaded) return;
    const active = collectActiveHeaders(groups);
    if (active.length > 0) {
      sendRequest('APPLY_HEADER_RULES', { tabId, headers: active });
    }
    // Only on mount after load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const addGroup = () => {
    persist([
      ...groups,
      createHeaderGroup({ order: groups.length }),
    ]);
  };

  const updateGroup = (
    groupId: string,
    patch: Partial<HeaderGroup>,
  ) => {
    persist(
      groups.map((g) =>
        g.id === groupId ? { ...g, ...patch } : g,
      ),
    );
  };

  const removeGroup = (groupId: string) => {
    persist(groups.filter((g) => g.id !== groupId));
  };

  const handleDragEnd = () => {
    if (dragIdx === null || dragOverIdx === null) return;
    const items = [...groups];
    const [dragged] = items.splice(dragIdx, 1);
    items.splice(dragOverIdx, 0, dragged);
    const reordered = items.map((g, i) => ({ ...g, order: i }));
    persist(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const activeCount = collectActiveHeaders(groups).length;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
        <span className="text-xs font-semibold text-muted-foreground">
          Header Groups
        </span>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {activeCount} active
        </span>
        <div className="flex-1" />
        <Button variant="outline" size="xs" onClick={addGroup}>
          <Plus className="mr-1 size-3" />
          Add Group
        </Button>
      </div>

      {/* Group list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No header groups yet</p>
              <p className="text-xs">
                Click "Add Group" to create your first group
              </p>
            </div>
          ) : (
            groups.map((group, index) => (
              <GroupCard
                key={group.id}
                group={group}
                onUpdate={(patch) => updateGroup(group.id, patch)}
                onRemove={() => removeGroup(group.id)}
                onDragStart={() => setDragIdx(index)}
                onDragEnter={() => setDragOverIdx(index)}
                onDragEnd={handleDragEnd}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
