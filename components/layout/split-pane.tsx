import * as React from 'react';
import { cn } from '@/lib/utils';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  defaultRatio?: number;
  minSize?: number;
  className?: string;
}

function SplitPane({
  left,
  right,
  direction = 'horizontal',
  defaultRatio = 50,
  minSize = 10,
  className,
}: SplitPaneProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = React.useState(defaultRatio);
  const dragging = React.useRef(false);

  const isHorizontal = direction === 'horizontal';

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pos = isHorizontal
          ? ((ev.clientX - rect.left) / rect.width) * 100
          : ((ev.clientY - rect.top) / rect.height) * 100;
        setRatio(Math.max(minSize, Math.min(100 - minSize, pos)));
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [isHorizontal, minSize],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full overflow-hidden',
        isHorizontal ? 'flex-row' : 'flex-col',
        className,
      )}
    >
      <div
        className="overflow-auto"
        style={
          isHorizontal ? { width: `${ratio}%` } : { height: `${ratio}%` }
        }
      >
        {left}
      </div>

      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'shrink-0 bg-border transition-colors hover:bg-primary/30',
          isHorizontal
            ? 'w-1 cursor-col-resize'
            : 'h-1 cursor-row-resize',
        )}
      />

      <div
        className="overflow-auto"
        style={
          isHorizontal
            ? { width: `${100 - ratio}%` }
            : { height: `${100 - ratio}%` }
        }
      >
        {right}
      </div>
    </div>
  );
}

export { SplitPane, type SplitPaneProps };
