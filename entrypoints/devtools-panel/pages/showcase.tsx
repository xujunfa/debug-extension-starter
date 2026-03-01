import { JsonViewer, type JsonValue } from '@/components/debug/json-viewer';
import { KvDisplay, type KvItem, type KvGroupProps } from '@/components/debug/kv-display';
import { CodeBlock } from '@/components/debug/code-block';
import { PanelLayout } from '@/components/layout/panel-layout';
import { SplitPane } from '@/components/layout/split-pane';
import { TabLayout } from '@/components/layout/tab-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info } from 'lucide-react';

const sampleJson: JsonValue = {
  user: {
    name: 'Alice',
    age: 30,
    active: true,
    address: {
      city: 'Shanghai',
      zip: '200000',
      coordinates: { lat: 31.2304, lng: 121.4737 },
    },
    tags: ['admin', 'developer'],
    metadata: null,
  },
  config: {
    debug: true,
    features: ['logging', 'profiling', 'tracing'],
    limits: { maxRetries: 3, timeout: 5000 },
  },
};

const kvItems: KvItem[] = [
  { key: 'Status', value: <Badge variant="default">Active</Badge> },
  { key: 'URL', value: 'https://example.com/api/v1/data' },
  { key: 'Method', value: 'GET', highlight: true },
  { key: 'Duration', value: '142ms' },
  { key: 'Content-Type', value: 'application/json' },
];

const kvGroups: KvGroupProps[] = [
  {
    title: 'Request Headers',
    items: [
      { key: 'Accept', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer ****' },
      { key: 'User-Agent', value: 'Chrome/120.0' },
    ],
  },
  {
    title: 'Response Headers',
    defaultCollapsed: true,
    items: [
      { key: 'Content-Length', value: '1024' },
      { key: 'Cache-Control', value: 'no-cache' },
      { key: 'X-Request-Id', value: 'abc-123-def' },
    ],
  },
];

const sampleCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55`;

const sampleCommand = `$ curl -X POST https://api.example.com/data \\
  -H "Content-Type: application/json" \\
  -d '{"key": "value"}'

{"status": "ok", "id": 42}`;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-6 p-4">
        <h2 className="text-lg font-bold">Component Showcase</h2>

        {/* shadcn/ui base components */}
        <Section title="Button">
          <div className="flex flex-wrap gap-2">
            <Button size="xs">XS</Button>
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        <Section title="Input">
          <div className="flex gap-2">
            <Input placeholder="Type something..." className="max-w-xs" />
            <Input placeholder="Disabled" disabled className="max-w-xs" />
          </div>
        </Section>

        <Section title="Tooltip">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="mr-1 size-3.5" />
                  Hover me
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Section>

        {/* Debug components */}
        <Section title="JSON Viewer">
          <JsonViewer data={sampleJson} maxDepth={3} />
        </Section>

        <Section title="Key-Value Display (Flat)">
          <KvDisplay items={kvItems} />
        </Section>

        <Section title="Key-Value Display (Grouped)">
          <KvDisplay groups={kvGroups} />
        </Section>

        <Section title="Code Block">
          <CodeBlock
            code={sampleCode}
            language="javascript"
            title="fibonacci.js"
            showLineNumbers
          />
        </Section>

        <Section title="Code Block (Command)">
          <CodeBlock code={sampleCommand} language="bash" title="Terminal" />
        </Section>

        {/* Layout components */}
        <Section title="TabLayout">
          <div className="h-48 rounded-md border">
            <TabLayout
              tabs={[
                {
                  id: 'tab1',
                  label: 'Overview',
                  content: (
                    <p className="text-sm text-muted-foreground">
                      Overview content goes here.
                    </p>
                  ),
                },
                {
                  id: 'tab2',
                  label: 'Details',
                  content: (
                    <JsonViewer
                      data={{ status: 'ok', count: 42, items: ['a', 'b'] }}
                    />
                  ),
                },
                {
                  id: 'tab3',
                  label: 'Source',
                  content: (
                    <CodeBlock code="const x = 1;" language="js" />
                  ),
                },
              ]}
            />
          </div>
        </Section>

        <Section title="SplitPane (Horizontal)">
          <div className="h-48 rounded-md border">
            <SplitPane
              left={
                <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
                  Left Pane (drag divider)
                </div>
              }
              right={
                <div className="flex h-full items-center justify-center bg-muted/10 text-sm text-muted-foreground">
                  Right Pane
                </div>
              }
            />
          </div>
        </Section>

        <Section title="SplitPane (Vertical)">
          <div className="h-48 rounded-md border">
            <SplitPane
              direction="vertical"
              left={
                <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
                  Top Pane
                </div>
              }
              right={
                <div className="flex h-full items-center justify-center bg-muted/10 text-sm text-muted-foreground">
                  Bottom Pane
                </div>
              }
            />
          </div>
        </Section>

        <Section title="PanelLayout">
          <div className="h-48 rounded-md border">
            <PanelLayout
              header={
                <span className="text-xs font-semibold">Panel Header</span>
              }
              footer={
                <span className="text-xs text-muted-foreground">
                  Footer info
                </span>
              }
            >
              <p className="text-sm text-muted-foreground">
                Panel body with scrollable content area. The header and footer
                remain fixed while this area scrolls.
              </p>
            </PanelLayout>
          </div>
        </Section>
      </div>
    </ScrollArea>
  );
}
