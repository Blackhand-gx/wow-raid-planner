import type { ProjectFile } from '../types';
import type { AppStore } from '../store';

export function serializeState(store: AppStore): string {
  const s = store as any;
  const doc: ProjectFile = {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    players: s.players ?? [],
    bosses: s.bosses?.map((b: any) => ({ ...b, imageDataUrl: b.imageDataUrl ? '[IMG_REF]' : null })) ?? [],
    maps: s.maps ?? [],
    activeMapId: s.activeMapId ?? null,
    annotations: s.annotations ?? [],
    viewport: s.viewport ?? { x: 0, y: 0, scale: 1 },
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
    };
  } catch {
    return null;
  }
}

export function takeSnapshot(store: AppStore): string {
  const s = store as any;
  return JSON.stringify({
    players: s.players ?? [],
    bosses: s.bosses?.map((b: any) => ({ ...b, imageDataUrl: b.imageDataUrl ? '[IMG_REF]' : null })) ?? [],
    annotations: s.annotations ?? [],
    viewport: s.viewport ?? { x: 0, y: 0, scale: 1 },
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
