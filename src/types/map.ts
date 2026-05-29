export interface MapData {
  id: string;
  name: string;
  /** base64 数据 URL（序列化时会被剥离以减小文件体积） */
  imageDataUrl: string;
  /** 预设地图路径（如 /maps/voidspire-averzian.png），序列化时保留，恢复时用于重新加载 */
  mapPath?: string;
  originalWidth: number;
  originalHeight: number;
  opacity: number;
  mapScale: number;
  offsetX: number;
  offsetY: number;
  locked: boolean;
}
