export type AnnotationType = 'arrow' | 'line' | 'circle' | 'rect' | 'text' | 'marker';
export type AnnotationLayer = 'back' | 'front';

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  layer: AnnotationLayer;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface ArrowAnnotation extends AnnotationBase {
  type: 'arrow';
  points: [number, number, number, number];
  headSize: number;
}

export interface LineAnnotation extends AnnotationBase {
  type: 'line';
  points: [number, number, number, number];
  dash: number[];
}

export interface CircleAnnotation extends AnnotationBase {
  type: 'circle';
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  filled: boolean;
}

export interface RectAnnotation extends AnnotationBase {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  filled: boolean;
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export interface MarkerAnnotation extends AnnotationBase {
  type: 'marker';
  x: number;
  y: number;
  markerType: string;
}

export type Annotation =
  | ArrowAnnotation
  | LineAnnotation
  | CircleAnnotation
  | RectAnnotation
  | TextAnnotation
  | MarkerAnnotation;
