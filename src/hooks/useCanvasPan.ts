import { useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import { PAN_SPEED } from '../utils/constants';

export function useCanvasPan() {
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const setViewport = useAppStore((s) => s.setViewport);

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true;
    lastPos.current = { x: clientX, y: clientY };
  }, []);

  const movePan = useCallback(
    (clientX: number, clientY: number) => {
      if (!isPanning.current) return;
      const dx = (clientX - lastPos.current.x) * PAN_SPEED;
      const dy = (clientY - lastPos.current.y) * PAN_SPEED;
      lastPos.current = { x: clientX, y: clientY };
      const prev = useAppStore.getState().viewport;
      setViewport({ x: prev.x + dx, y: prev.y + dy });
    },
    [setViewport],
  );

  const endPan = useCallback(() => {
    isPanning.current = false;
  }, []);

  return { startPan, movePan, endPan, isPanning };
}
