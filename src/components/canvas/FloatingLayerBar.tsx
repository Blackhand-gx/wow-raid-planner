import { useRef } from 'react';
import { useAppStore } from '../../store';
import type {
  ArrowAnnotation,
  LineAnnotation,
  CircleAnnotation,
  RectAnnotation,
  TextAnnotation,
  MarkerAnnotation,
} from '../../types';

function getLayerColor(index: number, total: number): string {
  if (total <= 1) return '#8888aa';
  const ratio = index / (total - 1);
  if (ratio > 0.66) return '#4ade80';
  if (ratio > 0.33) return '#facc15';
  return '#ef4444';
}

const TRACK_WIDTH = 4;
const THUMB_DIAMETER = 10;
const TRACK_MIN_H = 40;
const GAP_PX = 12;
const CONTAINER_WIDTH = 20;

export function FloatingLayerBar() {
  const selectedIds = useAppStore((s) => s.selectedIds);
  const players = useAppStore((s) => s.players);
  const bosses = useAppStore((s) => s.bosses);
  const annotations = useAppStore((s) => s.annotations);
  const renderOrder = useAppStore((s) => s.renderOrder);
  const viewport = useAppStore((s) => s.viewport);
  const playerIconSize = useAppStore((s) => s.playerIconSize);
  const bossIconSize = useAppStore((s) => s.bossIconSize);
  const markerSize = useAppStore((s) => s.markerSize);

  const isDragging = useRef(false);
  const dragStartRef = useRef({ clientY: 0, naturalRatio: 0, trackHeightPx: 0, total: 0, currentIdx: 0 });
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  if (selectedIds.length !== 1) return null;

  const id = selectedIds[0];
  const roIdx = renderOrder.indexOf(id);
  const total = renderOrder.length;
  if (roIdx === -1) return null;

  let elX = 0;
  let elY = 0;
  let visualHalfH = 20;

  const player = players.find((p) => p.id === id);
  if (player) {
    elX = player.x;
    elY = player.y;
    visualHalfH = playerIconSize / 2 + 6;
  }

  const boss = bosses.find((b) => b.id === id);
  if (boss) {
    elX = boss.x;
    elY = boss.y;
    visualHalfH = bossIconSize + 6;
  }

  const annotation = annotations.find((a) => a.id === id);
  if (annotation) {
    switch (annotation.type) {
      case 'arrow':
      case 'line': {
        const pts = (annotation as ArrowAnnotation | LineAnnotation).points;
        elX = (pts[0] + pts[2]) / 2;
        elY = (pts[1] + pts[3]) / 2;
        visualHalfH = 18;
        break;
      }
      case 'circle': {
        const ca = annotation as CircleAnnotation;
        elX = ca.x;
        elY = ca.y;
        visualHalfH = Math.max(ca.radiusX, ca.radiusY) + ca.strokeWidth + 4;
        break;
      }
      case 'rect': {
        const ra = annotation as RectAnnotation;
        elX = ra.x + ra.width / 2;
        elY = ra.y + ra.height / 2;
        visualHalfH = Math.max(ra.height / 2, 14) + ra.strokeWidth + 4;
        break;
      }
      case 'text': {
        const ta = annotation as TextAnnotation;
        elX = ta.x;
        elY = ta.y;
        visualHalfH = (ta.fontSize || 16) / 2 + 6;
        break;
      }
      case 'marker': {
        const ma = annotation as MarkerAnnotation;
        elX = ma.x;
        elY = ma.y;
        visualHalfH = markerSize / 2 + 6;
        break;
      }
    }
  }

  if (!player && !boss && !annotation) return null;

  const screenX = elX * viewport.scale + viewport.x;
  const screenY = elY * viewport.scale + viewport.y;
  const screenVisualHalfH = visualHalfH * viewport.scale;
  const trackHeight = Math.max(screenVisualHalfH * 2, TRACK_MIN_H);
  const elementLeftScreen = screenX - screenVisualHalfH;
  const containerLeft = elementLeftScreen - GAP_PX - CONTAINER_WIDTH;
  const containerTop = screenY - trackHeight / 2;

  const naturalRatio = total <= 1 ? 1 : roIdx / (total - 1);
  const thumbTopPx = (1 - naturalRatio) * trackHeight;
  const fillHeightPx = naturalRatio * trackHeight;
  const layerColor = getLayerColor(roIdx, total);

  const onTrackClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.thumb !== undefined) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = 1 - clickY / rect.height;
    const maxIdx = Math.max(0, total - 1);
    const newIndex = Math.round(Math.max(0, Math.min(1, ratio)) * maxIdx);
    useAppStore.getState().moveToRenderPosition(id, Math.max(0, Math.min(maxIdx, newIndex)));
  };

  const onThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();

    // Capture undo snapshot once at drag start
    const state = useAppStore.getState();
    state.pushSnapshot({
      players: JSON.stringify(state.players),
      bosses: JSON.stringify(state.bosses),
      annotations: JSON.stringify(state.annotations),
      viewport: JSON.stringify(state.viewport),
      renderOrder: JSON.stringify(state.renderOrder),
    });

    isDragging.current = true;
    dragStartRef.current = {
      clientY: e.clientY,
      naturalRatio,
      trackHeightPx: rect.height,
      total,
      currentIdx: roIdx,
    };

    let prevTargetIdx = roIdx;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      ev.preventDefault();
      const dr = dragStartRef.current;
      const dy = ev.clientY - dr.clientY;
      const newRatio = Math.max(0, Math.min(1, dr.naturalRatio - dy / dr.trackHeightPx));
      const maxIdx = Math.max(0, dr.total - 1);
      const targetIndex = Math.max(0, Math.min(maxIdx, Math.round(newRatio * maxIdx)));

      // Smooth DOM updates (every pixel)
      if (thumbRef.current) {
        thumbRef.current.style.top = `${(1 - newRatio) * dr.trackHeightPx}px`;
      }
      if (fillRef.current) {
        fillRef.current.style.height = `${newRatio * dr.trackHeightPx}px`;
      }

      // Live reorder — only when crossing an index boundary
      if (targetIndex !== prevTargetIdx) {
        prevTargetIdx = targetIndex;
        const store = useAppStore.getState();
        const curIdx = store.renderOrder.indexOf(id);
        if (curIdx !== -1 && curIdx !== targetIndex) {
          const next = [...store.renderOrder];
          next.splice(curIdx, 1);
          next.splice(targetIndex, 0, id);
          store.setRenderOrder(next);
        }
      }
    };

    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: containerLeft,
        top: containerTop,
        width: CONTAINER_WIDTH,
        height: trackHeight + 18,
        zIndex: 50,
        pointerEvents: 'auto',
      }}
    >
      <div
        ref={trackRef}
        onMouseDown={onTrackClick}
        style={{
          position: 'absolute',
          left: (CONTAINER_WIDTH - TRACK_WIDTH) / 2,
          top: 0,
          width: TRACK_WIDTH,
          height: trackHeight,
          borderRadius: TRACK_WIDTH / 2,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(199, 156, 110, 0.2)',
          cursor: 'pointer',
          overflow: 'visible',
        }}
      >
        <div
          ref={fillRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: -1,
            width: TRACK_WIDTH + 2,
            height: fillHeightPx,
            borderRadius: TRACK_WIDTH / 2,
            background: 'linear-gradient(to top, rgba(199,156,110,0.45), rgba(199,156,110,0.10))',
            pointerEvents: 'none',
          }}
        />
        <div
          ref={thumbRef}
          data-thumb="true"
          onMouseDown={onThumbMouseDown}
          style={{
            position: 'absolute',
            left: '50%',
            top: thumbTopPx,
            transform: 'translate(-50%, -50%)',
            width: THUMB_DIAMETER,
            height: THUMB_DIAMETER,
            borderRadius: '50%',
            background: 'var(--color-wow-accent)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 0 6px rgba(199,156,110,0.55), 0 1px 3px rgba(0,0,0,0.5)',
            cursor: 'grab',
            zIndex: 2,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: trackHeight + 4,
          left: 0,
          width: CONTAINER_WIDTH,
          textAlign: 'center',
          fontSize: 9,
          fontWeight: 600,
          color: layerColor,
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {total <= 1 ? '' : `${roIdx + 1}/${total}`}
      </div>
    </div>
  );
}
