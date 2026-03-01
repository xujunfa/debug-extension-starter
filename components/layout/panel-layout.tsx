import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PanelLayoutProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function PanelLayout({ header, footer, children, className }: PanelLayoutProps) {
  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {header && (
        <div className="shrink-0 border-b bg-muted/30 px-4 py-2">
          {header}
        </div>
      )}
      <ScrollArea className="flex-1">
        <div className="p-4">{children}</div>
      </ScrollArea>
      {footer && (
        <div className="shrink-0 border-t bg-muted/30 px-4 py-2">
          {footer}
        </div>
      )}
    </div>
  );
}

export { PanelLayout, type PanelLayoutProps };
