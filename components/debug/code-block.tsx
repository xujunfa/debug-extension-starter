import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
}

function CodeBlock({
  code,
  language,
  title,
  showLineNumbers = false,
  maxHeight = '300px',
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lines = code.split('\n');

  return (
    <div className={cn('overflow-hidden rounded-md border bg-card', className)}>
      {(title || language) && (
        <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5">
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-xs font-medium text-foreground">
                {title}
              </span>
            )}
            {language && (
              <Badge variant="outline" className="h-4 rounded px-1 text-[10px]">
                {language}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            className="text-muted-foreground"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
        </div>
      )}

      <ScrollArea style={{ maxHeight }}>
        <div className="p-3">
          <pre className="font-mono text-xs leading-relaxed">
            {showLineNumbers ? (
              <table className="border-collapse">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="select-none pr-4 text-right text-muted-foreground/50">
                        {i + 1}
                      </td>
                      <td className="whitespace-pre-wrap break-all">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <code className="whitespace-pre-wrap break-all">{code}</code>
            )}
          </pre>
        </div>
      </ScrollArea>

      {!title && !language && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="absolute right-2 top-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </Button>
      )}
    </div>
  );
}

export { CodeBlock, type CodeBlockProps };
