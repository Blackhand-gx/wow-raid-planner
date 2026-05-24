import { create } from 'zustand';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createBossSlice, type BossSlice } from './slices/bossSlice';
import { createMapSlice, type MapSlice } from './slices/mapSlice';
import { createAnnotationSlice, type AnnotationSlice } from './slices/annotationSlice';
import { createCanvasSlice, type CanvasSlice } from './slices/canvasSlice';
import { createHistorySlice, type HistorySlice } from './slices/historySlice';

export type AppStore = PlayerSlice & BossSlice & MapSlice & AnnotationSlice & CanvasSlice & HistorySlice;

export const useAppStore = create<AppStore>()((...args) => ({
  ...createPlayerSlice(...args),
  ...createBossSlice(...args),
  ...createMapSlice(...args),
  ...createAnnotationSlice(...args),
  ...createCanvasSlice(...args),
  ...createHistorySlice(...args),
}));
