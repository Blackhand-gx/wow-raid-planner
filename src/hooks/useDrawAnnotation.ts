import { useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import type { ArrowAnnotation, LineAnnotation, CircleAnnotation, RectAnnotation, TextAnnotation } from '../types';

export function useDrawAnnotation() {
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const addAnnotation = useAppStore((s) => s.addAnnotation);
  const setActiveTool = useAppStore((s) => s.setActiveTool);

  const getCanvasPos = useCallback((stage: any) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointer);
  }, []);

  const handleDrawStart = useCallback(
    (e: any) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = getCanvasPos(stage);
      if (!pos) return;

      const tool = useAppStore.getState().activeTool;

      if (tool === 'text') {
        const name = prompt('输入标注文字:');
        if (!name) return;
        const color = useAppStore.getState().annotationColor;
        const ta: Omit<TextAnnotation, 'id'> = {
          type: 'text',
          layer: 'front',
          color,
          strokeWidth: 1,
          opacity: 1,
          x: pos.x,
          y: pos.y,
          text: name,
          fontSize: 16,
        };
        addAnnotation(ta as any);
        setActiveTool('select');
        return;
      }

      isDrawing.current = true;
      startPos.current = pos;
    },
    [addAnnotation, setActiveTool, getCanvasPos],
  );

  const handleDrawEnd = useCallback(
    (e: any) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const stage = e.target.getStage();
      if (!stage) return;
      const pos = getCanvasPos(stage);
      if (!pos) return;

      const tool = useAppStore.getState().activeTool;
      const color = useAppStore.getState().annotationColor;
      const dx = Math.abs(pos.x - startPos.current.x);
      const dy = Math.abs(pos.y - startPos.current.y);

      if (dx < 3 && dy < 3) return;

      if (tool === 'arrow') {
        const a: Omit<ArrowAnnotation, 'id'> = {
          type: 'arrow',
          layer: 'front',
          color,
          strokeWidth: 2,
          opacity: 1,
          points: [startPos.current.x, startPos.current.y, pos.x, pos.y],
          headSize: 12,
        };
        addAnnotation(a as any);
      } else if (tool === 'line') {
        const a: Omit<LineAnnotation, 'id'> = {
          type: 'line',
          layer: 'front',
          color,
          strokeWidth: 2,
          opacity: 1,
          points: [startPos.current.x, startPos.current.y, pos.x, pos.y],
          dash: [],
        };
        addAnnotation(a as any);
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - startPos.current.x);
        const ry = Math.abs(pos.y - startPos.current.y);
        const a: Omit<CircleAnnotation, 'id'> = {
          type: 'circle',
          layer: 'back',
          color,
          strokeWidth: 2,
          opacity: 1,
          x: (startPos.current.x + pos.x) / 2,
          y: (startPos.current.y + pos.y) / 2,
          radiusX: Math.max(rx, 20),
          radiusY: Math.max(ry, 20),
          filled: false,
        };
        addAnnotation(a as any);
      } else if (tool === 'rect') {
        const a: Omit<RectAnnotation, 'id'> = {
          type: 'rect',
          layer: 'back',
          color,
          strokeWidth: 2,
          opacity: 1,
          x: Math.min(startPos.current.x, pos.x),
          y: Math.min(startPos.current.y, pos.y),
          width: Math.max(dx, 20),
          height: Math.max(dy, 20),
          filled: false,
        };
        addAnnotation(a as any);
      }
    },
    [addAnnotation, getCanvasPos],
  );

  return { handleDrawStart, handleDrawEnd, isDrawing, startPos };
}
