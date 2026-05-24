import type { StateCreator } from 'zustand';
import type { Annotation } from '../../types';
import { nanoid } from 'nanoid';
import { captureSnapshot } from '../captureSnapshot';

export interface AnnotationSlice {
  annotations: Annotation[];
  addAnnotation: (a: Omit<Annotation, 'id'>) => string;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  removeAnnotations: (ids: string[]) => void;
  clearAnnotations: () => void;
}

export const createAnnotationSlice: StateCreator<import('../index').AppStore, [], [], AnnotationSlice> = (set, get) => ({
  annotations: [],

  addAnnotation: (a) => {
    captureSnapshot(get);
    const id = nanoid();
    set((s) => ({ annotations: [...s.annotations, { ...a, id } as Annotation] }));
    return id;
  },

  updateAnnotation: (id, patch) => set((s) => ({
    annotations: s.annotations.map((a) =>
      a.id === id ? { ...a, ...patch } as Annotation : a
    ),
  })),

  removeAnnotation: (id) => {
    captureSnapshot(get);
    set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) }));
  },

  removeAnnotations: (ids) => {
    captureSnapshot(get);
    const idSet = new Set(ids);
    set((s) => ({
      annotations: s.annotations.filter((a) => !idSet.has(a.id)),
    }));
  },

  clearAnnotations: () => {
    captureSnapshot(get);
    set({ annotations: [] });
  },
});
