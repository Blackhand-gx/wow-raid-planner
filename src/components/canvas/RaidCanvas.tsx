import { useRef, useCallback, useState, useEffect, Component } from 'react';
import { Stage, Layer, Rect, Arrow, Line as KonvaLine, Ellipse } from 'react-konva';
import Konva from 'konva';

class ErrBnd extends Component<{ children: React.ReactNode }, { err: Error | null }> {
  state: { err: Error | null } = { err: null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{
          position: 'absolute', inset: 0, background: '#1a0000', color: '#ff4444',
          zIndex: 99999, padding: 20, fontFamily: 'monospace', fontSize: 13,
          whiteSpace: 'pre-wrap', overflow: 'auto', border: '2px solid red',
        }}>
          <strong>FloatingLayerBar Error:</strong>{'\n'}
          {this.state.err.message}{'\n\n'}
          {this.state.err.stack}
        </div>
      );
    }
    return this.props.children;
  }
}
import { useAppStore } from '../../store';
import { useCanvasZoom } from '../../hooks/useCanvasZoom';
import { useCanvasPan } from '../../hooks/useCanvasPan';
import { BackgroundLayer } from './BackgroundLayer';
import { UnifiedEntityLayer } from './UnifiedEntityLayer';
import { FloatingLayerBar } from './FloatingLayerBar';
import { SelectionLayer } from './SelectionLayer';
import { ScreenshotLayer } from './ScreenshotLayer';
import { useDrawAnnotation } from '../../hooks/useDrawAnnotation';
import type { ToolType } from '../../types';

interface SelectRect {
  x: number; y: number; width: number; height: number;
}

interface DrawingPreview {
  type: ToolType;
  color: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

export function RaidCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const viewport = useAppStore((s) => s.viewport);
  const activeTool = useAppStore((s) => s.activeTool);
  const isImportMode = useAppStore((s) => s.isImportMode);
  const players = useAppStore((s) => s.players);
  const bosses = useAppStore((s) => s.bosses);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const deselectAll = useAppStore((s) => s.deselectAll);
  const { handleWheel } = useCanvasZoom();
  const { startPan, movePan, endPan } = useCanvasPan();
  const { handleDrawStart, handleDrawEnd, isDrawing, startPos: drawStartPos } = useDrawAnnotation();

  const stageWidth = useAppStore((s) => s.stageWidth);
  const stageHeight = useAppStore((s) => s.stageHeight);
  const setStageSize = useAppStore((s) => s.setStageSize);

  const [selectRect, setSelectRect] = useState<SelectRect | null>(null);
  const [drawingPreview, setDrawingPreview] = useState<DrawingPreview | null>(null);
  const isSelecting = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setStageSize(width, height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [setStageSize]);

