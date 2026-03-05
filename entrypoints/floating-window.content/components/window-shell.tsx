import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'motion/react';
import { TitleBar, TITLE_BAR_HEIGHT, type TabItem } from './title-bar';
import { ResizeHandle } from './resize-handle';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;
const MAX_WIDTH = 600;
const MAX_HEIGHT_RATIO = 0.8; // 80vh

interface WindowShellProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  collapsed: boolean;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCollapseToggle: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  children: React.ReactNode;
}

export function WindowShell({
  position,
  size,
  collapsed,
  tabs,
  activeTab,
  onTabChange,
  onCollapseToggle,
  onPositionChange,
  onSizeChange,
  children,
}: WindowShellProps) {
  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);
  const dragControls = useDragControls();

  // Sync MotionValues when state changes externally (e.g. storage load)
  useEffect(() => { x.set(position.x); }, [position.x, x]);
  useEffect(() => { y.set(position.y); }, [position.y, y]);

  const getConstraints = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const h = collapsed ? TITLE_BAR_HEIGHT : size.height;
    return {
      left: 0,
      top: 0,
      right: Math.max(0, vw - size.width),
      bottom: Math.max(0, vh - h),
    };
  }, [size.width, size.height, collapsed]);

  const handleDragEnd = useCallback(() => {
    onPositionChange({ x: x.get(), y: y.get() });
  }, [x, y, onPositionChange]);

  const handleResize = useCallback(
    (dx: number, dy: number) => {
      const maxHeight = Math.round(window.innerHeight * MAX_HEIGHT_RATIO);
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, size.width + dx));
      const newHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, size.height + dy));
      onSizeChange({ width: newWidth, height: newHeight });
    },
    [size.width, size.height, onSizeChange],
  );

  const handleResizeEnd = useCallback(() => {
    // Position change callback already handles persistence via debounce in App
  }, []);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      dragControls.start(e);
    },
    [dragControls],
  );

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={getConstraints()}
      style={{ x, y, width: size.width }}
      animate={{ height: collapsed ? TITLE_BAR_HEIGHT : size.height }}
      transition={{ height: { duration: 0.2, ease: 'easeInOut' } }}
      onDragEnd={handleDragEnd}
      className="fixed top-0 left-0 z-[2147483647] overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
    >
      <TitleBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        collapsed={collapsed}
        onCollapseToggle={onCollapseToggle}
        onPointerDown={startDrag}
      />

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ height: size.height - TITLE_BAR_HEIGHT }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize handles — only when expanded */}
      {!collapsed && (
        <>
          <ResizeHandle direction="right" onResize={handleResize} onResizeEnd={handleResizeEnd} />
          <ResizeHandle direction="bottom" onResize={handleResize} onResizeEnd={handleResizeEnd} />
          <ResizeHandle direction="corner" onResize={handleResize} onResizeEnd={handleResizeEnd} />
        </>
      )}
    </motion.div>
  );
}

export { TITLE_BAR_HEIGHT, MIN_WIDTH, MIN_HEIGHT, MAX_WIDTH, MAX_HEIGHT_RATIO };
