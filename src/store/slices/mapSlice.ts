import type { StateCreator } from 'zustand';
import type { MapData } from '../../types';
import { nanoid } from 'nanoid';
import { captureSnapshot } from '../captureSnapshot';

export interface MapSlice {
  maps: MapData[];
  activeMapId: string | null;
  addMap: (name: string, imageDataUrl: string, w: number, h: number) => string;
  removeMap: (id: string) => void;
  setActiveMap: (id: string) => void;
  updateMapName: (id: string, name: string) => void;
  updateMapOpacity: (id: string, opacity: number) => void;
  updateMapScale: (id: string, scale: number) => void;
  updateMapOffset: (id: string, offsetX: number, offsetY: number) => void;
  updateMapLock: (id: string, locked: boolean) => void;
  centerMap: (id: string) => void;
  clearMaps: () => void;
}

export const createMapSlice: StateCreator<import('../index').AppStore, [], [], MapSlice> = (set, get) => ({
  maps: [],
  activeMapId: null,

  addMap: (name, imageDataUrl, originalWidth, originalHeight) => {
    captureSnapshot(get);
    const id = nanoid();
    const { stageWidth, stageHeight } = get();
    const fitScale = Math.min(stageWidth / originalWidth, stageHeight / originalHeight);
    set((s) => ({
      maps: [...s.maps, { id, name, imageDataUrl, originalWidth, originalHeight, opacity: 0.85, mapScale: fitScale, offsetX: 0, offsetY: 0, locked: false }],
    }));
    if (!get().activeMapId) {
      set({ activeMapId: id });
    }
    return id;
  },

  removeMap: (id) => {
    captureSnapshot(get);
    set((s) => {
      const nextMaps = s.maps.filter((m) => m.id !== id);
      const nextActive = s.activeMapId === id ? (nextMaps[0]?.id ?? null) : s.activeMapId;
      return { maps: nextMaps, activeMapId: nextActive };
    });
  },

  setActiveMap: (activeMapId) => set({ activeMapId }),

  updateMapName: (id, name) => set((s) => ({
    maps: s.maps.map((m) => (m.id === id ? { ...m, name } : m)),
  })),

  updateMapOpacity: (id, opacity) => set((s) => ({
    maps: s.maps.map((m) => (m.id === id ? { ...m, opacity } : m)),
  })),

  updateMapScale: (id, mapScale) => set((s) => ({
    maps: s.maps.map((m) => (m.id === id ? { ...m, mapScale } : m)),
  })),

  updateMapOffset: (id, offsetX, offsetY) => set((s) => ({
    maps: s.maps.map((m) => (m.id === id ? { ...m, offsetX, offsetY } : m)),
  })),

  updateMapLock: (id, locked) => set((s) => ({
    maps: s.maps.map((m) => (m.id === id ? { ...m, locked } : m)),
  })),

  centerMap: (id) => {
    const state = get();
    const map = state.maps.find((m) => m.id === id);
    if (!map) return;
    const { stageWidth, stageHeight, viewport } = state;
    const s = map.mapScale ?? 1;
    const ox = map.offsetX ?? 0;
    const oy = map.offsetY ?? 0;
    const w = map.originalWidth * s;
    const h = map.originalHeight * s;
    const cx = ox + w / 2;
    const cy = oy + h / 2;
    state.setViewport({
      x: stageWidth / 2 - cx * viewport.scale,
      y: stageHeight / 2 - cy * viewport.scale,
    });
  },

  clearMaps: () => {
    captureSnapshot(get);
    set({ maps: [], activeMapId: null });
  },
});
