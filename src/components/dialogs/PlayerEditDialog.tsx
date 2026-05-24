import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { ClassPicker } from '../shared/ClassPicker';
import type { WoWClass, PlayerRole } from '../../types';
import { X } from 'lucide-react';
import { RAID_MARKERS, PLAYER_ROLES } from '../../utils/constants';

export function PlayerEditDialog() {
  const [visible, setVisible] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const players = useAppStore((s) => s.players);
  const updatePlayerName = useAppStore((s) => s.updatePlayerName);
  const updatePlayerClass = useAppStore((s) => s.updatePlayerClass);
  const updatePlayerMarker = useAppStore((s) => s.updatePlayerMarker);
  const updatePlayerRole = useAppStore((s) => s.updatePlayerRole);

  const player = players.find((p) => p.id === playerId);
  const [name, setName] = useState('');
  const [className, setClassName] = useState<WoWClass>('warrior');
  const [marker, setMarker] = useState<string | undefined>(undefined);
  const [role, setRole] = useState<PlayerRole | undefined>(undefined);

  const ROLE_LABELS: Record<string, string> = { tank: '坦克', healer: '治疗', dps: '输出' };

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail;
      setPlayerId(id);
      setVisible(true);
    };
    window.addEventListener('edit-player', handler);
    return () => window.removeEventListener('edit-player', handler);
  }, []);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setClassName(player.className);
      setMarker(player.marker);
      setRole(player.role);
    }
  }, [player]);

  if (!visible || !playerId || !player) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    updatePlayerName(playerId, name.trim());
    updatePlayerClass(playerId, className);
    updatePlayerMarker(playerId, marker);
    updatePlayerRole(playerId, role);
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={() => setVisible(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-wow-panel)',
          border: '1px solid var(--color-wow-border)',
          borderRadius: 8,
          padding: 20,
          minWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>编辑团员</span>
          <button
            onClick={() => setVisible(false)}
            style={{ border: 'none', background: 'transparent', color: 'var(--color-wow-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <label style={{ fontSize: 11, color: 'var(--color-wow-muted)' }}>职业</label>
        <ClassPicker value={className} onChange={setClassName} />

        <label style={{ fontSize: 11, color: 'var(--color-wow-muted)' }}>团队标记</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RAID_MARKERS.map((m) => (
            <button
              key={m}
              onClick={() => setMarker(marker === m ? undefined : m)}
              title={m}
              style={{
                width: 32, height: 32, padding: 2,
                border: marker === m ? '2px solid #FFD700' : '2px solid transparent',
                borderRadius: 4, cursor: 'pointer',
                background: marker === m ? 'rgba(255,215,0,0.15)' : 'transparent',
              }}
            >
              <img
                src={`/raid-markers/${m}.png`}
                alt={m}
                style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
              />
            </button>
          ))}
        </div>

        <label style={{ fontSize: 11, color: 'var(--color-wow-muted)' }}>职责</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {PLAYER_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(role === r ? undefined : r)}
              title={ROLE_LABELS[r]}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                border: role === r ? '2px solid #FFD700' : '1px solid var(--color-wow-border)',
                borderRadius: 4, cursor: 'pointer',
                background: role === r ? 'rgba(255,215,0,0.1)' : 'transparent',
                color: role === r ? '#FFD700' : 'var(--color-wow-muted)',
                fontSize: 12,
              }}
            >
              <img
                src={`/role-icons/${r}.png`}
                alt={ROLE_LABELS[r]}
                style={{ width: 20, height: 20, imageRendering: 'auto' }}
              />
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>

        <label style={{ fontSize: 11, color: 'var(--color-wow-muted)' }}>角色名称</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          style={{
            padding: '6px 10px',
            border: '1px solid var(--color-wow-border)',
            borderRadius: 4,
            background: 'var(--color-wow-dark)',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
          }}
          autoFocus
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => setVisible(false)}
            style={{
              padding: '6px 16px',
              border: '1px solid var(--color-wow-border)',
              borderRadius: 4,
              background: 'transparent',
              color: 'var(--color-wow-muted)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: 4,
              background: 'var(--color-wow-accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
