import { sendRequest } from '@/lib/messaging/request';
import { connectToBackground, eventBus } from '@/lib/messaging/events';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShowcasePage from './pages/showcase';
import TemplatesPage from './pages/templates';

interface PingResult {
  source: string;
  timestamp: number;
  rtt: number;
}

function ConnectionPanel() {
  const [contentReady, setContentReady] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [lastPing, setLastPing] = useState<PingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabId = browser.devtools.inspectedWindow.tabId;

  useEffect(() => {
    const { disconnect } = connectToBackground(tabId);
    const unsub = eventBus.on('CONTENT_SCRIPT_STATUS', (data) => {
      setContentReady(data.ready);
    });

    return () => {
      unsub();
      disconnect();
    };
  }, [tabId]);

  const handlePing = async () => {
    setPinging(true);
    setError(null);

    const start = Date.now();
    try {
      const response = await sendRequest(
        'PING',
        { source: 'devtools' },
        { forwardToTab: tabId },
      );
      setLastPing({
        source: response.source,
        timestamp: response.timestamp,
        rtt: Date.now() - start,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ping failed');
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Connection Status
        </h2>

        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${contentReady ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-sm">
            Content Script: {contentReady ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePing}
            disabled={pinging || !contentReady}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {pinging ? 'Pinging...' : 'Send Ping'}
          </button>

          {lastPing && (
            <span className="text-sm text-muted-foreground">
              Pong from <strong>{lastPing.source}</strong> — RTT: {lastPing.rtt}ms
            </span>
          )}

          {error && (
            <span className="text-sm text-destructive">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex h-screen flex-col">
      <div className="shrink-0 border-b px-4 py-2">
        <h1 className="text-lg font-bold">Debug Extension Starter</h1>
      </div>

      <Tabs defaultValue="templates" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
          <TabsTrigger
            value="templates"
            className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Templates
          </TabsTrigger>
          <TabsTrigger
            value="home"
            className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Home
          </TabsTrigger>
          <TabsTrigger
            value="showcase"
            className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Components
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-0 flex-1 overflow-hidden">
          <TemplatesPage />
        </TabsContent>
        <TabsContent value="home" className="mt-0 flex-1 overflow-auto">
          <ConnectionPanel />
        </TabsContent>
        <TabsContent value="showcase" className="mt-0 flex-1 overflow-hidden">
          <ShowcasePage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
