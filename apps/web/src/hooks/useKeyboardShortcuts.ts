'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean; // Cmd on Mac
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
        const shiftMatch = shortcut.shift === undefined ? true : shortcut.shift === e.shiftKey;
        const altMatch = shortcut.alt === undefined ? true : shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

// Helper to detect if user is on Mac
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  NEW: { key: 'n', ctrl: true, description: 'Criar novo item' },
  SEARCH: { key: 'k', ctrl: true, description: 'Buscar' },
  ESCAPE: { key: 'Escape', description: 'Fechar modal/cancelar' },
};

