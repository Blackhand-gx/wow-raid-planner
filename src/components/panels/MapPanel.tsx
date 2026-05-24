import { useAppStore } from '../../store';
import { useImageUpload } from '../../hooks/useImageUpload';
import { loadDefaultMap } from '../../utils/defaultMap';
import { getCanvasCenter } from '../../utils/canvasCenter';
import { cropToCircle } from '../../utils/imageResize';
import { Upload, Trash2, Lock, Unlock, Crosshair } from 'lucide-react';
import { BossPresetSelect } from '../shared/BossPresetSelect';

export function MapPanel() {
  const maps = useAppStore((s) => s.maps);
  const activeMapId = useAppStore((s) => s.activeMapId);
  const addMap = useAppStore((s) => s.addMap);
  const removeMap = useAppStore((s) => s.removeMap);
  const setActiveMap = useAppStore((s) => s.setActiveMap);
  const updateMapOpacity = useAppStore((s) => s.updateMapOpacity);
  const updateMapScale = useAppStore((s) => s.updateMapScale);
  const updateMapLock = useAppStore((s) => s.updateMapLock);
  const centerMap = useAppStore((s) => s.centerMap);
  const updateMapName = useAppStore((s) => s.updateMapName);
  const setViewport = useAppStore((s) => s.setViewport);
  const { uploadFile, openFileDialog } = useImageUpload();

  const addBoss = useAppStore((s) => s.addBoss);

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
          } catch (e) { console.error('Boss icon load failed:', path, e); return null; }
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
      } catch (e) { console.error('Map load failed:', defaultMapPath, e); }
    } else {
      // Auto-select matching existing map
      const match = maps.find((m) => m.name === raidName);
      if (match) setActiveMap(match.id);
    }
  };

  const handleUpload = async () => {
    const file = await openFileDialog();
    if (!file) return;
    try {
      const { dataUrl, width, height } = await uploadFile(file);
      const name = file.name.replace(/\.[^.]+$/, '');
      const mapId = addMap(name, dataUrl, width, height);
      setActiveMap(mapId);
      const { stageWidth: sw, stageHeight: sh } = useAppStore.getState();
      const s = Math.min((sw - 80) / width, (sh - 80) / height);
      setViewport({ x: (sw - width * s) / 2, y: (sh - height * s) / 2 });
    } catch {
      alert('图片加载失败，请重试');
    }
  };

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <button
        onClick={handleUpload}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
          padding: '8px 0',
          border: '1px dashed var(--color-wow-border)',
          borderRadius: 6,
          background: 'transparent',
          color: 'var(--color-wow-muted)',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        <Upload size={16} />
        上传地图背景
      </button>

      <BossPresetSelect onAddBoss={handlePresetAdd} />

      <div style={{ flex: 1, overflow: 'auto' }}>
        {maps.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-wow-muted)', fontSize: 12, marginTop: 24 }}>
            暂无地图，点击上方按钮上传
          </div>
        ) : (
          maps.map((map) => {
            const isActive = map.id === activeMapId;
            return (
              <div
                key={map.id}
                onClick={() => setActiveMap(map.id)}
                style={{
                  padding: 8,
                  marginBottom: 6,
                  border: isActive ? '1px solid var(--color-wow-accent)' : '1px solid transparent',
                  borderRadius: 6,
                  background: isActive ? 'rgba(199,156,110,0.08)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: 80,
                    borderRadius: 4,
                    background: `url(${map.imageDataUrl}) center/cover`,
                    opacity: map.opacity,
                    marginBottom: 6,
                  }}
                />
                <input
                  value={map.name}
                  onChange={(e) => updateMapName(map.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: isActive ? '#fff' : 'var(--color-wow-muted)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <label style={{ fontSize: 10, color: 'var(--color-wow-muted)' }}>
                    透明度
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={Math.round(map.opacity * 100)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateMapOpacity(map.id, Number(e.target.value) / 100)}
                    style={{ flex: 1, height: 4 }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMap(map.id);
                    }}
                    title="删除地图"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-wow-muted)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <label style={{ fontSize: 10, color: 'var(--color-wow-muted)' }}>
                    缩放
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={300}
                    step={5}
                    value={Math.round((map.mapScale ?? 1) * 100)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateMapScale(map.id, Number(e.target.value) / 100)}
                    style={{ flex: 1, height: 4 }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--color-wow-muted)', minWidth: 32, textAlign: 'right' }}>
                    {Math.round((map.mapScale ?? 1) * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateMapLock(map.id, !map.locked); }}
                    title={map.locked ? '解锁地图' : '锁定地图'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', border: '1px solid var(--color-wow-border)',
                      borderRadius: 4, cursor: 'pointer', fontSize: 11,
                      background: map.locked ? 'rgba(255,68,68,0.15)' : 'transparent',
                      color: map.locked ? '#ff4444' : 'var(--color-wow-muted)',
                    }}
                  >
                    {map.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    {map.locked ? '已锁定' : '锁定'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); centerMap(map.id); }}
                    title="居中地图"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', border: '1px solid var(--color-wow-border)',
                      borderRadius: 4, cursor: 'pointer', fontSize: 11,
                      background: 'transparent',
                      color: 'var(--color-wow-muted)',
                    }}
                  >
                    <Crosshair size={12} />
                    居中
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
