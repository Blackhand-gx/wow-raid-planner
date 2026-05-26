import type { StateCreator } from 'zustand';
import type { ToolType, ViewportState } from '../../types';
import { DEFAULT_VIEWPORT, MIN_SCALE, MAX_SCALE } from '../../utils/constants';
import { captureSnapshot } from '../captureSnapshot';

export interface SelectRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSlice {
  viewport: ViewportState;
  activeTool: ToolType;
  selectedIds: string[];
  playerIconSize: number;
  bossIconSize: number;
  selectRect: SelectRect | null;
  screenshotOverlay: string | null;
  isImportMode: boolean;
  annotationColor: string;
  markerSize: number;
  markerType: string;
  sidebarTab: string;
  stageWidth: number;
  stageHeight: number;
  renderOrder: string[];

  setViewport: (vp: Partial<ViewportState>) => void;
  zoomToFit: (stageW: number, stageH: number, mapW: number, mapH: number) => void;
  resetViewport: () => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  deselectAll: () => void;
  setPlayerIconSize: (size: number) => void;
  setBossIconSize: (size: number) => void;
  setSelectRect: (rect: SelectRect | null) => void;
  setScreenshotOverlay: (dataUrl: string | null) => void;
  setImportMode: (mode: boolean) => void;
  setSidebarTab: (tab: string) => void;
  setAnnotationColor: (color: string) => void;
  setMarkerSize: (size: number) => void;
  setMarkerType: (type: string) => void;
  setStageSize: (w: number, h: number) => void;
  setRenderOrder: (order: string[]) => void;
  moveInRenderOrder: (id: string, direction: 'up' | 'down') => void;
  moveToRenderPosition: (id: string, targetIndex: number) => void;
  addToRenderOrder: (id: string) => void;
  removeFromRenderOrder: (id: string) => void;
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set, get) => ({
  viewport: { ...DEFAULT_VIEWPORT },
  activeTool: 'select',
  selectedIds: [],
  playerIconSize: 22,
  bossIconSize: 40,
  selectRect: null,
  screenshotOverlay: null,
  isImportMode: false,
  annotationColor: '#FF4444',
  markerSize: 24,
  markerType: 'star',
  sidebarTab: 'players',
  stageWidth: 800,
  stageHeight: 600,
  renderOrder: [],

  setViewport: (vp) => set((s) => {
    const next = { ...s.viewport, ...vp };
    next.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next.scale));
    return { viewport: next };
  }),

  zoomToFit: (stageW, stageH, mapW, mapH) => {
    const scale = Math.min(stageW / mapW, stageH / mapH, 1);
    const x = (stageW - mapW * scale) / 2;
    const y = (stageH - mapH * scale) / 2;
    set({ viewport: { x, y, scale } });
  },

  resetViewport: () => set({ viewport: { ...DEFAULT_VIEWPORT } }),

  setActiveTool: (activeTool) => set({ activeTool }),

  setSelectedIds: (selectedIds) => set({ selectedIds }),

  addToSelection: (id) => set((s) => ({
    selectedIds: s.selectedIds.includes(id) ? s.selectedIds : [...s.selectedIds, id],
  })),

  toggleSelection: (id) => set((s) => ({
    selectedIds: s.selectedIds.includes(id)
      ? s.selectedIds.filter((sid) => sid !== id)
      : [...s.selectedIds, id],
  })),

  deselectAll: () => set({ selectedIds: [] }),

  setPlayerIconSize: (playerIconSize) => set({ playerIconSize }),
  setBossIconSize: (bossIconSize) => set({ bossIconSize }),
  setSelectRect: (selectRect) => set({ selectRect }),

  setScreenshotOverlay: (dataUrl: string | null) => set({ screenshotOverlay: dataUrl, isImportMode: dataUrl !== null }),
  setImportMode: (mode: boolean) => set({ isImportMode: mode }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setAnnotationColor: (annotationColor) => set({ annotationColor }),
  setMarkerSize: (markerSize) => set({ markerSize }),
  setMarkerType: (markerType) => set({ markerType }),

  setStageSize: (w, h) => set({ stageWidth: Math.floor(w), stageHeight: Math.floor(h) }),

  setRenderOrder: (renderOrder) => set({ renderOrder }),

  moveInRenderOrder: (id, direction) => set((s) => {
    const idx = s.renderOrder.indexOf(id);
    if (idx === -1) return s;
    if (direction === 'up' && idx >= s.renderOrder.length - 1) return s;
    if (direction === 'down' && idx <= 0) return s;
    const next = [...s.renderOrder];
    const target = direction === 'up' ? idx + 1 : idx - 1;
    [next[idx], next[target]] = [next[target], next[idx]];
    return { renderOrder: next };
  }),

  moveToRenderPosition: (id, targetIndex) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.renderOrder.indexOf(id);
      if (idx === -1 || idx === targetIndex) return s;
      const next = [...s.renderOrder];
      next.splice(idx, 1);
      next.splice(targetIndex, 0, id);
      return { renderOrder: next };
    });
  },

  addToRenderOrder: (id) => set((s) => ({
    renderOrder: [...s.renderOrder, id],
  })),

  removeFromRenderOrder: (id) => set((s) => ({
    renderOrder: s.renderOrder.filter((rid) => rid !== id),
  })),
});
