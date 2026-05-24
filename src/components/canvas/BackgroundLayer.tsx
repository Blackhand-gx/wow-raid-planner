import { useMemo, useCallback } from 'react';
import { Layer, Image as KonvaImage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useAppStore } from '../../store';

export function BackgroundLayer() {
  const maps = useAppStore((s) => s.maps);
  const activeMapId = useAppStore((s) => s.activeMapId);
  const updateMapOffset = useAppStore((s) => s.updateMapOffset);
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const activeMap = maps.find((m) => m.id === activeMapId);

  const image = useMemo(() => {
    if (!activeMap) return null;
    const img = new window.Image();
    img.src = activeMap.imageDataUrl;
    return img;
  }, [activeMap?.imageDataUrl]);

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      if (!activeMap) return;
      updateMapOffset(activeMap.id, e.target.x(), e.target.y());
    },
    [activeMap, updateMapOffset],
  );

  if (!activeMap || !image) return null;

  const s = activeMap.mapScale ?? 1;
  const ox = activeMap.offsetX ?? 0;
  const oy = activeMap.offsetY ?? 0;
  const displayW = activeMap.originalWidth * s;
  const displayH = activeMap.originalHeight * s;
  const isMapTab = sidebarTab === 'maps';

  return (
    <Layer>
      <KonvaImage
        image={image}
        x={ox}
        y={oy}
        width={displayW}
        height={displayH}
        opacity={activeMap.opacity}
        draggable={isMapTab && !activeMap.locked}
        onDragEnd={handleDragEnd}
        listening={isMapTab}
      />
    </Layer>
  );
}
