import type { StateCreator } from 'zustand';
import type { Player, WoWClass, PlayerRole } from '../../types';
import { nanoid } from 'nanoid';
import { captureSnapshot } from '../captureSnapshot';

export interface PlayerSlice {
  players: Player[];
  addPlayer: (name: string, className: WoWClass, x?: number, y?: number) => string;
  removePlayer: (id: string) => void;
  updatePlayerPosition: (id: string, x: number, y: number) => void;
  bulkUpdatePositions: (updates: Array<{ id: string; dx: number; dy: number }>) => void;
  updatePlayerName: (id: string, name: string) => void;
  updatePlayerClass: (id: string, className: WoWClass) => void;
  updatePlayerMarker: (id: string, marker: string | undefined) => void;
  updatePlayerRole: (id: string, role: PlayerRole | undefined) => void;
  bringPlayerToFront: (id: string) => void;
  sendPlayerToBack: (id: string) => void;
  movePlayerUp: (id: string) => void;
  movePlayerDown: (id: string) => void;
  clearPlayers: () => void;
}

function syncRO_movetoFront(id: string, renderOrder: string[]): string[] {
  const idx = renderOrder.indexOf(id);
  if (idx === -1 || idx === renderOrder.length - 1) return renderOrder;
  const next = [...renderOrder];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  return next;
}

function syncRO_movetoBack(id: string, renderOrder: string[]): string[] {
  const idx = renderOrder.indexOf(id);
  if (idx <= 0) return renderOrder;
  const next = [...renderOrder];
  [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
  return next;
}

function syncRO_toEnd(id: string, renderOrder: string[]): string[] {
  const idx = renderOrder.indexOf(id);
  if (idx === -1 || idx === renderOrder.length - 1) return renderOrder;
  const next = renderOrder.filter((rid) => rid !== id);
  next.push(id);
  return next;
}

function syncRO_toStart(id: string, renderOrder: string[]): string[] {
  const idx = renderOrder.indexOf(id);
  if (idx <= 0) return renderOrder;
  const next = renderOrder.filter((rid) => rid !== id);
  next.unshift(id);
  return next;
}

export const createPlayerSlice: StateCreator<import('../index').AppStore, [], [], PlayerSlice> = (set, get) => ({
  players: [],

  addPlayer: (name, className, x = 100, y = 100) => {
    captureSnapshot(get);
    const id = nanoid();
    set((s) => ({
      players: [...s.players, { id, name, className, x, y }],
      renderOrder: [...s.renderOrder, id],
    }));
    return id;
  },

  removePlayer: (id) => {
    captureSnapshot(get);
    set((s) => ({
      players: s.players.filter((p) => p.id !== id),
      renderOrder: s.renderOrder.filter((rid) => rid !== id),
    }));
  },

  updatePlayerPosition: (id, x, y) => set((s) => ({
    players: s.players.map((p) => (p.id === id ? { ...p, x, y } : p)),
  })),

  bulkUpdatePositions: (updates) => set((s) => {
    const lookup = new Map(updates.map((u) => [u.id, u]));
    const next = s.players.map((p) => {
      const u = lookup.get(p.id);
      return u ? { ...p, x: p.x + u.dx, y: p.y + u.dy } : p;
    });
    return { players: next };
  }),

  updatePlayerName: (id, name) => set((s) => ({
    players: s.players.map((p) => (p.id === id ? { ...p, name } : p)),
  })),

  updatePlayerClass: (id, className) => set((s) => ({
    players: s.players.map((p) => (p.id === id ? { ...p, className } : p)),
  })),

  bringPlayerToFront: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.players.findIndex((p) => p.id === id);
      if (idx === -1 || idx === s.players.length - 1) return s;
      const players = [...s.players];
      const [item] = players.splice(idx, 1);
      players.push(item);
      return { players, renderOrder: syncRO_toEnd(id, s.renderOrder) };
    });
  },

  sendPlayerToBack: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.players.findIndex((p) => p.id === id);
      if (idx <= 0) return s;
      const players = [...s.players];
      const [item] = players.splice(idx, 1);
      players.unshift(item);
      return { players, renderOrder: syncRO_toStart(id, s.renderOrder) };
    });
  },

  movePlayerUp: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.players.findIndex((p) => p.id === id);
      if (idx === -1 || idx >= s.players.length - 1) return s;
      const players = [...s.players];
      [players[idx], players[idx + 1]] = [players[idx + 1], players[idx]];
      return { players, renderOrder: syncRO_movetoFront(id, s.renderOrder) };
    });
  },

  movePlayerDown: (id) => {
    captureSnapshot(get);
    set((s) => {
      const idx = s.players.findIndex((p) => p.id === id);
      if (idx <= 0) return s;
      const players = [...s.players];
      [players[idx], players[idx - 1]] = [players[idx - 1], players[idx]];
      return { players, renderOrder: syncRO_movetoBack(id, s.renderOrder) };
    });
  },

  clearPlayers: () => {
    captureSnapshot(get);
    set((s) => ({
      players: [],
      renderOrder: s.renderOrder.filter((rid) => !s.players.some((p) => p.id === rid)),
    }));
  },

  updatePlayerMarker: (id, marker) => set((s) => ({
    players: s.players.map((p) => (p.id === id ? { ...p, marker } : p)),
  })),

  updatePlayerRole: (id, role) => set((s) => ({
    players: s.players.map((p) => (p.id === id ? { ...p, role } : p)),
  })),
});
