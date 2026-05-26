export interface HistorySnapshot {
  players: string;
  bosses: string;
  annotations: string;
  viewport: string;
  renderOrder: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  snapshot: HistorySnapshot;
}
