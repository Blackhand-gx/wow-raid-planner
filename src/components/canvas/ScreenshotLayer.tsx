import { useMemo } from 'react';
import { Layer, Image as KonvaImage } from 'react-konva';
import { useAppStore } from '../../store';

export function ScreenshotLayer() {
  const screenshotOverlay = useAppStore((s) => s.screenshotOverlay);

  const image = useMemo(() => {
    if (!screenshotOverlay) return null;
    const img = new window.Image();
    img.src = screenshotOverlay;
    return img;
  }, [screenshotOverlay]);

  if (!screenshotOverlay || !image) return null;

  return (
    <Layer opacity={0.45}>
      <KonvaImage
        image={image}
        x={0}
        y={0}
        width={image.naturalWidth}
        height={image.naturalHeight}
        listening={false}
      />
    </Layer>
  );
}
