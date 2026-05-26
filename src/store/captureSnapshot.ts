interface Snapshotable {
  players: unknown;
  bosses: unknown;
  annotations: unknown;
  viewport: unknown;
  renderOrder: unknown;
  pushSnapshot(data: {
    players: string;
    bosses: string;
    annotations: string;
    viewport: string;
    renderOrder: string;
  }): void;
}

export function captureSnapshot(get: () => Snapshotable) {
  const state = get();
  state.pushSnapshot({
    players: JSON.stringify(state.players),
    bosses: JSON.stringify(state.bosses),
    annotations: JSON.stringify(state.annotations),
    viewport: JSON.stringify(state.viewport),
    renderOrder: JSON.stringify(state.renderOrder),
  });
}
