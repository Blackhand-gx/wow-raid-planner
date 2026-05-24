import { useAppStore } from '../store';

export function getCanvasCenter(): { x: number; y: number } {
  const { viewport, stageWidth, stageHeight } = useAppStore.getState();
  return {
    x: (stageWidth / 2 - viewport.x) / viewport.scale,
    y: (stageHeight / 2 - viewport.y) / viewport.scale,
  };
}
