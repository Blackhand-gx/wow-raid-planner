import type { StateCreator } from 'zustand';
import type { ToolType, ViewportState } from '../../types';
import { DEFAULT_VIEWPORT, MIN_SCALE, MAX_SCALE } from '../../utils/constants';

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
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set, _get) => ({
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
});
