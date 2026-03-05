"use client";

import { useEffect } from "react";

interface ShortcutOptions {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  preventDefault?: boolean;
  ignoreInputs?: boolean;
}

export function useKeyboardShortcut(options: ShortcutOptions) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (options.ignoreInputs !== false) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        ) {
          if (!(options.meta || options.ctrl)) return;
        }
      }

      const metaMatch = options.meta ? e.metaKey : !e.metaKey || options.ctrl;
      const ctrlMatch = options.ctrl ? e.ctrlKey : !e.ctrlKey || options.meta;
      const shiftMatch = options.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = options.alt ? e.altKey : !e.altKey;

      if (e.key.toLowerCase() === options.key.toLowerCase() && metaMatch && ctrlMatch && shiftMatch && altMatch) {
        if (options.preventDefault !== false) {
          e.preventDefault();
        }
        options.callback();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [options]);
}

export function useKeyboardShortcuts(shortcuts: ShortcutOptions[]) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        if (shortcut.ignoreInputs !== false) {
          const target = e.target as HTMLElement;
          if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable
          ) {
            if (!(shortcut.meta || shortcut.ctrl)) continue;
          }
        }

        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey || shortcut.ctrl;
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey || shortcut.meta;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && metaMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.callback();
          return;
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
