import type { Boss, MapData } from '../types';
import { loadDefaultMap } from './defaultMap';
import { cropToCircle } from './imageResize';

/**
 * 根据 iconPath 重新加载首领图片。
 * 用于从文件/自动保存恢复数据后重建 base64 imageDataUrl。
 */
export async function restoreBossImages(bosses: Boss[]): Promise<Boss[]> {
  return Promise.all(
    bosses.map(async (boss) => {
      // 已有图片数据或没有预设路径，无需恢复
      if (boss.imageDataUrl || !boss.iconPath) return boss;
      try {
        const { dataUrl } = await loadDefaultMap(boss.iconPath);
        const cropped = await cropToCircle(dataUrl);
        return { ...boss, imageDataUrl: cropped };
      } catch {
        return boss;
      }
    }),
  );
}

/**
 * 根据 mapPath 重新加载地图图片。
 * 用于从文件/自动保存恢复数据后重建 base64 imageDataUrl。
 */
export async function restoreMapImages(maps: MapData[]): Promise<MapData[]> {
  return Promise.all(
    maps.map(async (map) => {
      // 已有图片数据或没有预设路径，无需恢复
      if (map.imageDataUrl || !map.mapPath) return map;
      try {
        const { dataUrl } = await loadDefaultMap(map.mapPath);
        return { ...map, imageDataUrl: dataUrl };
      } catch {
        return map;
      }
    }),
  );
}
