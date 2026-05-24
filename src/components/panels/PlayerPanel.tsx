import { useState, useCallback } from 'react';
import { useAppStore } from '../../store';
import { ClassPicker } from '../shared/ClassPicker';
import type { WoWClass } from '../../types';
import { getClassDef } from '../../data/classes';
import { Trash2, Plus, Sparkles, X } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { getCanvasCenter } from '../../utils/canvasCenter';
import { analyzeScreenshot } from '../../utils/screenshotAnalysis';
import { parseMRTRosterString } from '../../utils/mrtParser';
import type { DetectedPlayer } from '../../utils/screenshotAnalysis';
import { AutoDetectDialog } from '../dialogs/AutoDetectDialog';

export function PlayerPanel() {
  const players = useAppStore((s) => s.players);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const removePlayer = useAppStore((s) => s.removePlayer);
  const playerIconSize = useAppStore((s) => s.playerIconSize);
  const updatePlayerName = useAppStore((s) => s.updatePlayerName);
  const setPlayerIconSize = useAppStore((s) => s.setPlayerIconSize);
  const setViewport = useAppStore((s) => s.setViewport);
  const { uploadFile, openFileDialog } = useImageUpload();

  const [name, setName] = useState('');
  const [className, setClassName] = useState<WoWClass>('warrior');

  const [autoDetected, setAutoDetected] = useState<DetectedPlayer[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [showMRTDialog, setShowMRTDialog] = useState(false);
  const [mrtInput, setMRTInput] = useState('');
  const [mrtError, setMRTError] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const { x: cx, y: cy } = getCanvasCenter();
    addPlayer(name.trim(), className, cx + players.length * 30, cy + players.length * 30);
    setName('');
  };

  const handleAutoDetect = useCallback(async (dataUrl: string) => {
    setIsAnalyzing(true);
    setProgressMsg('准备中...');
    setProgressPct(0);
    try {
      const detectedPlayers = await analyzeScreenshot(dataUrl, (msg, pct) => {
        setProgressMsg(msg);
        setProgressPct(pct);
      });
      setAutoDetected(detectedPlayers);
    } catch {
      alert('识别失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleMRTImport = () => {
    if (!mrtInput.trim()) return;
    setMRTError('');
    try {
      const names = parseMRTRosterString(mrtInput.trim());
      if (names.length === 0) {
        setMRTError('未能解析到任何玩家名称，请检查字符串格式');
        return;
      }
      const players: DetectedPlayer[] = names.map((name) => ({
        className: 'unknown' as WoWClass,
        confidence: 0.5,
        name,
      }));
      setAutoDetected(players);
      setShowMRTDialog(false);
      setMRTInput('');
    } catch (e) {
      setMRTError(`解析失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  const handleDirectImport = async () => {
    const file = await openFileDialog();
    if (!file) return;
    try {
      const { dataUrl } = await uploadFile(file);
      handleAutoDetect(dataUrl);
    } catch {
      alert('图片加载失败');
    }
  };

  const handleLocate = (id: string) => {
    const player = players.find((p) => p.id === id);
    if (!player) return;
    const { viewport } = useAppStore.getState();
    setViewport({ x: -player.x * viewport.scale + 400, y: -player.y * viewport.scale + 300 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12, gap: 8 }}>
      {/* Add form */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <ClassPicker value={className} onChange={setClassName} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="角色名称"
          style={{
            flex: 1, minWidth: 0, padding: '4px 8px',
            border: '1px solid var(--color-wow-border)', borderRadius: 4,
            background: 'var(--color-wow-dark)', color: '#fff', fontSize: 12, outline: 'none',
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
      </div>

      {/* Auto-detect import button */}
      {isAnalyzing ? (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          width: '100%', padding: '6px 8px',
          border: '1px dashed var(--color-wow-accent)', borderRadius: 6,
          background: 'rgba(199,156,110,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="var(--color-wow-accent)" />
            <span style={{ flex: 1, color: 'var(--color-wow-accent)', fontSize: 11 }}>
              {progressMsg}
            </span>
            <span style={{ color: 'var(--color-wow-accent)', fontSize: 11, fontWeight: 600 }}>
              {progressPct}%
            </span>
          </div>
          <div style={{
            width: '100%', height: 4, borderRadius: 2,
            background: 'rgba(199,156,110,0.2)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${progressPct}%`, height: '100%', borderRadius: 2,
              background: 'var(--color-wow-accent)',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={handleDirectImport}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '6px 0',
              border: '1px dashed var(--color-wow-accent)', borderRadius: 6,
              background: 'rgba(199,156,110,0.08)', color: 'var(--color-wow-accent)',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            <Sparkles size={14} />
            导入图片自动识别团员
          </button>
          <button
            onClick={() => { setShowMRTDialog(true); setMRTInput(''); setMRTError(''); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '6px 0',
              border: '1px dashed var(--color-wow-accent)', borderRadius: 6,
              background: 'rgba(199,156,110,0.08)', color: 'var(--color-wow-accent)',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            <Sparkles size={14} />
            从 MRT 阵容字符串导入
          </button>
        </>
      )}

      {/* Icon size control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--color-wow-muted)' }}>
        <span>图标大小</span>
        <input
          type="range" min={14} max={40} value={playerIconSize}
          onChange={(e) => setPlayerIconSize(Number(e.target.value))}
          style={{ flex: 1, height: 4 }}
        />
        <span style={{ minWidth: 24 }}>{playerIconSize}px</span>
      </div>

      {/* Player list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {players.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-wow-muted)', fontSize: 12, marginTop: 24 }}>
            暂无团员，添加或导入图片识别
          </div>
        ) : (
          players.map((p) => {
            const cls = getClassDef(p.className);
            return (
              <div
                key={p.id}
                onClick={() => handleLocate(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  marginBottom: 2, borderRadius: 4, cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <img src={cls.iconPath} alt="" style={{ width: 22, height: 22, flexShrink: 0 }} />
                {p.marker && (
                  <img
                    src={`/raid-markers/${p.marker}.png`}
                    alt={p.marker}
                    style={{ width: 14, height: 14, flexShrink: 0, imageRendering: 'pixelated' }}
                  />
                )}
                {p.role && (
                  <img
                    src={`/role-icons/${p.role}.png`}
                    alt={p.role}
                    style={{ width: 16, height: 16, flexShrink: 0, imageRendering: 'auto' }}
                  />
                )}
                <input
                  value={p.name}
                  onChange={(e) => updatePlayerName(p.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1, minWidth: 0, background: 'transparent', border: 'none',
                    color: cls.color, fontSize: 12, outline: 'none',
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--color-wow-muted)' }}>
                  ({Math.round(p.x)}, {Math.round(p.y)})
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removePlayer(p.id); }}
                  style={{
                    border: 'none', background: 'transparent',
                    color: 'var(--color-wow-muted)', cursor: 'pointer', padding: 2,
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Auto-detect results dialog */}
      {autoDetected && (
        <AutoDetectDialog
          players={autoDetected}
          onClose={() => setAutoDetected(null)}
        />
      )}

      {/* MRT import dialog */}
      {showMRTDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 6000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMRTDialog(false); }}
        >
          <div
            style={{
              background: 'var(--color-wow-panel)',
              border: '1px solid var(--color-wow-border)',
              borderRadius: 12,
              maxWidth: 560,
              width: '92%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid var(--color-wow-border)',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-wow-accent)' }}>
                  导入 MRT 阵容
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-wow-muted)', marginTop: 2, lineHeight: 1.6 }}>
                  游戏中输入 /MRT → 阵容设置 → 设置当前阵容 → 导出当前阵容 → 选择第一种格式并复制 → 在此粘贴并解析
                </div>
              </div>
              <button
                onClick={() => setShowMRTDialog(false)}
                style={{ border: 'none', background: 'transparent', color: 'var(--color-wow-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <textarea
                value={mrtInput}
                onChange={(e) => { setMRTInput(e.target.value); setMRTError(''); }}
                placeholder="在此粘贴 MRT 阵容设置字符串..."
                rows={6}
                style={{
                  width: '100%', padding: '8px 12px',
                  border: '1px solid var(--color-wow-border)', borderRadius: 6,
                  background: 'var(--color-wow-dark)', color: '#fff', fontSize: 12,
                  outline: 'none', resize: 'vertical',
                }}
              />
              {mrtError && (
                <div style={{ color: '#f56565', fontSize: 11, marginTop: 4 }}>{mrtError}</div>
              )}
            </div>
            <div style={{
              display: 'flex', gap: 8, justifyContent: 'flex-end',
              padding: '12px 16px', borderTop: '1px solid var(--color-wow-border)',
            }}>
              <button
                onClick={() => setShowMRTDialog(false)}
                style={{
                  padding: '6px 16px', border: 'none', borderRadius: 6,
                  background: 'transparent', color: 'var(--color-wow-muted)',
                  cursor: 'pointer', fontSize: 12,
                }}
              >
                取消
              </button>
              <button
                onClick={handleMRTImport}
                disabled={!mrtInput.trim()}
                style={{
                  padding: '6px 20px', border: 'none', borderRadius: 6,
                  background: mrtInput.trim() ? 'var(--color-wow-accent)' : 'var(--color-wow-border)',
                  color: mrtInput.trim() ? '#000' : 'var(--color-wow-muted)',
                  cursor: mrtInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                解析导入
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
