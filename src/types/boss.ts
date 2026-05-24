export interface Boss {
  id: string;
  name: string;
  imageDataUrl: string | null;
  x: number;
  y: number;
  radius: number;
  fixed: boolean;
}
