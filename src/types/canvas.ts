export type ToolType =
  | 'select'
  | 'pan'
  | 'arrow'
  | 'line'
  | 'circle'
  | 'rect'
  | 'text'
  | 'eraser'
  | 'marker';

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}