  const getCanvasPos = useCallback((stage: Konva.Stage): { x: number; y: number } | null => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointer);
  }, []);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === 'pan' || e.evt.button === 1) {
        startPan(e.evt.clientX, e.evt.clientY);
        return;
      }

      // Import mode: click on canvas to place a player
      if (isImportMode && activeTool === 'select') {
        const stage = e.target.getStage();
        if (stage && e.target === stage) {
          const pos = getCanvasPos(stage);
          if (pos) {
            window.dispatchEvent(new CustomEvent('import-click', { detail: { x: pos.x, y: pos.y } }));
          }
        }
        return;
      }

      if (activeTool === 'select') {
        const stage = e.target.getStage();
        if (!stage) return;
        if (e.target === stage) {
          const pos = getCanvasPos(stage);
          if (!pos) return;
          isSelecting.current = true;
          startPos.current = pos;
          setSelectRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
          if (!e.evt.shiftKey) deselectAll();
        }
        return;
      }

      // Marker tool — click to place
      if (activeTool === 'marker') {
        const stage = e.target.getStage();
        if (!stage || e.target !== stage) return;
        const pos = getCanvasPos(stage);
        if (!pos) return;
        const store = useAppStore.getState();
        store.addAnnotation({
          type: 'marker',
          layer: 'front',
          color: '#FFFFFF',
          strokeWidth: 0,
          opacity: 1,
          x: pos.x,
          y: pos.y,
          markerType: store.markerType,
        } as any);
        return;
      }

      // Drawing tools — only start on empty canvas, not on existing shapes
      if (['arrow', 'line', 'circle', 'rect', 'text'].includes(activeTool)) {
        const stage = e.target.getStage();
        if (!stage || e.target !== stage) return;
        handleDrawStart(e);
        return;
      }
    },
    [activeTool, isImportMode, startPan, getCanvasPos, deselectAll, handleDrawStart],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      movePan(e.evt.clientX, e.evt.clientY);

      if (isSelecting.current) {
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = getCanvasPos(stage);
        if (!pos) return;
        setSelectRect({
          x: Math.min(startPos.current.x, pos.x),
          y: Math.min(startPos.current.y, pos.y),
          width: Math.abs(pos.x - startPos.current.x),
          height: Math.abs(pos.y - startPos.current.y),
        });
      }

      // Drawing preview
      if (isDrawing.current) {
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = getCanvasPos(stage);
        if (!pos) return;
        const color = useAppStore.getState().annotationColor;
        setDrawingPreview({
          type: activeTool,
          color,
          x1: drawStartPos.current.x,
          y1: drawStartPos.current.y,
          x2: pos.x,
          y2: pos.y,
        });
      }
    },
    [movePan, getCanvasPos, activeTool],
  );

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    endPan();

    // Drawing tool end
    if (['arrow', 'line', 'circle', 'rect'].includes(activeTool)) {
      handleDrawEnd(e);
      setDrawingPreview(null);
    }

    if (isSelecting.current && selectRect) {
      isSelecting.current = false;
      const sel = selectRect;
      setSelectRect(null);

      if (sel.width < 5 && sel.height < 5) return;

      const hitIds: string[] = [];
      for (const p of players) {
        if (p.x >= sel.x && p.x <= sel.x + sel.width &&
            p.y >= sel.y && p.y <= sel.y + sel.height) {
          hitIds.push(p.id);
        }
      }
      for (const b of bosses) {
        if (b.x >= sel.x && b.x <= sel.x + sel.width &&
            b.y >= sel.y && b.y <= sel.y + sel.height) {
          hitIds.push(b.id);
        }
      }
      if (hitIds.length > 0) {
        setSelectedIds(hitIds);
      }
    }
  }, [activeTool, endPan, selectRect, players, bosses, setSelectedIds, handleDrawEnd]);

  return (
    <div
      ref={containerRef}
      data-canvas-root
      style={{
        width: '100%', height: '100%', overflow: 'hidden', background: '#0a0a14',
        cursor: activeTool === 'eraser' ? 'crosshair' : activeTool === 'pan' ? 'grab' : activeTool === 'marker' ? 'crosshair' : 'default',
      }}
    >
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer>
          <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#0a0a14" listening={false} />
        </Layer>
        <ScreenshotLayer />
        <BackgroundLayer />
        <UnifiedEntityLayer />
        {drawingPreview && <DrawingPreviewLayer preview={drawingPreview} />}
        <SelectionLayer selectRect={selectRect} />
      </Stage>
      <ErrBnd><FloatingLayerBar /></ErrBnd>
    </div>
  );
}

function DrawingPreviewLayer({ preview }: { preview: DrawingPreview }) {
  const { type, color, x1, y1, x2, y2 } = preview;
  const dash = [6, 4];

  switch (type) {
    case 'arrow':
      return (
        <Layer>
          <Arrow
            points={[x1, y1, x2, y2]}
            fill={color}
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            dash={dash}
            pointerLength={12}
            pointerWidth={7}
            listening={false}
            strokeScaleEnabled={false}
          />
        </Layer>
      );
    case 'line':
      return (
        <Layer>
          <KonvaLine
            points={[x1, y1, x2, y2]}
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            dash={dash}
            listening={false}
            strokeScaleEnabled={false}
          />
        </Layer>
      );
    case 'circle': {
      const rx = Math.abs(x2 - x1);
      const ry = Math.abs(y2 - y1);
      return (
        <Layer>
          <Ellipse
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2}
            radiusX={Math.max(rx, 20)}
            radiusY={Math.max(ry, 20)}
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            dash={dash}
            listening={false}
            strokeScaleEnabled={false}
          />
        </Layer>
      );
    }
    case 'rect': {
      const rx = Math.min(x1, x2);
      const ry = Math.min(y1, y2);
      const rw = Math.max(Math.abs(x2 - x1), 20);
      const rh = Math.max(Math.abs(y2 - y1), 20);
      return (
        <Layer>
          <Rect
            x={rx}
            y={ry}
            width={rw}
            height={rh}
            stroke={color}
            strokeWidth={2}
            opacity={0.5}
            dash={dash}
            listening={false}
            strokeScaleEnabled={false}
          />
        </Layer>
      );
    }
    default:
      return null;
  }
}
