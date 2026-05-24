import type { AppStore } from './index';

export function captureSnapshot(get: () => AppStore) {
  const state = get();
  state.pushSnapshot({
    players: JSON.stringify(state.players),
    bosses: JSON.stringify(state.bosses),
    annotations: JSON.stringify(state.annotations),
    viewport: JSON.stringify(state.viewport),
  });
}
