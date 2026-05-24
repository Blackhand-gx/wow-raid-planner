import { useCallback } from 'react';
import { useAppStore } from '../store';
import { ZOOM_SPEED, MIN_SCALE, MAX_SCALE } from '../utils/constants';

export function useCanvasZoom() {
  const setViewport = useAppStore((s) => s.setViewport);

  const handleWheel = useCallback(
    (e: { evt: WheelEvent }) => {
      e.evt.preventDefault();
      const stage = e.evt.currentTarget as HTMLElement;
      const rect = stage.getBoundingClientRect();
      const pointerX = e.evt.clientX - rect.left;
      const pointerY = e.evt.clientY - rect.top;

      const state = useAppStore.getState();
      const prev = state.viewport;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1 + direction * ZOOM_SPEED * 3;

      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
      const newX = pointerX - (pointerX - prev.x) * (newScale / prev.scale);
      const newY = pointerY - (pointerY - prev.y) * (newScale / prev.scale);
      setViewport({ x: newX, y: newY, scale: newScale });
    },
    [setViewport],
  );

  return { handleWheel };
}
