import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva';
import type { Player } from '../../types';
import { getClassDef } from '../../data/classes';
import { useAppStore } from '../../store';

interface PlayerNodeProps {
  player: Player;
}

export const PlayerNode = memo(function PlayerNode({ player }: PlayerNodeProps) {
  const classDef = getClassDef(player.className);
  const iconSize = useAppStore((s) => s.playerIconSize);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const activeTool = useAppStore((s) => s.activeTool);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const toggleSelection = useAppStore((s) => s.toggleSelection);

  const isSelected = selectedIds.includes(player.id);
  const size = iconSize;
  const halfSize = size / 2;
  const [iconImage, setIconImage] = useState<HTMLImageElement | null>(null);
  const [markerImage, setMarkerImage] = useState<HTMLImageElement | null>(null);
  const [roleImage, setRoleImage] = useState<HTMLImageElement | null>(null);

  // Manual drag state
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = classDef.iconPath;
    img.onload = () => setIconImage(img);
  }, [classDef.iconPath]);

  useEffect(() => {
    if (!player.marker) {
      setMarkerImage(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setMarkerImage(img);
    img.onerror = () => setMarkerImage(null);
    img.src = `/raid-markers/${player.marker}.png`;
  }, [player.marker]);

  useEffect(() => {
    if (!player.role) {
      setRoleImage(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setRoleImage(img);
    img.onerror = () => setRoleImage(null);
    img.src = `/role-icons/${player.role}.png`;
  }, [player.role]);

  const handleMouseDown = useCallback((e: any) => {
    if (activeTool !== 'select') return;
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    isDragging.current = true;
    stageRef.current = stage;
    dragStartPos.current = { x: pos.x, y: pos.y };
    nodeStartPos.current = { x: player.x, y: player.y };

    // Capture undo snapshot at drag start
    const s = useAppStore.getState();
    s.pushSnapshot({
      players: JSON.stringify(s.players),
      bosses: JSON.stringify(s.bosses),
      annotations: JSON.stringify(s.annotations),
      viewport: JSON.stringify(s.viewport),
      renderOrder: JSON.stringify(s.renderOrder),
    });

    // Select on mousedown: shift=toggle, otherwise select only this player
    if (e.evt.shiftKey) {
      toggleSelection(player.id);
    } else if (!isSelected) {
      setSelectedIds([player.id]);
    }

    // Window-level listeners to keep dragging even when cursor is over other elements
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      ev.preventDefault();

      const stg = stageRef.current;
      if (!stg) return;

      const p = stg.getPointerPosition();
      if (!p) return;

      const t = stg.getAbsoluteTransform().copy().invert();
      const canvasPos = t.point(p);

      const dx = canvasPos.x - dragStartPos.current.x;
      const dy = canvasPos.y - dragStartPos.current.y;

      const store = useAppStore.getState();
      const currentSelected = store.selectedIds;

      if (currentSelected.includes(player.id) && currentSelected.length > 1) {
        store.bulkUpdatePositions(currentSelected.map(id => ({ id, dx, dy })));
        dragStartPos.current = { x: canvasPos.x, y: canvasPos.y };
      } else {
        store.updatePlayerPosition(player.id, nodeStartPos.current.x + dx, nodeStartPos.current.y + dy);
      }
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [activeTool, player.id, player.x, player.y, isSelected, toggleSelection, setSelectedIds]);

  const handleDblClick = () => {
    window.dispatchEvent(new CustomEvent('edit-player', { detail: player.id }));
  };

  const markerSz = size * 0.6;
  const roleSz = size * 0.6;
  const maxSlotSz = Math.max(markerSz, roleSz);

  // Horizontal layout for marker + role icons, overlapping class icon's upper portion
  const markerPresent = !!markerImage;
  const rolePresent = !!roleImage;
  const slotGap = 1;
  let markerX = 0;
  let roleX = 0;
  // Marker/role midline aligns with top edge of class icon
  const slotY = -halfSize - maxSlotSz / 2;

  if (markerPresent && rolePresent) {
    const totalW = markerSz + roleSz + slotGap;
    markerX = -totalW / 2;
    roleX = markerX + markerSz + slotGap;
  } else if (markerPresent) {
    markerX = -markerSz / 2;
  } else if (rolePresent) {
    roleX = -roleSz / 2;
  }

  return (
    <Group
      x={player.x}
      y={player.y}
      onMouseDown={handleMouseDown}
      onTap={handleMouseDown}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      listening={activeTool === 'select'}
    >
      {/* Transparent hit area covering icon + slots + name */}
      <Rect
        x={-(halfSize + 4)}
        y={slotY - 4}
        width={size + 8}
        height={halfSize + (slotY * -1) + 4}
        fill="transparent"
        listening={true}
      />
      {/* Class icon (square) — rendered first, below markers */}
      {iconImage && (
        <KonvaImage
          image={iconImage}
          x={-halfSize}
          y={-halfSize}
          width={size}
          height={size}
          listening={false}
        />
      )}
      {/* Raid marker icon — covers upper portion of class icon */}
      {markerImage && (
        <KonvaImage
          image={markerImage}
          x={markerX}
          y={slotY}
          width={markerSz}
          height={markerSz}
          listening={false}
        />
      )}
      {/* Role icon — covers upper portion of class icon, next to marker */}
      {roleImage && (
        <KonvaImage
          image={roleImage}
          x={roleX}
          y={slotY}
          width={roleSz}
          height={roleSz}
          listening={false}
        />
      )}
      {/* Selection border */}
      {isSelected && (
        <Rect
          x={-halfSize - 2}
          y={-halfSize - 2}
          width={size + 4}
          height={size + 4}
          stroke="#FFD700"
          strokeWidth={2}
          listening={false}
          cornerRadius={2}
        />
      )}
      {/* Name label */}
      <Text
        text={player.name}
        fontSize={13}
        fill="#ffffff"
        y={halfSize + 4}
        align="center"
        width={size * 3}
        x={-size * 1.5}
        listening={false}
        shadowColor="#000000"
        shadowBlur={2}
      />
    </Group>
  );
});
