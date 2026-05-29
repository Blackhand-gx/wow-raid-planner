export interface Boss {
  id: string;
  name: string;
  /** base64 数据 URL（序列化时会被剥离以减小文件体积） */
  imageDataUrl: string | null;
  /** 预设图标路径（如 /boss-icons/khadgar.png），序列化时保留，恢复时用于重新加载 */
  iconPath?: string;
  x: number;
  y: number;
  radius: number;
  fixed: boolean;
}
