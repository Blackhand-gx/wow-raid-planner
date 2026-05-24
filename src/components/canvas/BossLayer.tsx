import { Layer } from 'react-konva';
import { useAppStore } from '../../store';
import { BossNode } from '../nodes/BossNode';

export function BossLayer() {
  const bosses = useAppStore((s) => s.bosses);

  return (
    <Layer>
      {bosses.map((b) => (
        <BossNode key={b.id} boss={b} />
      ))}
    </Layer>
  );
}
