import { useAppStore } from '../../store';
import type { ToolType } from '../../types';
import {
  MousePointer2, Hand, ArrowBigRight, Minus, Circle, Square, Type,
  Undo2, Redo2, Save, FolderOpen, ImageDown,
  ZoomIn, ZoomOut, Maximize2, Eraser, Trash2, MapPin,
} from 'lucide-react';
import { saveToFile, openFile } from '../../hooks/useKeyboardShortcuts';
import { exportToPng } from '../../utils/exportPng';
import { ANNOTATION_COLORS, RAID_MARKERS } from '../../utils/constants';

const tools: { id: ToolType; icon: typeof MousePointer2; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'pan', icon: Hand, label: '平移' },
  { id: 'arrow', icon: ArrowBigRight, label: '箭头' },
  { id: 'line', icon: Minus, label: '直线' },
  { id: 'circle', icon: Circle, label: '圆形' },
  { id: 'rect', icon: Square, label: '矩形' },
  { id: 'text', icon: Type, label: '文字' },
  { id: 'marker', icon: MapPin, label: '标记' },
  { id: 'eraser', icon: Eraser, label: '橡皮擦（仅删除标记）' },
];

const DRAWING_TOOLS: ToolType[] = ['arrow', 'line', 'circle', 'rect', 'text'];

