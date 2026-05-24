import { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { WoWClass } from '../../types';
import { getClassDef } from '../../data/classes';

interface ClassIconProps {
  className: WoWClass;
  size: number;
  x?: number;
  y?: number;
}

export function ClassIcon({ className, size, x, y }: ClassIconProps) {
  const def = getClassDef(className);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = def.iconPath;
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
  }, [def.iconPath]);

  if (!image) return null;

  const offsetX = x !== undefined ? x - size / 2 : undefined;
  const offsetY = y !== undefined ? y - size / 2 : undefined;

  return (
    <KonvaImage
      image={image}
      x={offsetX}
      y={offsetY}
      width={size}
      height={size}
      listening={false}
    />
  );
}
