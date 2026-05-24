import { Layer } from 'react-konva';
import { useAppStore } from '../../store';
import { PlayerNode } from '../nodes/PlayerNode';

export function PlayerLayer() {
  const players = useAppStore((s) => s.players);

  return (
    <Layer>
      {players.map((p) => (
        <PlayerNode key={p.id} player={p} />
      ))}
    </Layer>
  );
}
