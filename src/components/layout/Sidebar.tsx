import { Users, Skull, Map, Pencil } from 'lucide-react';
import { MapPanel } from '../panels/MapPanel';
import { PlayerPanel } from '../panels/PlayerPanel';
import { BossPanel } from '../panels/BossPanel';
import { AnnotationPanel } from '../panels/AnnotationPanel';
import { useAppStore } from '../../store';

type TabId = 'players' | 'bosses' | 'maps' | 'annotations';

const tabs: { id: TabId; icon: typeof Users; label: string }[] = [
  { id: 'players', icon: Users, label: '团员' },
  { id: 'bosses', icon: Skull, label: '首领' },
  { id: 'maps', icon: Map, label: '地图' },
  { id: 'annotations', icon: Pencil, label: '标记' },
];

export function Sidebar() {
  const sidebarTab = useAppStore((s) => s.sidebarTab);
  const setSidebarTab = useAppStore((s) => s.setSidebarTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-wow-border)',
        }}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = sidebarTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSidebarTab(t.id)}
              title={t.label}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                height: 36,
                border: 'none',
                borderBottom: active ? '2px solid var(--color-wow-accent)' : '2px solid transparent',
                background: active ? 'rgba(199,156,110,0.1)' : 'transparent',
                color: active ? 'var(--color-wow-accent)' : 'var(--color-wow-muted)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {sidebarTab === 'players' && <PlayerPanel />}
        {sidebarTab === 'bosses' && <BossPanel />}
        {sidebarTab === 'maps' && <MapPanel />}
        {sidebarTab === 'annotations' && <AnnotationPanel />}
      </div>
    </div>
  );
}
