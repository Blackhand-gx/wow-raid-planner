import { useEffect } from 'react';
import { useAppStore } from '../store';
import { serializeState, deserializeState } from '../utils/serialization';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;
      const store = useAppStore.getState();

      if (ctrl && e.key === 'z') {
        e.preventDefault();
        const snapshot = store.undo();
        if (snapshot) restoreSnapshot(snapshot);
      } else if (ctrl && e.key === 'y') {
        e.preventDefault();
        const snapshot = store.redo();
        if (snapshot) restoreSnapshot(snapshot);
      } else if (ctrl && e.key === 's') {
        e.preventDefault();
        saveToFile(store);
      } else if (ctrl && e.key === 'o') {
        e.preventDefault();
        openFile();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected(store);
      } else if (e.key === 'Escape') {
        store.deselectAll();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

function restoreSnapshot(snapshot: any) {
  const store = useAppStore.getState();
  try {
    const players = JSON.parse(snapshot.players);
    const bossesParsed = JSON.parse(snapshot.bosses);
    const annotations = JSON.parse(snapshot.annotations);
    const viewport = JSON.parse(snapshot.viewport);
    const renderOrder = JSON.parse(snapshot.renderOrder || '[]');

    const currentBosses = store.bosses;
    const bosses = bossesParsed.map((b: any) => ({
      ...b,
      imageDataUrl: b.imageDataUrl === '[IMG_REF]'
        ? (currentBosses.find((sb: any) => sb.id === b.id)?.imageDataUrl ?? null)
        : b.imageDataUrl,
    }));

    (useAppStore as any).setState({
      players,
      bosses,
      annotations,
      viewport,
      renderOrder,
      selectedIds: [],
    });
  } catch { /* ignore */ }
}

function saveToFile(store: any) {
  const json = serializeState(store);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wow-raid-plan-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function openFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = deserializeState(text);
      if (!data) {
        alert('文件格式不正确');
        return;
      }
      (useAppStore as any).setState({
        players: data.players ?? [],
        bosses: data.bosses ?? [],
        maps: data.maps ?? [],
        activeMapId: data.activeMapId ?? null,
        annotations: data.annotations ?? [],
        viewport: data.viewport ?? { x: 0, y: 0, scale: 1 },
        renderOrder: data.renderOrder ?? [],
        undoStack: [],
        redoStack: [],
        selectedIds: [],
      });
    } catch {
      alert('文件加载失败');
    }
  };
  input.click();
}

function deleteSelected(store: any) {
  const ids = store.selectedIds as string[];
  if (ids.length === 0) return;

  const idSet = new Set(ids);
  (useAppStore as any).setState({
    players: store.players.filter((p: any) => !idSet.has(p.id)),
    bosses: store.bosses.filter((b: any) => !idSet.has(b.id)),
    annotations: store.annotations.filter((a: any) => !idSet.has(a.id)),
    renderOrder: (store.renderOrder as string[]).filter((rid) => !idSet.has(rid)),
    selectedIds: [],
  });
}

// Export for toolbar usage
export { saveToFile, openFile };
