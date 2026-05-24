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
  clearPlayers: () => void;
}

export const createPlayerSlice: StateCreator<import('../index').AppStore, [], [], PlayerSlice> = (set, get) => ({
  players: [],

  addPlayer: (name, className, x = 100, y = 100) => {
    captureSnapshot(get);
    const id = nanoid();
    set((s) => ({ players: [...s.players, { id, name, className, x, y }] }));
    return id;
  },

  removePlayer: (id) => {
    captureSnapshot(get);
    set((s) => ({ players: s.players.filter((p) => p.id !== id) }));
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

  clearPlayers: () => {
    captureSnapshot(get);
    set({ players: [] });
  },

  updatePlayerMarker: (id, marker) => set((s) => ({
    players: s.players.map((p) => (p.id === id ? { ...p, marker } : p)),
  })),

  updatePlayerRole: (id, role) => set((s) => ({
    players: s.players.map((p) => (p.id === id ? { ...p, role } : p)),
  })),
});
