import { useState } from 'react';
import { Star, Zap, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { JsonViewer } from '@/components/debug/json-viewer';
import { KvDisplay } from '@/components/debug/kv-display';
import { CodeBlock } from '@/components/debug/code-block';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ── Section wrapper ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Sample data ── */

const sampleJson = {
  name: 'Chrome Extension',
  version: '1.0.0',
  features: ['headers', 'eval', 'ws-monitor'],
  config: { darkMode: true, compact: true },
};

const sampleCode = `function greet(name) {
  return \`Hello, \${name}!\`;
}`;

/* ── Showcase ── */

export default function Showcase() {
  const [switchOn, setSwitchOn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        {/* Buttons */}
        <Section title="Button">
          <div className="flex flex-wrap gap-1.5">
            <Button size="xs">Default</Button>
            <Button size="xs" variant="secondary">Secondary</Button>
            <Button size="xs" variant="destructive">Destructive</Button>
            <Button size="xs" variant="outline">Outline</Button>
            <Button size="xs" variant="ghost">Ghost</Button>
            <Button size="xs" variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="xs"><Zap className="size-3" />XS</Button>
            <Button size="sm"><Star className="size-3.5" />SM</Button>
            <Button>Default</Button>
            <Button size="lg">LG</Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="icon-xs"><Info className="size-3" /></Button>
            <Button size="icon-sm" variant="outline"><Star className="size-3.5" /></Button>
            <Button size="icon" variant="secondary"><Zap /></Button>
            <Button size="xs" disabled>Disabled</Button>
          </div>
        </Section>

        {/* Badge */}
        <Section title="Badge">
          <div className="flex flex-wrap gap-1.5">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        {/* Input */}
        <Section title="Input">
          <Input
            placeholder="Type something..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </Section>

        {/* Switch */}
        <Section title="Switch">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Switch size="sm" checked={switchOn} onCheckedChange={setSwitchOn} />
              <span className="text-xs text-muted-foreground">SM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
              <span className="text-xs text-muted-foreground">
                {switchOn ? 'On' : 'Off'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Switch disabled />
              <span className="text-xs text-muted-foreground">Disabled</span>
            </div>
          </div>
        </Section>

        {/* Checkbox */}
        <Section title="Checkbox">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
              {checked ? 'Checked' : 'Unchecked'}
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Checkbox disabled />
              Disabled
            </label>
          </div>
        </Section>

        {/* JsonViewer */}
        <Section title="JsonViewer">
          <JsonViewer data={sampleJson} defaultExpanded maxDepth={3} />
        </Section>

        {/* KvDisplay */}
        <Section title="KvDisplay">
          <KvDisplay
            groups={[
              {
                title: 'Request',
                items: [
                  { key: 'Method', value: 'GET' },
                  { key: 'URL', value: 'https://api.example.com/data' },
                  { key: 'Status', value: <Badge variant="secondary">200</Badge>, highlight: true },
                ],
              },
              {
                title: 'Headers',
                items: [
                  { key: 'Content-Type', value: 'application/json' },
                  { key: 'Authorization', value: 'Bearer ***' },
                ],
                defaultCollapsed: true,
              },
            ]}
          />
        </Section>

        {/* CodeBlock */}
        <Section title="CodeBlock">
          <CodeBlock
            code={sampleCode}
            language="JavaScript"
            title="example.js"
            showLineNumbers
            maxHeight="120px"
          />
        </Section>
      </div>
    </ScrollArea>
  );
}
