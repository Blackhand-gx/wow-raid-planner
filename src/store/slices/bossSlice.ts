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
  clearBosses: () => void;
}

export const createBossSlice: StateCreator<import('../index').AppStore, [], [], BossSlice> = (set, get) => ({
  bosses: [],

  addBoss: (name, imageDataUrl = null, x = 400, y = 200) => {
    captureSnapshot(get);
    const id = nanoid();
    set((s) => ({
      bosses: [...s.bosses, { id, name, imageDataUrl, x, y, radius: BOSS_ICON_RADIUS, fixed: false }],
    }));
    return id;
  },

  removeBoss: (id) => {
    captureSnapshot(get);
    set((s) => ({ bosses: s.bosses.filter((b) => b.id !== id) }));
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

  clearBosses: () => {
    captureSnapshot(get);
    set({ bosses: [] });
  },
});
