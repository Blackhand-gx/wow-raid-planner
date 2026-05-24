import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { Group, Circle, Rect, Text, Image as KonvaImage } from 'react-konva';
import type { Boss } from '../../types';
import { useAppStore } from '../../store';

interface BossNodeProps {
  boss: Boss;
}

export const BossNode = memo(function BossNode({ boss }: BossNodeProps) {
  const iconSize = useAppStore((s) => s.bossIconSize);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const activeTool = useAppStore((s) => s.activeTool);
  const updatePosition = useAppStore((s) => s.updateBossPosition);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const toggleSelection = useAppStore((s) => s.toggleSelection);

  const isSelected = selectedIds.includes(boss.id);
  const radius = iconSize;
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!boss.imageDataUrl) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = boss.imageDataUrl;
  }, [boss.imageDataUrl]);

  const handleMouseDown = useCallback((e: any) => {
    if (activeTool !== 'select') return;
    e.evt.preventDefault();

    // Select on mousedown
    if (e.evt.shiftKey) {
      toggleSelection(boss.id);
    } else if (!isSelected) {
      setSelectedIds([boss.id]);
    }

    if (boss.fixed) return;

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    isDragging.current = true;
    dragStartPos.current = { x: pos.x, y: pos.y };
    nodeStartPos.current = { x: boss.x, y: boss.y };

    // Capture undo snapshot at drag start
    const s = useAppStore.getState();
    s.pushSnapshot({
      players: JSON.stringify(s.players),
      bosses: JSON.stringify(s.bosses),
      annotations: JSON.stringify(s.annotations),
      viewport: JSON.stringify(s.viewport),
    });
  }, [activeTool, boss.id, boss.x, boss.y, boss.fixed, isSelected, toggleSelection, setSelectedIds]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDragging.current || boss.fixed) return;
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const dx = pos.x - dragStartPos.current.x;
    const dy = pos.y - dragStartPos.current.y;

    updatePosition(boss.id, nodeStartPos.current.x + dx, nodeStartPos.current.y + dy);
  }, [boss.id, boss.fixed, updatePosition]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <Group
      x={boss.x}
      y={boss.y}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTap={handleMouseDown}
      listening={activeTool === 'select'}
    >
      {/* Transparent hit area */}
      <Rect
        x={-radius - 4}
        y={-radius - 4}
        width={(radius + 4) * 2}
        height={(radius + 4) * 2}
        fill="transparent"
        listening={true}
      />
      {image ? (
        <>
          <Circle
            radius={radius}
            fill="#333"
            stroke={isSelected ? '#FFD700' : '#C41F3B'}
            strokeWidth={isSelected ? 4 : 3}
            shadowColor={isSelected ? '#FFD700' : 'transparent'}
            shadowBlur={isSelected ? 10 : 0}
            listening={false}
          />
          <KonvaImage
            image={image}
            x={-radius}
            y={-radius}
            width={radius * 2}
            height={radius * 2}
            listening={false}
            clipFunc={(ctx: CanvasRenderingContext2D) => {
              ctx.arc(radius, radius, radius, 0, Math.PI * 2);
            }}
          />
        </>
      ) : (
        <Circle
          radius={radius}
          fill="#1a1a2e"
          stroke={isSelected ? '#FFD700' : '#C41F3B'}
          strokeWidth={isSelected ? 4 : 3}
          shadowColor={isSelected ? '#FFD700' : 'transparent'}
          shadowBlur={isSelected ? 10 : 0}
          listening={false}
        />
      )}
      {/* Skull icon for boss (hidden when custom avatar is set) */}
      {!image && (
        <Text
          text="💀"
          fontSize={radius * 0.7}
          y={-radius * 0.35}
          width={radius * 2.5}
          x={-radius * 1.25}
          align="center"
          listening={false}
        />
      )}
      <Text
        text={boss.name}
        fontSize={14}
        fill="#ff4444"
        y={radius + 4}
        align="center"
        width={radius * 4}
        x={-radius * 2}
        listening={false}
        shadowColor="#000"
        shadowBlur={2}
      />
    </Group>
  );
});
