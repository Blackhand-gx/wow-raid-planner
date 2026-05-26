import { useAppStore } from '../../store';
import { ANNOTATION_COLORS } from '../../utils/constants';
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import type { Annotation } from '../../types';

const TYPE_LABEL: Record<string, string> = {
  arrow: '箭头', line: '直线', circle: '圆形', rect: '矩形', text: '文字', marker: '标记',
};

function colorToHex(c: string): string {
  // If already hex, return as-is
  if (c.startsWith('#')) return c;
  return c;
}

export function AnnotationPanel() {
  const annotations = useAppStore((s) => s.annotations);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const updateAnnotation = useAppStore((s) => s.updateAnnotation);
  const removeAnnotation = useAppStore((s) => s.removeAnnotation);
  const moveAnnotationUp = useAppStore((s) => s.moveAnnotationUp);
  const moveAnnotationDown = useAppStore((s) => s.moveAnnotationDown);
  const markerSize = useAppStore((s) => s.markerSize);
  const setMarkerSize = useAppStore((s) => s.setMarkerSize);

  const selectedAnnotations = annotations.filter((a) => selectedIds.includes(a.id));
  const selected = selectedAnnotations[0];

  const handleItemClick = (a: Annotation) => {
    setSelectedIds([a.id]);
  };

  const handleToggleLayer = (a: Annotation) => {
    updateAnnotation(a.id, { layer: a.layer === 'front' ? 'back' : 'front' } as any);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12, gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--color-wow-text)' }}>标注列表</span>
        <span style={{ fontSize: 11, color: 'var(--color-wow-muted)' }}>{annotations.length}个</span>
      </div>

      {/* Annotation list */}
      {annotations.length > 0 && (
        <div style={{
          flex: 1, overflowY: 'auto', minHeight: 0,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {annotations.map((a) => {
            const isSelected = selectedIds.includes(a.id);
            return (
              <div
                key={a.id}
                onClick={() => handleItemClick(a)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
                  background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: isSelected ? '1px solid var(--color-wow-accent)' : '1px solid transparent',
                  fontSize: 11,
                }}
              >
                {/* Color dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: colorToHex(a.color), flexShrink: 0,
                }} />

                {/* Type */}
                <span style={{ color: 'var(--color-wow-text)', minWidth: 28 }}>
                  {TYPE_LABEL[a.type] ?? a.type}
                </span>

                {/* Up/down */}
                <button
                  onClick={(e) => { e.stopPropagation(); moveAnnotationUp(a.id); }}
                  title="上移一层"
                  disabled={annotations.indexOf(a) === annotations.length - 1}
                  style={{
                    border: 'none', background: 'transparent',
                    color: annotations.indexOf(a) === annotations.length - 1 ? 'var(--color-wow-border)' : 'var(--color-wow-muted)',
                    cursor: annotations.indexOf(a) === annotations.length - 1 ? 'default' : 'pointer', padding: 0,
                  }}
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveAnnotationDown(a.id); }}
                  title="下移一层"
                  disabled={annotations.indexOf(a) === 0}
                  style={{
                    border: 'none', background: 'transparent',
                    color: annotations.indexOf(a) === 0 ? 'var(--color-wow-border)' : 'var(--color-wow-muted)',
                    cursor: annotations.indexOf(a) === 0 ? 'default' : 'pointer', padding: 0,
                  }}
                >
                  <ChevronDown size={13} />
                </button>

                {/* Layer */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleLayer(a); }}
                  title={a.layer === 'front' ? '前层 → 后层' : '后层 → 前层'}
                  style={{
                    display: 'flex', alignItems: 'center', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 1, flexShrink: 0,
                  }}
                >
                  {a.layer === 'front'
                    ? <Eye size={12} color="#8888aa" />
                    : <EyeOff size={12} color="#555566" />
                  }
                </button>

                {/* Text preview for text annotations */}
                {a.type === 'text' && (
                  <span style={{
                    color: 'var(--color-wow-muted)', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {(a as any).text ?? ''}
                  </span>
                )}

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeAnnotation(a.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', marginLeft: 'auto',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0,
                  }}
                >
                  <Trash2 size={11} color="#ff4444" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Property editor for selected annotation */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, border: '1px solid var(--color-wow-border)', borderRadius: 6 }}>
          <div style={{ fontSize: 11, color: 'var(--color-wow-accent)' }}>
            {TYPE_LABEL[selected.type]} 属性
          </div>

          {/* Color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {ANNOTATION_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => updateAnnotation(selected.id, { color: c } as any)}
                style={{
                  width: 18, height: 18, borderRadius: '50%', background: c,
                  border: selected.color === c ? '2px solid #fff' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* Stroke Width — only for non-marker annotations */}
          {selected.type !== 'marker' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--color-wow-muted)', minWidth: 32 }}>线宽</span>
              <input
                type="range" min={1} max={10} value={(selected as any).strokeWidth ?? 2}
                onChange={(e) => updateAnnotation(selected.id, { strokeWidth: Number(e.target.value) } as any)}
                style={{ flex: 1, height: 4 }}
              />
              <span style={{ fontSize: 10, color: 'var(--color-wow-muted)', minWidth: 16 }}>{(selected as any).strokeWidth ?? 2}</span>
            </div>
          )}

          {/* Marker size — only for marker annotations */}
          {selected.type === 'marker' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--color-wow-muted)', minWidth: 48 }}>标记大小</span>
              <input
                type="range" min={8} max={64} value={markerSize}
                onChange={(e) => setMarkerSize(Number(e.target.value))}
                style={{ flex: 1, height: 4 }}
              />
              <span style={{ fontSize: 10, color: 'var(--color-wow-muted)', minWidth: 16 }}>{markerSize}px</span>
            </div>
          )}

          {/* Layer switch */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => updateAnnotation(selected.id, { layer: 'back' } as any)}
              style={{
                flex: 1, padding: '4px 0', border: '1px solid var(--color-wow-border)',
                borderRadius: 4, background: selected.layer === 'back' ? 'var(--color-wow-accent)' : 'transparent',
                color: selected.layer === 'back' ? '#fff' : 'var(--color-wow-muted)', cursor: 'pointer', fontSize: 11,
              }}
            >
              后层（区域）
            </button>
            <button
              onClick={() => updateAnnotation(selected.id, { layer: 'front' } as any)}
              style={{
                flex: 1, padding: '4px 0', border: '1px solid var(--color-wow-border)',
                borderRadius: 4, background: selected.layer === 'front' ? 'var(--color-wow-accent)' : 'transparent',
                color: selected.layer === 'front' ? '#fff' : 'var(--color-wow-muted)', cursor: 'pointer', fontSize: 11,
              }}
            >
              前层（指示）
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={() => removeAnnotation(selected.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '4px 0', border: '1px solid #ff4444', borderRadius: 4,
              background: 'transparent', color: '#ff4444', cursor: 'pointer', fontSize: 11,
            }}
          >
            <Trash2 size={12} /> 删除标注
          </button>
        </div>
      )}

      {annotations.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--color-wow-muted)', fontSize: 12, marginTop: 24 }}>
          选择工具栏工具开始绘制标注
        </div>
      )}
    </div>
  );
}
