import { useCallback } from 'react';
import { resizeImage, loadImageFromDataUrl } from '../utils/imageResize';

export function useImageUpload() {
  const uploadFile = useCallback(async (file: File): Promise<{ dataUrl: string; width: number; height: number }> => {
    const dataUrl = await resizeImage(file);
    const img = await loadImageFromDataUrl(dataUrl);
    return { dataUrl, width: img.naturalWidth, height: img.naturalHeight };
  }, []);

  const openFileDialog = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0] ?? null;
        resolve(file);
      };
      input.click();
    });
  }, []);

  return { uploadFile, openFileDialog };
}
