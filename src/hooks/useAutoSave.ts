import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { serializeState } from '../utils/serialization';
import { AUTOSAVE_KEY, AUTOSAVE_DELAY } from '../utils/constants';

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Restore autosave on mount
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.players && Array.isArray(data.players)) {
          const shouldRestore = confirm('检测到自动保存的草稿，是否恢复？');
          if (shouldRestore) {
            (useAppStore as any).setState({
              players: data.players ?? [],
              bosses: data.bosses ?? [],
              maps: (data.maps ?? []).map((m: any) => ({ ...m, locked: m.locked ?? false })),
              activeMapId: data.activeMapId ?? null,
              annotations: data.annotations ?? [],
              viewport: data.viewport ?? { x: 0, y: 0, scale: 1 },
            });
          } else {
            localStorage.removeItem(AUTOSAVE_KEY);
          }
        }
      }
    } catch { /* ignore */ }

    // Subscribe to store changes for autosave
    const unsub = useAppStore.subscribe((_state) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          const state = useAppStore.getState();
          const json = serializeState(state as any);
          localStorage.setItem(AUTOSAVE_KEY, json);
        } catch { /* ignore */ }
      }, AUTOSAVE_DELAY);
    });

    return () => {
      unsub();
      clearTimeout(timerRef.current);
    };
  }, []);
}
