import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { EXPANSION_PRESETS, type BossPreset } from '../../data/raids';
import { useAppStore } from '../../store';

interface BossPresetSelectProps {
  onAddBoss: (bossNames: string[], raidName: string, defaultMapPath?: string, defaultIconPaths?: string[]) => void;
}

interface FlatItem {
  kind: 'expansion' | 'raid' | 'boss';
  label: string;
  indent: number;
  boss?: BossPreset;
  raidName?: string;
}

function flattenPresets(): FlatItem[] {
  const items: FlatItem[] = [];
  for (const exp of EXPANSION_PRESETS) {
    items.push({ kind: 'expansion', label: exp.name, indent: 0 });
    for (const raid of exp.raids) {
      items.push({ kind: 'raid', label: raid.name, indent: 1 });
      for (const boss of raid.bosses) {
        items.push({ kind: 'boss', label: boss.name, indent: 2, boss, raidName: raid.name });
      }
    }
  }
  return items;
}

const FLAT_ITEMS = flattenPresets();

export function BossPresetSelect({ onAddBoss }: BossPresetSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item: FlatItem) => {
    if (item.kind !== 'boss' || !item.boss || !item.raidName) return;
    const store = useAppStore.getState();
    const hasExisting = store.bosses.length > 0 || store.maps.length > 0;
    if (hasExisting) {
      if (!window.confirm('选择新首领将清除当前画布上的首领和地图，确定吗？')) return;
      store.clearBosses();
      store.clearMaps();
    }
    const names = item.boss.names ?? [item.boss.name];
    onAddBoss(names, item.raidName, item.boss.defaultMapPath, item.boss.defaultIconPaths);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '5px 8px',
          border: '1px solid var(--color-wow-border)',
          borderRadius: 4,
          background: 'var(--color-wow-dark)',
          color: '#ccc',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left', color: 'var(--color-wow-muted)' }}>预设首领</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 2,
            background: 'var(--color-wow-panel)',
            border: '1px solid var(--color-wow-border)',
            borderRadius: 6,
            padding: 4,
            zIndex: 1000,
            maxHeight: 280,
            overflow: 'auto',
          }}
        >
          {FLAT_ITEMS.map((item, i) => {
            const isBoss = item.kind === 'boss';
            const padLeft = 8 + item.indent * 16;

            if (isBoss) {
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 8px',
                    paddingLeft: padLeft,
                    border: 'none',
                    borderRadius: 4,
                    background: 'transparent',
                    color: '#ddd',
                    cursor: 'pointer',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(199,156,110,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {item.label}
                </button>
              );
            }

            return (
              <div
                key={i}
                style={{
                  padding: '4px 8px',
                  paddingLeft: padLeft,
                  fontSize: item.kind === 'expansion' ? 11 : 11,
                  color: item.kind === 'expansion' ? '#888' : '#666',
                  fontWeight: item.kind === 'expansion' ? 600 : 400,
                  cursor: 'default',
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
