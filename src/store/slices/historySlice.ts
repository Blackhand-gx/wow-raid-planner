import type { StateCreator } from 'zustand';
import type { HistorySnapshot } from '../../types';
import { MAX_HISTORY } from '../../utils/constants';

export interface HistorySlice {
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  pushSnapshot: (snapshot: HistorySnapshot) => void;
  undo: () => HistorySnapshot | null;
  redo: () => HistorySnapshot | null;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const createHistorySlice: StateCreator<HistorySlice> = (set, get) => ({
  undoStack: [],
  redoStack: [],

  pushSnapshot: (snapshot) => set((s) => {
    const nextUndo = [...s.undoStack, snapshot];
    if (nextUndo.length > MAX_HISTORY) nextUndo.shift();
    return { undoStack: nextUndo, redoStack: [] };
  }),

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const snapshot = undoStack[undoStack.length - 1];
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, snapshot],
    }));
    return snapshot;
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const snapshot = redoStack[redoStack.length - 1];
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, snapshot],
    }));
    return snapshot;
  },

  clearHistory: () => set({ undoStack: [], redoStack: [] }),

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
});
