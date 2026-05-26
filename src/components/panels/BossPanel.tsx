import { useState } from 'react';
import { useAppStore } from '../../store';
import { useImageUpload } from '../../hooks/useImageUpload';
import { loadDefaultMap } from '../../utils/defaultMap';
import { getCanvasCenter } from '../../utils/canvasCenter';
import { cropToCircle } from '../../utils/imageResize';
import { Trash2, Lock, Unlock, Upload, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { BossPresetSelect } from '../shared/BossPresetSelect';

export function BossPanel() {
  const bosses = useAppStore((s) => s.bosses);
  const addBoss = useAppStore((s) => s.addBoss);
  const removeBoss = useAppStore((s) => s.removeBoss);
  const toggleBossFixed = useAppStore((s) => s.toggleBossFixed);
  const updateBossName = useAppStore((s) => s.updateBossName);
  const moveBossUp = useAppStore((s) => s.moveBossUp);
  const moveBossDown = useAppStore((s) => s.moveBossDown);
  const bossIconSize = useAppStore((s) => s.bossIconSize);
  const setBossIconSize = useAppStore((s) => s.setBossIconSize);
  const setViewport = useAppStore((s) => s.setViewport);
  const maps = useAppStore((s) => s.maps);
  const setActiveMap = useAppStore((s) => s.setActiveMap);
  const addMap = useAppStore((s) => s.addMap);
  const updateMapLock = useAppStore((s) => s.updateMapLock);
  const { uploadFile, openFileDialog } = useImageUpload();

  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    const { x, y } = getCanvasCenter();
    addBoss(name.trim(), null, x, y);
    setName('');
  };

  const handleUploadAndAdd = async () => {
    const file = await openFileDialog();
    if (!file) return;
    try {
      const { dataUrl } = await uploadFile(file);
      const circleDataUrl = await cropToCircle(dataUrl);
      const bossName = name.trim() || file.name.replace(/\.[^.]+$/, '');
      const { x, y } = getCanvasCenter();
      addBoss(bossName, circleDataUrl, x, y);
      setName('');
    } catch {
      alert('图片加载失败');
    }
  };

  const handleLocate = (id: string) => {
    const boss = bosses.find((b) => b.id === id);
    if (!boss) return;
    const { viewport } = useAppStore.getState();
    setViewport({ x: -boss.x * viewport.scale + 400, y: -boss.y * viewport.scale + 300 });
  };

  const handlePresetAdd = async (bossNames: string[], raidName: string, defaultMapPath?: string, defaultIconPaths?: string[]) => {
    const { x: cx, y: cy } = getCanvasCenter();

    // Load default boss icons in parallel if provided
    let iconDataUrls: (string | null)[] = bossNames.map(() => null);
    if (defaultIconPaths?.length) {
      iconDataUrls = await Promise.all(
        defaultIconPaths.map(async (path) => {
          try {
            const { dataUrl } = await loadDefaultMap(path);
            return await cropToCircle(dataUrl);
          } catch { return null; }
        }),
      );
    }

    // Add all bosses with slight horizontal offset
    const total = bossNames.length;
    bossNames.forEach((name, i) => {
      const offsetX = total > 1 ? (i - (total - 1) / 2) * 50 : 0;
      addBoss(name, iconDataUrls[i] ?? null, cx + offsetX, cy);
    });

    // Load default map if provided
    if (defaultMapPath) {
      try {
        const { dataUrl, width, height } = await loadDefaultMap(defaultMapPath);
        const mapId = addMap(raidName, dataUrl, width, height);
        updateMapLock(mapId, true);
        setActiveMap(mapId);
        const { stageWidth: sw, stageHeight: sh } = useAppStore.getState();
        const s = Math.min(sw / width, sh / height);
        setViewport({ x: (sw - width * s) / 2, y: (sh - height * s) / 2 });
      } catch { /* map load failed, continue without it */ }
    } else {
      // Auto-select matching existing map
      const match = maps.find((m) => m.name === raidName);
      if (match) setActiveMap(match.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12, gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="首领名称"
          style={{
            flex: 1,
            padding: '4px 8px',
            border: '1px solid var(--color-wow-border)',
            borderRadius: 4,
            background: 'var(--color-wow-dark)',
            color: '#fff',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button
          onClick={handleAdd}
          title="添加"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, border: 'none', borderRadius: 4,
            background: 'var(--color-wow-accent)', color: '#fff', cursor: 'pointer',
          }}
        >
          <Plus size={16} />
        </button>
        <button
          onClick={handleUploadAndAdd}
          title="上传头像"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, border: '1px solid var(--color-wow-border)',
            borderRadius: 4, background: 'transparent', color: 'var(--color-wow-muted)',
            cursor: 'pointer',
          }}
        >
          <Upload size={14} />
        </button>
      </div>

      <BossPresetSelect onAddBoss={handlePresetAdd} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--color-wow-muted)' }}>
        <span>图标大小</span>
        <input
          type="range" min={20} max={60} value={bossIconSize}
          onChange={(e) => setBossIconSize(Number(e.target.value))}
          style={{ flex: 1, height: 4 }}
        />
        <span style={{ minWidth: 24 }}>{bossIconSize}px</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {bosses.map((boss) => (
          <div
            key={boss.id}
            onClick={() => handleLocate(boss.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              marginBottom: 2, borderRadius: 4, cursor: 'pointer', fontSize: 12,
            }}
          >
            <div
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: boss.imageDataUrl ? `url(${boss.imageDataUrl}) center/cover` : '#C41F3B',
                flexShrink: 0,
              }}
            />
            <input
              value={boss.name}
              onChange={(e) => updateBossName(boss.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1, minWidth: 0, background: 'transparent', border: 'none',
                color: '#ff6666', fontSize: 12, outline: 'none',
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); moveBossUp(boss.id); }}
              title="上移一层"
              disabled={bosses.indexOf(boss) === bosses.length - 1}
              style={{
                border: 'none', background: 'transparent',
                color: bosses.indexOf(boss) === bosses.length - 1 ? 'var(--color-wow-border)' : 'var(--color-wow-muted)',
                cursor: bosses.indexOf(boss) === bosses.length - 1 ? 'default' : 'pointer', padding: 0,
              }}
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveBossDown(boss.id); }}
              title="下移一层"
              disabled={bosses.indexOf(boss) === 0}
              style={{
                border: 'none', background: 'transparent',
                color: bosses.indexOf(boss) === 0 ? 'var(--color-wow-border)' : 'var(--color-wow-muted)',
                cursor: bosses.indexOf(boss) === 0 ? 'default' : 'pointer', padding: 0,
              }}
            >
              <ChevronDown size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleBossFixed(boss.id); }}
              title={boss.fixed ? '解锁' : '锁定'}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer',
                color: boss.fixed ? '#FFD700' : 'var(--color-wow-muted)', padding: 2 }}
            >
              {boss.fixed ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeBoss(boss.id); }}
              style={{ border: 'none', background: 'transparent', color: 'var(--color-wow-muted)', cursor: 'pointer', padding: 2 }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
