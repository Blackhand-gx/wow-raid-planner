import { useEffect } from 'react';
import { Layer } from 'react-konva';
import { useAppStore } from '../../store';
import { PlayerNode } from '../nodes/PlayerNode';
import { BossNode } from '../nodes/BossNode';
import { AnnotationNode } from './AnnotationNode';

export function UnifiedEntityLayer() {
  const players = useAppStore((s) => s.players);
  const bosses = useAppStore((s) => s.bosses);
  const annotations = useAppStore((s) => s.annotations);
  const renderOrder = useAppStore((s) => s.renderOrder);

  // On first load / old project migration: build default renderOrder if empty
  useEffect(() => {
    if (renderOrder.length > 0) return;
    const store = useAppStore.getState();
    const allIds = [
      ...store.bosses.map((b) => b.id),
      ...store.annotations.filter((a) => a.layer === 'back').map((a) => a.id),
      ...store.players.map((p) => p.id),
      ...store.annotations.filter((a) => a.layer === 'front').map((a) => a.id),
    ];
    if (allIds.length > 0) {
      store.setRenderOrder(allIds);
    }
  }, [renderOrder.length]);

  const renderIds = renderOrder.length > 0 ? renderOrder : [
    ...bosses.map((b) => b.id),
    ...annotations.filter((a) => a.layer === 'back').map((a) => a.id),
    ...players.map((p) => p.id),
    ...annotations.filter((a) => a.layer === 'front').map((a) => a.id),
  ];

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const bossMap = new Map(bosses.map((b) => [b.id, b]));
  const annotationMap = new Map(annotations.map((a) => [a.id, a]));

  return (
    <Layer>
      {renderIds.map((id) => {
        const player = playerMap.get(id);
        if (player) return <PlayerNode key={id} player={player} />;

        const boss = bossMap.get(id);
        if (boss) return <BossNode key={id} boss={boss} />;

        const annotation = annotationMap.get(id);
        if (annotation) return <AnnotationNode key={id} a={annotation} />;

        return null;
      })}
    </Layer>
  );
}
