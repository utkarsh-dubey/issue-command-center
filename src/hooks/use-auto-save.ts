"use client";

import { useEffect, useRef, useState } from "react";

type AutoSaveState = "idle" | "saving" | "saved" | "error";

export function useAutoSave<T>(options: {
  data: T;
  isReady: boolean;
  delay?: number;
  onSave: (data: T) => Promise<void>;
}) {
  const { data, isReady, delay = 500, onSave } = options;
  const [state, setState] = useState<AutoSaveState>("idle");
  const lastSavedRef = useRef<string>("");
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!isReady) return;

    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;

    setState("saving");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          await onSaveRef.current(data);
          lastSavedRef.current = serialized;
          setState("saved");
        } catch {
          setState("error");
        }
      })();
    }, delay);

    return () => clearTimeout(timer);
  }, [data, isReady, delay]);

  const reset = (initialData: T) => {
    lastSavedRef.current = JSON.stringify(initialData);
    setState("idle");
  };

  return { state, reset };
}

export function getAutoSaveLabel(state: AutoSaveState) {
  if (state === "saving") return "Saving...";
  if (state === "saved") return "Saved";
  if (state === "error") return "Save failed";
  return "";
}
