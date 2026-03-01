import { sendRequest } from '@/lib/messaging/request';
import { connectToBackground, eventBus } from '@/lib/messaging/events';

interface PingResult {
  source: string;
  timestamp: number;
  rtt: number;
}

export default function App() {
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
    <div className="flex h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Debug Tool Scaffold</h1>

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
