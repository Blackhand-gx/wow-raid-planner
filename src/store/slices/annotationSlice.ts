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
  bringAnnotationToFront: (id: string) => void;
  sendAnnotationToBack: (id: string) => void;
  moveAnnotationUp: (id: string) => void;
  moveAnnotationDown: (id: string) => void;
  clearAnnotations: () => void;
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

export const createAnnotationSlice: StateCreator<import('../index').AppStore, [], [], AnnotationSlice> = (set, get) => ({
  annotations: [],

  addAnnotation: (a) => {
    captureSnapshot(get);
    const id = nanoid();
    set((s) => ({
      annotations: [...s.annotations, { ...a, id } as Annotation],
      renderOrder: [...s.renderOrder, id],
    }));
    return id;
  },

  updateAnnotation: (id, patch) => set((s) => ({
    annotations: s.annotations.map((a) =>
      a.id === id ? { ...a, ...patch } as Annotation : a
    ),
  })),

  removeAnnotation: (id) => {
    captureSnapshot(get);
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      renderOrder: s.renderOrder.filter((rid) => rid !== id),
    }));
  },

  removeAnnotations: (ids) => {
    captureSnapshot(get);
    const idSet = new Set(ids);
    set((s) => ({
      annotations: s.annotations.filter((a) => !idSet.has(a.id)),
      renderOrder: s.renderOrder.filter((rid) => !idSet.has(rid)),
    }));
  },

  bringAnnotationToFront: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.annotations.findIndex((a) => a.id === id);
      if (idx === -1 || idx === s.annotations.length - 1) return s;
      const annotations = [...s.annotations];
      const [item] = annotations.splice(idx, 1);
      annotations.push(item);
      return { annotations, renderOrder: roToEnd(id, s.renderOrder) };
    });
  },

  sendAnnotationToBack: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.annotations.findIndex((a) => a.id === id);
      if (idx <= 0) return s;
      const annotations = [...s.annotations];
      const [item] = annotations.splice(idx, 1);
      annotations.unshift(item);
      return { annotations, renderOrder: roToStart(id, s.renderOrder) };
    });
  },

  moveAnnotationUp: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.annotations.findIndex((a) => a.id === id);
      if (idx === -1 || idx >= s.annotations.length - 1) return s;
      const annotations = [...s.annotations];
      [annotations[idx], annotations[idx + 1]] = [annotations[idx + 1], annotations[idx]];
      return { annotations, renderOrder: roMoveToFront(id, s.renderOrder) };
    });
  },

  moveAnnotationDown: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.annotations.findIndex((a) => a.id === id);
      if (idx <= 0) return s;
      const annotations = [...s.annotations];
      [annotations[idx], annotations[idx - 1]] = [annotations[idx - 1], annotations[idx]];
      return { annotations, renderOrder: roMoveToBack(id, s.renderOrder) };
    });
  },

  clearAnnotations: () => {
    captureSnapshot(get);
    set((s) => ({
      annotations: [],
      renderOrder: s.renderOrder.filter((rid) => !s.annotations.some((a) => a.id === rid)),
    }));
  },
});
