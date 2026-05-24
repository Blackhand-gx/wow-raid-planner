import { useState, useEffect } from 'react';
import { Layer, Arrow, Line, Ellipse, Text, Rect, Image as KonvaImage } from 'react-konva';
import { useAppStore } from '../../store';
import type { Annotation, ArrowAnnotation, LineAnnotation, CircleAnnotation, RectAnnotation, TextAnnotation, MarkerAnnotation } from '../../types';

function AnnotationNode({ a }: { a: Annotation }) {
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const markerSize = useAppStore((s) => s.markerSize);
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
    if (e.evt.shiftKey) {
      const current = store.selectedIds;
      setSelectedIds(current.includes(a.id) ? current.filter((id) => id !== a.id) : [...current, a.id]);
    } else {
      setSelectedIds([a.id]);
    }
  };

  const eraser = useAppStore((s) => s.activeTool) === 'eraser';
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
          draggable
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
          draggable
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
          draggable
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
          draggable
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
          draggable
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
          draggable
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

export function AnnotationBackLayer() {
  const annotations = useAppStore((s) => s.annotations);
  const back = annotations.filter((a) => a.layer === 'back');

  if (back.length === 0) return null;

  return (
    <Layer>
      {back.map((a) => (
        <AnnotationNode key={a.id} a={a} />
      ))}
    </Layer>
  );
}

export function AnnotationFrontLayer() {
  const annotations = useAppStore((s) => s.annotations);
  const front = annotations.filter((a) => a.layer === 'front');

  if (front.length === 0) return null;

  return (
    <Layer>
      {front.map((a) => (
        <AnnotationNode key={a.id} a={a} />
      ))}
    </Layer>
  );
}
