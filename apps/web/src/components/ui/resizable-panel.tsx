'use client';

/**
 * Resizable Panel Component
 * 
 * A collapsible and resizable panel similar to Cursor's agent panel.
 * Supports drag-to-resize and toggle collapse functionality.
 */

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PanelRightClose, PanelRight, GripVertical } from 'lucide-react';

interface ResizablePanelProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  defaultCollapsed?: boolean;
  position?: 'left' | 'right';
  className?: string;
  headerContent?: ReactNode;
  onCollapsedChange?: (collapsed: boolean) => void;
  onWidthChange?: (width: number) => void;
  showCollapseButton?: boolean;
}

export function ResizablePanel({
  children,
  defaultWidth = 400,
  minWidth = 280,
  maxWidth = 600,
  defaultCollapsed = false,
  position = 'right',
  className,
  headerContent,
  onCollapsedChange,
  onWidthChange,
  showCollapseButton = true,
}: ResizablePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const delta = position === 'right' 
      ? startXRef.current - e.clientX 
      : e.clientX - startXRef.current;
    
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
    setWidth(newWidth);
    onWidthChange?.(newWidth);
  }, [isResizing, minWidth, maxWidth, position, onWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const toggleCollapsed = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  // Collapsed state - just show toggle button
  if (isCollapsed) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center border-border',
          position === 'right' ? 'border-l' : 'border-r',
          'bg-card'
        )}
        style={{ width: 48 }}
      >
        <button
          onClick={toggleCollapsed}
          className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          title="Expand panel"
        >
          {position === 'right' ? (
            <PanelRight className="h-5 w-5" />
          ) : (
            <PanelRightClose className="h-5 w-5" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative flex flex-col bg-card',
        position === 'right' ? 'border-l' : 'border-r',
        'border-border',
        isResizing && 'select-none',
        className
      )}
      style={{ width, flexShrink: 0 }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-1 cursor-col-resize z-10 group',
          'hover:bg-primary/30 transition-colors',
          isResizing && 'bg-primary/50',
          position === 'right' ? 'left-0 -ml-0.5' : 'right-0 -mr-0.5'
        )}
        onMouseDown={handleMouseDown}
      >
        <div className={cn(
          'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
          position === 'right' ? '-left-1.5' : '-right-1.5'
        )}>
          <GripVertical className="h-6 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Header with collapse button - only render if there's content or collapse button */}
      {(headerContent || showCollapseButton) && (
      <div className="flex items-center justify-between h-12 px-3 border-b border-border shrink-0">
        <div className="flex-1 min-w-0">
          {headerContent}
        </div>
        {showCollapseButton && (
          <button
            onClick={toggleCollapsed}
            className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground ml-2"
            title="Collapse panel"
          >
            {position === 'right' ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRight className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

