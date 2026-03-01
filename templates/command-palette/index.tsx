import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Play, Search, Trash2, Clock, Plus, GripVertical, Pencil, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageGet, storageSet } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SplitPane } from '@/components/layout/split-pane';
import { JsonViewer, type JsonValue } from '@/components/debug/json-viewer';
import {
  type Command,
  type CommandResult,
  type UserScript,
  STORAGE_KEY_USER_SCRIPTS,
  builtinCommands,
  executeCommand,
} from './config';

function ResultDisplay({ result }: { result: CommandResult }) {
  if (result.error) {
    return <p className="text-xs text-destructive">{result.error}</p>;
  }

  const output = result.output;

  // If output is already an object/array, show directly
  if (output !== null && typeof output === 'object') {
    return <JsonViewer data={output as JsonValue} defaultExpanded maxDepth={4} />;
  }

  // If output is a JSON string, try to parse and show as tree
  let parsed: JsonValue | null = null;
  if (typeof output === 'string') {
    try {
      const p = JSON.parse(output) as JsonValue;
      if (p !== null && typeof p === 'object') parsed = p;
    } catch {
      // plain string
    }
  }

  if (parsed) {
    return <JsonViewer data={parsed} defaultExpanded maxDepth={4} />;
  }

  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-xs">{String(output)}</pre>
  );
}

function ScriptEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: UserScript;
  onSave: (data: { name: string; description: string; script: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [script, setScript] = useState(initial?.script ?? '');

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed bg-card/50 p-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Script name"
        className="h-6 text-xs"
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="h-6 text-xs"
      />
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="JavaScript code..."
        className="min-h-[60px] rounded-md border bg-background px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          size="xs"
          onClick={() => onSave({ name: name.trim(), description: description.trim(), script: script.trim() })}
          disabled={!name.trim() || !script.trim()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

export default function CommandPalette() {
  const [filter, setFilter] = useState('');
  const [history, setHistory] = useState<(CommandResult & { command: Command })[]>([]);
  const [customScript, setCustomScript] = useState('');
  const [userScripts, setUserScripts] = useState<UserScript[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedCmdId, setSelectedCmdId] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  useEffect(() => {
    storageGet<UserScript[]>(STORAGE_KEY_USER_SCRIPTS, []).then(setUserScripts);
  }, []);

  const persistScripts = useCallback((next: UserScript[]) => {
    setUserScripts(next);
    storageSet(STORAGE_KEY_USER_SCRIPTS, next);
  }, []);

  const addScript = useCallback(
    (data: { name: string; description: string; script: string }) => {
      const script: UserScript = {
        id: `user-${Date.now()}`,
        name: data.name,
        description: data.description,
        script: data.script,
        enabled: true,
        order: userScripts.length,
      };
      persistScripts([...userScripts, script]);
      setAdding(false);
    },
    [userScripts, persistScripts],
  );

  const updateScript = useCallback(
    (id: string, data: { name: string; description: string; script: string }) => {
      persistScripts(userScripts.map((s) => (s.id === id ? { ...s, ...data } : s)));
      setEditing(null);
    },
    [userScripts, persistScripts],
  );

  const deleteScript = useCallback(
    (id: string) => {
      persistScripts(userScripts.filter((s) => s.id !== id));
    },
    [userScripts, persistScripts],
  );

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const items = [...userScripts];
    const [dragged] = items.splice(dragItem.current, 1);
    items.splice(dragOver.current, 0, dragged);
    const reordered = items.map((s, i) => ({ ...s, order: i }));
    persistScripts(reordered);
    dragItem.current = null;
    dragOver.current = null;
  };

  const categories = [...new Set(builtinCommands.map((c) => c.category))];

  const filteredBuiltin = filter
    ? builtinCommands.filter(
        (c) =>
          c.name.toLowerCase().includes(filter.toLowerCase()) ||
          c.description.toLowerCase().includes(filter.toLowerCase()) ||
          c.category.toLowerCase().includes(filter.toLowerCase()),
      )
    : builtinCommands;

  const filteredUserScripts = filter
    ? userScripts.filter(
        (s) =>
          s.name.toLowerCase().includes(filter.toLowerCase()) ||
          s.description.toLowerCase().includes(filter.toLowerCase()),
      )
    : userScripts;

  const run = useCallback(
    async (cmd: Command) => {
      setSelectedCmdId(cmd.id);
      const result = await executeCommand(cmd.script);
      result.commandId = cmd.id;
      setHistory((prev) => [{ ...result, command: cmd }, ...prev]);
    },
    [],
  );

  const runUserScript = useCallback(
    async (script: UserScript) => {
      const cmd: Command = {
        id: script.id,
        name: script.name,
        description: script.description,
        category: 'User',
        script: script.script,
      };
      await run(cmd);
    },
    [run],
  );

  const runCustom = useCallback(async () => {
    const trimmed = customScript.trim();
    if (!trimmed) return;
    const cmd: Command = {
      id: `custom-${Date.now()}`,
      name: 'Custom Script',
      description: trimmed.slice(0, 60),
      category: 'Custom',
      script: trimmed,
    };
    await run(cmd);
    setCustomScript('');
  }, [customScript, run]);

  const filteredHistory = selectedCmdId
    ? history.filter((e) => e.command.id === selectedCmdId || e.commandId === selectedCmdId)
    : history;

  const selectedCmdName = selectedCmdId
    ? (builtinCommands.find((c) => c.id === selectedCmdId)?.name
      ?? userScripts.find((s) => s.id === selectedCmdId)?.name
      ?? 'Custom Script')
    : null;

  const commandList = (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-2 py-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search commands..."
            className="h-6 pl-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Built-in Commands */}
          <h4 className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Built-in Commands
          </h4>
          {categories.map((cat) => {
            const cmds = filteredBuiltin.filter((c) => c.category === cat);
            if (cmds.length === 0) return null;
            return (
              <div key={cat} className="mb-2">
                <h4 className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                  {cat}
                </h4>
                {cmds.map((cmd) => (
                  <div
                    key={cmd.id}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/50',
                      selectedCmdId === cmd.id && 'bg-accent',
                    )}
                  >
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedCmdId(selectedCmdId === cmd.id ? null : cmd.id)}
                    >
                      <div className="text-xs font-medium">{cmd.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {cmd.description}
                      </div>
                    </button>
                    <Button variant="outline" size="icon-xs" onClick={() => run(cmd)} title="Run">
                      <Play className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })}

          {/* User Scripts */}
          <div className="mt-3 border-t pt-2">
            <div className="mb-1 flex items-center gap-2 px-1">
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                User Scripts
              </h4>
              <Badge variant="outline" className="h-4 rounded px-1 text-[10px]">
                {userScripts.length}
              </Badge>
              <div className="flex-1" />
              <Button variant="ghost" size="icon-xs" onClick={() => setAdding(true)}>
                <Plus className="size-3" />
              </Button>
            </div>

            {adding && (
              <ScriptEditor onSave={addScript} onCancel={() => setAdding(false)} />
            )}

            {filteredUserScripts.map((script, index) => (
              <div key={script.id}>
                {editing === script.id ? (
                  <ScriptEditor
                    initial={script}
                    onSave={(data) => updateScript(script.id, data)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <div
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-1 py-1.5 transition-colors hover:bg-accent/50',
                      selectedCmdId === script.id && 'bg-accent',
                    )}
                  >
                    <GripVertical className="size-3 shrink-0 cursor-grab text-muted-foreground/50" />
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedCmdId(selectedCmdId === script.id ? null : script.id)}
                    >
                      <div className="text-xs font-medium">{script.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {script.description}
                      </div>
                    </button>
                    <Button variant="outline" size="icon-xs" onClick={() => runUserScript(script)} title="Run">
                      <Play className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => setEditing(script.id)}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => deleteScript(script.id)}>
                      <X className="size-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {userScripts.length === 0 && !adding && (
              <p className="py-2 text-center text-[10px] text-muted-foreground italic">
                No user scripts — click + to add one
              </p>
            )}
          </div>
        </div>

        {/* Quick eval */}
        <div className="border-t p-2">
          <h4 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Quick Eval
          </h4>
          <div className="flex gap-1.5">
            <Input
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Enter JavaScript to evaluate..."
              className="h-6 flex-1 font-mono text-xs"
              onKeyDown={(e) => e.key === 'Enter' && runCustom()}
            />
            <Button
              variant="outline"
              size="icon-xs"
              onClick={runCustom}
              disabled={!customScript.trim()}
            >
              <Play className="size-3" />
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  const historyPanel = (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-2 py-1.5">
        <Clock className="size-3 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">History</span>
        {selectedCmdName && (
          <Badge variant="default" className="h-4 gap-1 rounded px-1.5 text-[10px]">
            {selectedCmdName}
            <button onClick={() => setSelectedCmdId(null)} className="opacity-60 hover:opacity-100">
              <X className="size-2.5" />
            </button>
          </Badge>
        )}
        <Badge variant="outline" className="h-4 rounded px-1 text-[10px]">
          {filteredHistory.length}
        </Badge>
        <div className="flex-1" />
        {history.length > 0 && (
          <Button variant="ghost" size="icon-xs" onClick={() => setHistory([])}>
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {filteredHistory.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground italic">
            {selectedCmdId ? 'No history for this command' : 'No commands executed yet'}
          </p>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {filteredHistory.map((entry, i) => (
              <div key={i} className="rounded-md border bg-card">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-2 py-1">
                  <span className="flex-1 truncate text-xs font-medium">
                    {entry.command.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{entry.duration}ms</span>
                  <Badge
                    variant={entry.error ? 'destructive' : 'outline'}
                    className="h-4 rounded px-1 text-[10px]"
                  >
                    {entry.error ? 'Error' : 'OK'}
                  </Badge>
                </div>
                <div className="p-2">
                  <ResultDisplay result={entry} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <SplitPane left={commandList} right={historyPanel} defaultRatio={40} />
  );
}
