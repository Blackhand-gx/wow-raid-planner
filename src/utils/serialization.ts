import type { ProjectFile } from '../types';
import type { AppStore } from '../store';

export function serializeState(store: AppStore): string {
  const s = store as any;
  const doc: ProjectFile = {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    players: s.players ?? [],
    // 剥离 base64 imageDataUrl（减小文件体积），保留 iconPath 用于恢复时重新加载
    bosses: s.bosses?.map((b: any) => ({
      ...b,
      imageDataUrl: b.iconPath ? null : (b.imageDataUrl ? '[IMG_REF]' : null),
    })) ?? [],
    // 剥离 base64 imageDataUrl（减小文件体积），保留 mapPath 用于恢复时重新加载
    maps: s.maps?.map((m: any) => ({
      ...m,
      imageDataUrl: m.mapPath ? '' : (m.imageDataUrl || ''),
    })) ?? [],
    activeMapId: s.activeMapId ?? null,
    annotations: s.annotations ?? [],
    viewport: s.viewport ?? { x: 0, y: 0, scale: 1 },
    renderOrder: s.renderOrder ?? [],
  };
  return JSON.stringify(doc, null, 2);
}

export function deserializeState(json: string): Partial<{
  players: ProjectFile['players'];
  bosses: ProjectFile['bosses'];
  maps: ProjectFile['maps'];
  activeMapId: ProjectFile['activeMapId'];
  annotations: ProjectFile['annotations'];
  viewport: ProjectFile['viewport'];
  renderOrder: ProjectFile['renderOrder'];
}> | null {
  try {
    const doc: ProjectFile = JSON.parse(json);
    if (doc.version !== 1) return null;
    return {
      players: doc.players ?? [],
      bosses: doc.bosses ?? [],
      maps: doc.maps ?? [],
      activeMapId: doc.activeMapId,
      annotations: doc.annotations ?? [],
      viewport: doc.viewport ?? { x: 0, y: 0, scale: 1 },
      renderOrder: doc.renderOrder ?? [],
    };
  } catch {
    return null;
  }
}

export function takeSnapshot(store: AppStore): string {
  const s = store as any;
  return JSON.stringify({
    players: s.players ?? [],
    bosses: s.bosses?.map((b: any) => ({
      ...b,
      imageDataUrl: b.iconPath ? null : (b.imageDataUrl ? '[IMG_REF]' : null),
    })) ?? [],
    // 剥离 base64 imageDataUrl，保留 mapPath 用于恢复
    maps: s.maps?.map((m: any) => ({
      ...m,
      imageDataUrl: m.mapPath ? '' : (m.imageDataUrl || ''),
    })) ?? [],
    annotations: s.annotations ?? [],
    viewport: s.viewport ?? { x: 0, y: 0, scale: 1 },
    renderOrder: s.renderOrder ?? [],
  });
}

export function applySnapshot(_store: AppStore, snapshotJson: string): boolean {
  try {
    JSON.parse(snapshotJson);
    return true;
  } catch {
    return false;
  }
}
