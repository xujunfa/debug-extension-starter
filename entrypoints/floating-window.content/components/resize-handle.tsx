import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

type ResizeDirection = 'right' | 'bottom' | 'corner';

interface ResizeHandleProps {
  direction: ResizeDirection;
  onResize: (deltaX: number, deltaY: number) => void;
  onResizeEnd: () => void;
}

export function ResizeHandle({ direction, onResize, onResizeEnd }: ResizeHandleProps) {
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startPos.current = { x: e.clientX, y: e.clientY };

      const handlePointerMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startPos.current.x;
        const dy = ev.clientY - startPos.current.y;
        startPos.current = { x: ev.clientX, y: ev.clientY };

        switch (direction) {
          case 'right':
            onResize(dx, 0);
            break;
          case 'bottom':
            onResize(0, dy);
            break;
          case 'corner':
            onResize(dx, dy);
            break;
        }
      };

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        onResizeEnd();
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [direction, onResize, onResizeEnd],
  );

  return (
    <div
      onPointerDown={handlePointerDown}
      className={cn(
        'absolute z-10',
        direction === 'right' && 'top-0 -right-0.5 h-full w-1 cursor-e-resize',
        direction === 'bottom' && '-bottom-0.5 left-0 h-1 w-full cursor-s-resize',
        direction === 'corner' && '-right-0.5 -bottom-0.5 h-3 w-3 cursor-se-resize',
      )}
    >
      {direction === 'corner' && (
        <svg
          className="absolute right-0.5 bottom-0.5 h-2 w-2 text-muted-foreground/50"
          viewBox="0 0 8 8"
          fill="currentColor"
        >
          <circle cx="6" cy="6" r="1" />
          <circle cx="6" cy="2" r="1" />
          <circle cx="2" cy="6" r="1" />
        </svg>
      )}
    </div>
  );
}
