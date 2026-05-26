import type { StateCreator } from 'zustand';
import type { Boss } from '../../types';
import { nanoid } from 'nanoid';
import { BOSS_ICON_RADIUS } from '../../utils/constants';
import { captureSnapshot } from '../captureSnapshot';

export interface BossSlice {
  bosses: Boss[];
  addBoss: (name: string, imageDataUrl?: string | null, x?: number, y?: number) => string;
  removeBoss: (id: string) => void;
  updateBossPosition: (id: string, x: number, y: number) => void;
  updateBossName: (id: string, name: string) => void;
  updateBossImage: (id: string, imageDataUrl: string) => void;
  toggleBossFixed: (id: string) => void;
  bringBossToFront: (id: string) => void;
  sendBossToBack: (id: string) => void;
  moveBossUp: (id: string) => void;
  moveBossDown: (id: string) => void;
  clearBosses: () => void;
}

function roMoveToFront(id: string, renderOrder: string[]): string[] {
  const idx = renderOrder.indexOf(id);
  if (idx === -1 || idx === renderOrder.length - 1) return renderOrder;
  const next = [...renderOrder];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  return next;
}

function roMoveToBack(id: string, renderOrder: string[]): string[] {
  const idx = renderOrder.indexOf(id);
  if (idx <= 0) return renderOrder;
  const next = [...renderOrder];
  [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
  return next;
}

function roToEnd(id: string, renderOrder: string[]): string[] {
  const idx = renderOrder.indexOf(id);
  if (idx === -1 || idx === renderOrder.length - 1) return renderOrder;
  const next = renderOrder.filter((rid) => rid !== id);
  next.push(id);
  return next;
}

function roToStart(id: string, renderOrder: string[]): string[] {
  const idx = renderOrder.indexOf(id);
  if (idx <= 0) return renderOrder;
  const next = renderOrder.filter((rid) => rid !== id);
  next.unshift(id);
  return next;
}

export const createBossSlice: StateCreator<import('../index').AppStore, [], [], BossSlice> = (set, get) => ({
  bosses: [],

  addBoss: (name, imageDataUrl = null, x = 400, y = 200) => {
    captureSnapshot(get);
    const id = nanoid();
    set((s) => ({
      bosses: [...s.bosses, { id, name, imageDataUrl, x, y, radius: BOSS_ICON_RADIUS, fixed: false }],
      renderOrder: [...s.renderOrder, id],
    }));
    return id;
  },

  removeBoss: (id) => {
    captureSnapshot(get);
    set((s) => ({
      bosses: s.bosses.filter((b) => b.id !== id),
      renderOrder: s.renderOrder.filter((rid) => rid !== id),
    }));
  },

  updateBossPosition: (id, x, y) => set((s) => ({
    bosses: s.bosses.map((b) => (b.id === id ? { ...b, x, y } : b)),
  })),

  updateBossName: (id, name) => set((s) => ({
    bosses: s.bosses.map((b) => (b.id === id ? { ...b, name } : b)),
  })),

  updateBossImage: (id, imageDataUrl) => set((s) => ({
    bosses: s.bosses.map((b) => (b.id === id ? { ...b, imageDataUrl } : b)),
  })),

  toggleBossFixed: (id) => set((s) => ({
    bosses: s.bosses.map((b) => (b.id === id ? { ...b, fixed: !b.fixed } : b)),
  })),

  bringBossToFront: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.bosses.findIndex((b) => b.id === id);
      if (idx === -1 || idx === s.bosses.length - 1) return s;
      const bosses = [...s.bosses];
      const [item] = bosses.splice(idx, 1);
      bosses.push(item);
      return { bosses, renderOrder: roToEnd(id, s.renderOrder) };
    });
  },

  sendBossToBack: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.bosses.findIndex((b) => b.id === id);
      if (idx <= 0) return s;
      const bosses = [...s.bosses];
      const [item] = bosses.splice(idx, 1);
      bosses.unshift(item);
      return { bosses, renderOrder: roToStart(id, s.renderOrder) };
    });
  },

  moveBossUp: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.bosses.findIndex((b) => b.id === id);
      if (idx === -1 || idx >= s.bosses.length - 1) return s;
      const bosses = [...s.bosses];
      [bosses[idx], bosses[idx + 1]] = [bosses[idx + 1], bosses[idx]];
      return { bosses, renderOrder: roMoveToFront(id, s.renderOrder) };
    });
  },

  moveBossDown: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.bosses.findIndex((b) => b.id === id);
      if (idx <= 0) return s;
      const bosses = [...s.bosses];
      [bosses[idx], bosses[idx - 1]] = [bosses[idx - 1], bosses[idx]];
      return { bosses, renderOrder: roMoveToBack(id, s.renderOrder) };
    });
  },

  clearBosses: () => {
    captureSnapshot(get);
    set((s) => ({
      bosses: [],
      renderOrder: s.renderOrder.filter((rid) => !s.bosses.some((b) => b.id === rid)),
    }));
  },
});