export function Toolbar() {
  const activeTool = useAppStore((s) => s.activeTool);
  const setActiveTool = useAppStore((s) => s.setActiveTool);
  const canUndo = useAppStore((s) => s.canUndo());
  const canRedo = useAppStore((s) => s.canRedo());
  const viewport = useAppStore((s) => s.viewport);
  const setViewport = useAppStore((s) => s.setViewport);
  const annotationColor = useAppStore((s) => s.annotationColor);
  const setAnnotationColor = useAppStore((s) => s.setAnnotationColor);
  const markerType = useAppStore((s) => s.markerType);
  const setMarkerType = useAppStore((s) => s.setMarkerType);

  const handleUndo = () => {
    const store = useAppStore.getState();
    const snapshot = store.undo();
    if (snapshot) {
      try {
        const players = JSON.parse(snapshot.players);
        const bosses = JSON.parse(snapshot.bosses);
        const annotations = JSON.parse(snapshot.annotations);
        const viewport = JSON.parse(snapshot.viewport);
        const currentBosses = store.bosses;
        (useAppStore as any).setState({
          players,
          bosses: bosses.map((b: any) => ({
            ...b,
            imageDataUrl: b.imageDataUrl === '[IMG_REF]'
              ? (currentBosses.find((sb: any) => sb.id === b.id)?.imageDataUrl ?? null)
              : b.imageDataUrl,
          })),
          annotations,
          viewport,
          selectedIds: [],
        });
      } catch { /* ignore */ }
    }
  };

  const handleRedo = () => {
    const store = useAppStore.getState();
    const snapshot = store.redo();
    if (snapshot) {
      try {
        const players = JSON.parse(snapshot.players);
        const bosses = JSON.parse(snapshot.bosses);
        const annotations = JSON.parse(snapshot.annotations);
        const viewport = JSON.parse(snapshot.viewport);
        const currentBosses = store.bosses;
        (useAppStore as any).setState({
          players,
          bosses: bosses.map((b: any) => ({
            ...b,
            imageDataUrl: b.imageDataUrl === '[IMG_REF]'
              ? (currentBosses.find((sb: any) => sb.id === b.id)?.imageDataUrl ?? null)
              : b.imageDataUrl,
          })),
          annotations,
          viewport,
          selectedIds: [],
        });
      } catch { /* ignore */ }
    }
  };

  const handleSave = () => saveToFile(useAppStore.getState());
  const handleExportPng = () => exportToPng();

  const handleClearCanvas = () => {
    if (!window.confirm('确定要清空画布吗？\n所有团员、首领、标注和地图都将被删除。\n\n可以通过 Ctrl+Z 撤销此操作。')) return;
    const store = useAppStore.getState();
    store.clearPlayers();
    store.clearBosses();
    store.clearAnnotations();
    store.clearMaps();
    store.resetViewport();
    store.setScreenshotOverlay(null);
    store.setSelectedIds([]);
  };

  const showColorPicker = DRAWING_TOOLS.includes(activeTool);
  const showFillToggle = activeTool === 'circle' || activeTool === 'rect';
  const fillEnabled = useAppStore((s) => s.fillEnabled);
  const setFillEnabled = useAppStore((s) => s.setFillEnabled);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 8px', height: 48,
        background: 'var(--color-wow-panel)',
        borderBottom: '1px solid var(--color-wow-border)',
      }}
    >
      {/* File group */}
      <ToolBtn icon={FolderOpen} label="打开 Ctrl+O" onClick={openFile} />
      <ToolBtn icon={Save} label="保存 Ctrl+S" onClick={handleSave} />
      <ToolBtn icon={ImageDown} label="导出PNG" onClick={handleExportPng} />
      <ToolBtn icon={Trash2} label="清空画布" onClick={handleClearCanvas} />
      <div style={{ width: 1, height: 24, background: 'var(--color-wow-border)', margin: '0 4px' }} />

      {/* Undo/Redo */}
      <ToolBtn icon={Undo2} label="撤销 Ctrl+Z" disabled={!canUndo} onClick={handleUndo} />
      <ToolBtn icon={Redo2} label="重做 Ctrl+Y" disabled={!canRedo} onClick={handleRedo} />
      <div style={{ width: 1, height: 24, background: 'var(--color-wow-border)', margin: '0 4px' }} />

      {/* Tool group */}
      {tools.map((t) => {
        const Icon = t.icon;
        const active = activeTool === t.id;
        return (
          <button
            key={t.id}
            title={t.label}
            onClick={() => setActiveTool(t.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, border: 'none', borderRadius: 4, cursor: 'pointer',
              background: active ? 'var(--color-wow-accent)' : 'transparent',
              color: active ? '#fff' : '#8888aa',
            }}
          >
            <Icon size={18} />
          </button>
        );
      })}

      {/* Color picker — shown when a drawing tool is active */}
      {showColorPicker && (
        <>
          <div style={{ width: 1, height: 24, background: 'var(--color-wow-border)', margin: '0 4px' }} />
          {ANNOTATION_COLORS.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => setAnnotationColor(c)}
              style={{
                width: 18, height: 18, borderRadius: 3,
                background: c, border: annotationColor === c ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer', flexShrink: 0,
              }}
            />
          ))}
        </>
      )}

      {/* Fill toggle — shown when circle or rect tool is active */}
      {showFillToggle && (
        <>
          <div style={{ width: 1, height: 24, background: 'var(--color-wow-border)', margin: '0 4px' }} />
          <button
            title={fillEnabled ? '填充中 (点击禁用)' : '填充 (Shift拖拽=正圆/正方)'}
            onClick={() => setFillEnabled(!fillEnabled)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              height: 28, padding: '0 10px', border: fillEnabled ? '2px solid var(--color-wow-accent)' : '1px solid var(--color-wow-border)',
              borderRadius: 4, cursor: 'pointer',
              background: fillEnabled ? 'rgba(199,156,110,0.15)' : 'transparent',
              color: fillEnabled ? 'var(--color-wow-accent)' : 'var(--color-wow-muted)',
              fontSize: 11, whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14 }}>{fillEnabled ? '◼' : '□'}</span>
            填充
          </button>
        </>
      )}

      {/* Marker type selector — shown when marker tool is active */}
      {activeTool === 'marker' && (
        <>
          <div style={{ width: 1, height: 24, background: 'var(--color-wow-border)', margin: '0 4px' }} />
          {RAID_MARKERS.map((m) => (
            <button
              key={m}
              title={m}
              onClick={() => setMarkerType(m)}
              style={{
                width: 24, height: 24, padding: 1,
                border: markerType === m ? '2px solid #FFD700' : '2px solid transparent',
                borderRadius: 3, cursor: 'pointer',
                background: markerType === m ? 'rgba(255,215,0,0.15)' : 'transparent',
              }}
            >
              <img
                src={`/raid-markers/${m}.png`}
                alt={m}
                style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
              />
            </button>
          ))}
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Zoom controls */}
      <ToolBtn icon={ZoomOut} label="缩小" onClick={() => {
        const v = useAppStore.getState().viewport;
        setViewport({ scale: Math.max(0.1, v.scale / 1.3) });
      }} />
      <button
        title="回到 100%"
        onClick={() => setViewport({ scale: 1 })}
        style={{
          color: '#8888aa', fontSize: 12, minWidth: 40, textAlign: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        {Math.round(viewport.scale * 100)}%
      </button>
      <ToolBtn icon={ZoomIn} label="放大" onClick={() => {
        const v = useAppStore.getState().viewport;
        setViewport({ scale: Math.min(5, v.scale * 1.3) });
      }} />
      <ToolBtn icon={Maximize2} label="适应窗口" onClick={() => {
        const store = useAppStore.getState();
        const map = store.maps.find((m) => m.id === store.activeMapId);
        if (map) {
          const s = map.mapScale ?? 1;
          const { stageWidth: sw, stageHeight: sh } = store;
          store.zoomToFit(sw, sh, map.originalWidth * s, map.originalHeight * s);
        }
      }} />
    </div>
  );
}

function ToolBtn({
  icon: Icon, label, disabled, onClick,
}: {
  icon: typeof MousePointer2; label: string; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      title={label} disabled={disabled} onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, border: 'none', borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer', background: 'transparent',
        color: disabled ? '#444466' : '#8888aa', opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon size={18} />
    </button>
  );
}
