import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { APP_VERSION, APP_AUTHOR } from '../../utils/version';

export function StatusBar() {
  const viewport = useAppStore((s) => s.viewport);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const activeMapId = useAppStore((s) => s.activeMapId);
  const maps = useAppStore((s) => s.maps);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const activeMap = maps.find((m) => m.id === activeMapId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const stage = document.querySelector('.konvajs-content canvas');
      if (stage) {
        const rect = stage.getBoundingClientRect();
        const vp = useAppStore.getState().viewport;
        const mapX = Math.round((e.clientX - rect.left - vp.x) / vp.scale);
        const mapY = Math.round((e.clientY - rect.top - vp.y) / vp.scale);
        setMousePos({ x: mapX, y: mapY });
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const selText = selectedIds.length > 0 ? `选中: ${selectedIds.length}个` : '';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 28,
        padding: '0 12px',
        background: 'var(--color-wow-panel)',
        borderTop: '1px solid var(--color-wow-border)',
        fontSize: 11,
        color: 'var(--color-wow-muted)',
      }}
    >
      <span>坐标 ({mousePos.x}, {mousePos.y})</span>
      {selText && <span>{selText}</span>}
      <span>缩放 {Math.round(viewport.scale * 100)}%</span>
      <span style={{ flex: 1 }} />
      <span>{activeMap ? `地图: ${activeMap.name}` : '无地图'}</span>
      <span style={{ color: '#666680' }}>v{APP_VERSION} by {APP_AUTHOR}</span>
    </div>
  );
}
