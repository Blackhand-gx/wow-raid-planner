import { useState, useEffect } from 'react';
import { Arrow, Line, Ellipse, Text, Rect, Image as KonvaImage } from 'react-konva';
import { useAppStore } from '../../store';
import type { Annotation, ArrowAnnotation, LineAnnotation, CircleAnnotation, RectAnnotation, TextAnnotation, MarkerAnnotation } from '../../types';

export function AnnotationNode({ a }: { a: Annotation }) {
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const activeTool = useAppStore((s) => s.activeTool);
  const markerSize = useAppStore((s) => s.markerSize);
  const isSelect = activeTool === 'select';
  const [hovered, setHovered] = useState(false);
  const [markerImg, setMarkerImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (a.type !== 'marker') return;
    const img = new window.Image();
    img.onload = () => setMarkerImg(img);
    img.src = `/raid-markers/${(a as MarkerAnnotation).markerType}.png`;
  }, [(a as MarkerAnnotation).markerType]);

  const handleClick = (e: any) => {
    const store = useAppStore.getState();
    if (store.activeTool === 'eraser') {
      store.removeAnnotation(a.id);
      return;
    }
    if (store.activeTool !== 'select') return;
    if (e.evt.shiftKey) {
      const current = store.selectedIds;
      setSelectedIds(current.includes(a.id) ? current.filter((id) => id !== a.id) : [...current, a.id]);
    } else {
      setSelectedIds([a.id]);
    }
  };

  const handleDragStart = () => {
    const s = useAppStore.getState();
    s.pushSnapshot({
      players: JSON.stringify(s.players),
      bosses: JSON.stringify(s.bosses),
      annotations: JSON.stringify(s.annotations),
      viewport: JSON.stringify(s.viewport),
      renderOrder: JSON.stringify(s.renderOrder),
    });
  };

  const eraser = activeTool === 'eraser';
  const glowColor = hovered ? (eraser ? '#ff4444' : a.color) : undefined;
  const glowBlur = hovered ? 10 : 0;
  const hoverStrokeW = hovered ? 1.5 : 1;

  const hoverBaseProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  const glowProps = {
    shadowColor: glowColor,
    shadowBlur: glowBlur,
    shadowEnabled: hovered,
    shadowOpacity: hovered ? 0.9 : 0,
  };

  switch (a.type) {
    case 'arrow': {
      const aa = a as ArrowAnnotation;
      return (
        <Arrow
          key={a.id}
          points={aa.points}
          fill={aa.color}
          stroke={aa.color}
          strokeWidth={aa.strokeWidth * hoverStrokeW}
          opacity={hovered ? 1 : aa.opacity}
          pointerLength={aa.headSize}
          pointerWidth={aa.headSize * 0.6}
          draggable={isSelect}
          onDragStart={handleDragStart}
          onDragEnd={(e: any) => {
            const n = e.target; const dx = n.x(); const dy = n.y();
            const pts = aa.points;
            useAppStore.getState().updateAnnotation(a.id, {
              points: [pts[0] + dx, pts[1] + dy, pts[2] + dx, pts[3] + dy],
            } as any);
            n.x(0); n.y(0);
          }}
          onClick={handleClick}
          onTap={handleClick}
          strokeScaleEnabled={false}
          {...hoverBaseProps}
          {...glowProps}
        />
      );
    }
    case 'line': {
      const la = a as LineAnnotation;
      return (
        <Line
          key={a.id}
          points={la.points}
          stroke={la.color}
          strokeWidth={la.strokeWidth * hoverStrokeW}
          opacity={hovered ? 1 : la.opacity}
          dash={la.dash.length > 0 ? la.dash : undefined}
          draggable={isSelect}
          onDragStart={handleDragStart}
          onDragEnd={(e: any) => {
            const n = e.target; const dx = n.x(); const dy = n.y();
            const pts = la.points;
            useAppStore.getState().updateAnnotation(a.id, {
              points: [pts[0] + dx, pts[1] + dy, pts[2] + dx, pts[3] + dy],
            } as any);
            n.x(0); n.y(0);
          }}
          onClick={handleClick}
          onTap={handleClick}
          strokeScaleEnabled={false}
          {...hoverBaseProps}
          {...glowProps}
        />
      );
    }
    case 'circle': {
      const ca = a as CircleAnnotation;
      return (
        <Ellipse
          key={a.id}
          x={ca.x}
          y={ca.y}
          radiusX={ca.radiusX}
          radiusY={ca.radiusY}
          stroke={ca.color}
          strokeWidth={ca.strokeWidth * hoverStrokeW}
          opacity={hovered ? 1 : ca.opacity}
          fill={ca.filled ? ca.color + '33' : undefined}
          draggable={isSelect}
          onDragStart={handleDragStart}
          onDragEnd={(e: any) => {
            useAppStore.getState().updateAnnotation(a.id, {
              x: e.target.x(), y: e.target.y(),
            } as any);
          }}
          onClick={handleClick}
          onTap={handleClick}
          strokeScaleEnabled={false}
          {...hoverBaseProps}
          {...glowProps}
        />
      );
    }
    case 'rect': {
      const ra = a as RectAnnotation;
      return (
        <Rect
          key={a.id}
          x={ra.x}
          y={ra.y}
          width={ra.width}
          height={ra.height}
          stroke={ra.color}
          strokeWidth={ra.strokeWidth * hoverStrokeW}
          opacity={hovered ? 1 : ra.opacity}
          fill={ra.filled ? ra.color + '33' : undefined}
          draggable={isSelect}
          onDragStart={handleDragStart}
          onDragEnd={(e: any) => {
            useAppStore.getState().updateAnnotation(a.id, {
              x: e.target.x(), y: e.target.y(),
            } as any);
          }}
          onClick={handleClick}
          onTap={handleClick}
          strokeScaleEnabled={false}
          {...hoverBaseProps}
          {...glowProps}
        />
      );
    }
    case 'text': {
      const ta = a as TextAnnotation;
      return (
        <Text
          key={a.id}
          x={ta.x}
          y={ta.y}
          text={ta.text}
          fontSize={ta.fontSize}
          fill={ta.color}
          opacity={hovered ? 1 : ta.opacity}
          draggable={isSelect}
          onDragStart={handleDragStart}
          onDragEnd={(e: any) => {
            useAppStore.getState().updateAnnotation(a.id, {
              x: e.target.x(), y: e.target.y(),
            } as any);
          }}
          onClick={handleClick}
          onTap={handleClick}
          strokeScaleEnabled={false}
          {...hoverBaseProps}
          {...glowProps}
        />
      );
    }
    case 'marker': {
      if (!markerImg) return null;
      const ma = a as MarkerAnnotation;
      const half = markerSize / 2;
      return (
        <KonvaImage
          key={a.id}
          image={markerImg}
          x={ma.x - half}
          y={ma.y - half}
          width={markerSize}
          height={markerSize}
          draggable={isSelect}
          onDragStart={handleDragStart}
          onDragEnd={(e: any) => {
            useAppStore.getState().updateAnnotation(a.id, {
              x: e.target.x() + half, y: e.target.y() + half,
            } as any);
          }}
          onClick={handleClick}
          onTap={handleClick}
          {...hoverBaseProps}
          {...glowProps}
        />
      );
    }
    default:
      return null;
  }
}
