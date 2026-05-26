import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '../../store';
import { getClassDef } from '../../data/classes';

export function SelectedElementBar() {
  const selectedIds = useAppStore((s) => s.selectedIds);
  const players = useAppStore((s) => s.players);
  const bosses = useAppStore((s) => s.bosses);
  const annotations = useAppStore((s) => s.annotations);
  const renderOrder = useAppStore((s) => s.renderOrder);
  const moveInRenderOrder = useAppStore((s) => s.moveInRenderOrder);

  if (selectedIds.length !== 1) return null;

  const id = selectedIds[0];
  const roIdx = renderOrder.indexOf(id);
  const isFirst = roIdx <= 0;
  const isLast = roIdx >= renderOrder.length - 1;

  let label = '';
  let color = 'var(--color-wow-text)';

  const player = players.find((p) => p.id === id);
  if (player) {
    const cls = getClassDef(player.className);
    label = `团员: ${player.name} (${player.className})`;
    color = cls.color;
  }

  const boss = bosses.find((b) => b.id === id);
  if (boss) {
    label = `首领: ${boss.name}`;
    color = '#ff6666';
  }

  const annotation = annotations.find((a) => a.id === id);
  if (annotation) {
    const typeLabels: Record<string, string> = {
      arrow: '箭头', line: '直线', circle: '圆形', rect: '矩形', text: '文字', marker: '标记',
    };
    label = `标注: ${typeLabels[annotation.type] ?? annotation.type}`;
    color = annotation.color;
  }

  if (!label) return null;

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, border: '1px solid var(--color-wow-border)', borderRadius: 4,
    background: disabled ? 'transparent' : 'rgba(255,255,255,0.06)',
    color: disabled ? 'var(--color-wow-border)' : 'var(--color-wow-muted)',
    cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 12px',
      borderTop: '1px solid var(--color-wow-border)',
      background: 'rgba(255,255,255,0.03)',
    }}>
      <span style={{
        fontSize: 11, color, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', flex: 1, marginRight: 8,
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          onClick={() => moveInRenderOrder(id, 'up')}
          disabled={isLast}
          title="上移一层"
          style={btnStyle(isLast)}
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={() => moveInRenderOrder(id, 'down')}
          disabled={isFirst}
          title="下移一层"
          style={btnStyle(isFirst)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
}
