import { Layer, Rect } from 'react-konva';

interface SelectRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SelectionLayerProps {
  selectRect: SelectRect | null;
}

export function SelectionLayer({ selectRect }: SelectionLayerProps) {
  if (!selectRect || selectRect.width < 2) return null;

  return (
    <Layer>
      <Rect
        x={selectRect.x}
        y={selectRect.y}
        width={selectRect.width}
        height={selectRect.height}
        fill="rgba(199, 156, 110, 0.1)"
        stroke="rgba(199, 156, 110, 0.5)"
        strokeWidth={1}
        dash={[4, 4]}
        listening={false}
      />
    </Layer>
  );
}
