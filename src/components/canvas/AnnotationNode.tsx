import { useState, useEffect } from 'react';
import { Arrow, Line, Ellipse, Text, Rect, Image as KonvaImage } from 'react-konva';
import { useAppStore } from '../../store';
import type { Annotation, ArrowAnnotation, LineAnnotation, CircleAnnotation, RectAnnotation, TextAnnotation, MarkerAnnotation } from '../../types';

function isOnUnfilledBorder(a: Annotation, pos: { x: number; y: number }): boolean {
  const pad = 6;
  if (a.type === 'circle') {
    const ca = a as CircleAnnotation;
    const sw = (ca.strokeWidth || 2) + pad;
    const dx = pos.x - ca.x;
    const dy = pos.y - ca.y;
    const rx = ca.radiusX;
    const ry = ca.radiusY;
    const orx = rx + sw;
    const ory = ry + sw;
    const irx = Math.max(0, rx - sw);
    const iry = Math.max(0, ry - sw);
    const outer = (dx * dx) / (orx * orx) + (dy * dy) / (ory * ory);
    if (irx <= 0 || iry <= 0) return outer <= 1;
    const inner = (dx * dx) / (irx * irx) + (dy * dy) / (iry * iry);
    return outer <= 1 && inner >= 1;
  }
  if (a.type === 'rect') {
    const ra = a as RectAnnotation;
    const sw = (ra.strokeWidth || 2) + pad;
    const insideX = pos.x >= ra.x - sw && pos.x <= ra.x + ra.width + sw;
    const insideY = pos.y >= ra.y - sw && pos.y <= ra.y + ra.height + sw;
    const onLeft   = pos.x >= ra.x - sw && pos.x <= ra.x + sw;
    const onRight  = pos.x >= ra.x + ra.width - sw && pos.x <= ra.x + ra.width + sw;
    const onTop    = pos.y >= ra.y - sw && pos.y <= ra.y + sw;
    const onBottom = pos.y >= ra.y + ra.height - sw && pos.y <= ra.y + ra.height + sw;
    return insideY && (onLeft || onRight) || insideX && (onTop || onBottom);
  }
  return true;
}

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

    // Unfilled circle/rect: allow clicking through the interior to elements below
    if ((a.type === 'circle' || a.type === 'rect') && !(a as any).filled) {
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (pointer) {
        const t = stage.getAbsoluteTransform().copy().invert();
        const pos = t.point(pointer) as { x: number; y: number };
        if (!isOnUnfilledBorder(a, pos)) {
          const roIdx = store.renderOrder.indexOf(a.id);
          if (roIdx > 0) {
            for (let i = roIdx - 1; i >= 0; i--) {
              const id = store.renderOrder[i];
              const p = store.players.find((pl) => pl.id === id);
              if (p) {
                const half = store.playerIconSize / 2 + 4;
                if (Math.abs(p.x - pos.x) < half && Math.abs(p.y - pos.y) < half + 14) {
                  if (e.evt.shiftKey) {
                    setSelectedIds(store.selectedIds.includes(p.id)
                      ? store.selectedIds.filter((sid) => sid !== p.id) : [...store.selectedIds, p.id]);
                  } else {
                    setSelectedIds([p.id]);
                  }
                  return;
                }
              }
              const b = store.bosses.find((bs) => bs.id === id);
              if (b) {
                const r = store.bossIconSize + 4;
                if (Math.abs(b.x - pos.x) < r && Math.abs(b.y - pos.y) < r + 14) {
                  if (e.evt.shiftKey) {
                    setSelectedIds(store.selectedIds.includes(b.id)
                      ? store.selectedIds.filter((sid) => sid !== b.id) : [...store.selectedIds, b.id]);
                  } else {
                    setSelectedIds([b.id]);
                  }
                  return;
                }
              }
            }
          }
        }
      }
    }

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
          hitFunc={ca.filled ? undefined : (ctx: any, shape: any) => {
            const sw = shape.strokeWidth();
            const rx = shape.radiusX();
            const ry = shape.radiusY();
            ctx.beginPath();
            ctx.ellipse(0, 0, rx + sw / 2, ry + sw / 2, 0, 0, Math.PI * 2);
            ctx.ellipse(0, 0, Math.max(0, rx - sw / 2), Math.max(0, ry - sw / 2), 0, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStrokeShape(shape);
          }}
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
          hitFunc={ra.filled ? undefined : (ctx: any, shape: any) => {
            const sw = shape.strokeWidth();
            const w = shape.width();
            const h = shape.height();
            ctx.beginPath();
            // Outer clockwise
            ctx.rect(-sw / 2, -sw / 2, w + sw, h + sw);
            // Inner counter-clockwise (hole) — manual path
            ctx.moveTo(sw / 2, sw / 2);
            ctx.lineTo(sw / 2, h - sw / 2);
            ctx.lineTo(w - sw / 2, h - sw / 2);
            ctx.lineTo(w - sw / 2, sw / 2);
            ctx.closePath();
            ctx.fillStrokeShape(shape);
          }}
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
