import { useState } from 'react';
import { useAppStore } from '../../store';
import { ClassPicker } from '../shared/ClassPicker';
import { getClassDef } from '../../data/classes';
import type { WoWClass } from '../../types';
import type { DetectedPlayer } from '../../utils/screenshotAnalysis';
import { X, Check, AlertCircle } from 'lucide-react';

interface Props {
  players: DetectedPlayer[];
  onClose: () => void;
}

export function AutoDetectDialog({ players: detected, onClose }: Props) {
  const addPlayer = useAppStore((s) => s.addPlayer);
  const viewport = useAppStore((s) => s.viewport);

  const [selections, setSelections] = useState<Record<number, boolean>>(
    Object.fromEntries(detected.map((_, i) => [i, true]))
  );
  const [classOverrides, setClassOverrides] = useState<Record<number, WoWClass>>({});
  const [nameOverrides, setNameOverrides] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);

  const toggleRow = (i: number) => {
    setSelections((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const setClass = (i: number, cls: WoWClass) => {
    setClassOverrides((prev) => ({ ...prev, [i]: cls }));
  };

  const setName = (i: number, name: string) => {
    setNameOverrides((prev) => ({ ...prev, [i]: name }));
  };

  const handleImport = () => {
    setImporting(true);

    const selected = detected
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => selections[i]);

    if (selected.length === 0) {
      setImporting(false);
      return;
    }

    // Place players in a grid layout in the center of the current viewport
    const cols = Math.min(5, Math.ceil(Math.sqrt(selected.length)));
    const spacing = 55;
    const canvasCenterX = (-viewport.x + window.innerWidth / 2) / viewport.scale;
    const canvasCenterY = (-viewport.y + window.innerHeight / 2) / viewport.scale;
    const startX = canvasCenterX - ((cols - 1) * spacing) / 2;
    const startY = canvasCenterY - (Math.ceil(selected.length / cols) * spacing) / 2;

    for (let idx = 0; idx < selected.length; idx++) {
      const { p, i } = selected[idx];
      const cls = classOverrides[i] || p.className;
      const name = nameOverrides[i] || p.name;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      addPlayer(name, cls, startX + col * spacing, startY + row * spacing);
    }

    setImporting(false);
    onClose();
  };

  const selectedCount = Object.values(selections).filter(Boolean).length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 6000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--color-wow-panel)',
          border: '1px solid var(--color-wow-border)',
          borderRadius: 12,
          maxWidth: 560,
          width: '92%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid var(--color-wow-border)',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-wow-accent)' }}>
              识别结果
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-wow-muted)', marginTop: 2 }}>
              识别到 {detected.length} 名团员，已选 {selectedCount} 名
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: 'var(--color-wow-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Player list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
          {detected.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 32, color: 'var(--color-wow-muted)', fontSize: 13,
            }}>
              <AlertCircle size={32} style={{ marginBottom: 8 }} />
              <div>未能识别到团员</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>请尝试使用手动点击导入</div>
            </div>
          ) : (
            detected.map((p, i) => {
              const cls = classOverrides[i] || p.className;
              const clsDef = getClassDef(cls);
              const name = nameOverrides[i] !== undefined ? nameOverrides[i] : p.name;
              const isSelected = selections[i];
              return (
                <div
                  key={i}
                  onClick={() => toggleRow(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', marginBottom: 4,
                    borderRadius: 6, cursor: 'pointer',
                    background: isSelected ? 'rgba(199,156,110,0.08)' : 'transparent',
                    border: isSelected ? '1px solid rgba(199,156,110,0.2)' : '1px solid transparent',
                    opacity: isSelected ? 1 : 0.5,
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${isSelected ? 'var(--color-wow-accent)' : 'var(--color-wow-border)'}`,
                    background: isSelected ? 'var(--color-wow-accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <Check size={10} color="#000" />}
                  </div>

                  {/* Class icon */}
                  <img src={clsDef.iconPath} alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />

                  {/* Name input */}
                  <input
                    value={name}
                    onChange={(e) => setName(i, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1, minWidth: 0, padding: '3px 6px',
                      border: '1px solid var(--color-wow-border)', borderRadius: 4,
                      background: 'var(--color-wow-dark)', color: '#fff', fontSize: 12, outline: 'none',
                    }}
                  />

                  {/* Class picker */}
                  <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <ClassPicker value={cls} onChange={(c) => setClass(i, c)} />
                  </div>

                  {/* Confidence badge */}
                  <span style={{
                    fontSize: 10, color: 'var(--color-wow-muted)',
                    background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 8,
                    whiteSpace: 'nowrap',
                  }}>
                    {Math.round(p.confidence * 100)}%
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderTop: '1px solid var(--color-wow-border)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-wow-muted)' }}>
            姓名中 *-* 格式已自动截取 - 前内容
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 16px', border: 'none', borderRadius: 6,
                background: 'transparent', color: 'var(--color-wow-muted)',
                cursor: 'pointer', fontSize: 12,
              }}
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0 || importing}
              style={{
                padding: '6px 20px', border: 'none', borderRadius: 6,
                background: selectedCount > 0 ? 'var(--color-wow-accent)' : 'var(--color-wow-border)',
                color: selectedCount > 0 ? '#000' : 'var(--color-wow-muted)',
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                fontSize: 12, fontWeight: 600,
              }}
            >
              {importing ? '导入中...' : `导入 ${selectedCount} 名团员`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
