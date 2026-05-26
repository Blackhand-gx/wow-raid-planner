import type { Word } from 'tesseract.js';
import type { WoWClass } from '../types';

export interface DetectedPlayer {
  className: WoWClass;
  confidence: number;
  name: string;
}

interface ClassColorDef {
  key: WoWClass;
  r: number; g: number; b: number;
}

const CLASS_COLORS: ClassColorDef[] = [
  { key: 'warrior',       r: 199, g: 156, b: 110 },
  { key: 'paladin',       r: 245, g: 140, b: 186 },
  { key: 'hunter',        r: 171, g: 212, b: 115 },
  { key: 'rogue',         r: 255, g: 245, b: 105 },
  { key: 'priest',        r: 255, g: 255, b: 255 },
  { key: 'death-knight',  r: 196, g:  31, b:  59 },
  { key: 'shaman',        r:   0, g: 112, b: 222 },
  { key: 'mage',          r:  63, g: 199, b: 235 },
  { key: 'warlock',       r: 135, g: 136, b: 238 },
  { key: 'monk',          r:   0, g: 255, b: 150 },
  { key: 'druid',         r: 255, g: 125, b:  10 },
  { key: 'demon-hunter',  r: 163, g:  48, b: 201 },
  { key: 'evoker',        r:  51, g: 147, b: 127 },
  { key: 'unknown',       r: 128, g: 128, b: 128 },
];

const CLASS_NAMES: Record<WoWClass, string> = {
  'warrior': '战士', 'paladin': '圣骑士', 'hunter': '猎人',
  'rogue': '潜行者', 'priest': '牧师', 'death-knight': '死亡骑士',
  'shaman': '萨满', 'mage': '法师', 'warlock': '术士',
  'monk': '武僧', 'druid': '德鲁伊', 'demon-hunter': '恶魔猎手',
  'evoker': '唤魔师',
  'unknown': '未知',
};

// 色度距离：将 RGB 归一化后比较，消除亮度影响，聚焦于色相+饱和度
function chromaDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const s1 = r1 + g1 + b1 || 1;
  const s2 = r2 + g2 + b2 || 1;
  const dr = r1 / s1 - r2 / s2;
  const dg = g1 / s1 - g2 / s2;
  const db = b1 / s1 - b2 / s2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function findClosestClass(r: number, g: number, b: number): { cls: ClassColorDef; dist: number } {
  let best: ClassColorDef | null = null;
  let bestDist = Infinity;
  for (const cls of CLASS_COLORS) {
    // 未知职业只在明确检测到灰色时才匹配，不参与正常颜色竞争
    if (cls.key === 'unknown') continue;
    const d = chromaDist(r, g, b, cls.r, cls.g, cls.b);
    if (d < bestDist) { bestDist = d; best = cls; }
  }
  return { cls: best!, dist: bestDist };
}

function loadImageData(dataUrl: string): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ data: imageData.data, width: canvas.width, height: canvas.height });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function detectTextBands(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { top: number; bottom: number; midY: number; height: number }[] {
  const signals: number[] = [];
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const bright = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const sat = Math.max(data[idx], data[idx + 1], data[idx + 2]) -
                 Math.min(data[idx], data[idx + 1], data[idx + 2]);
      if (bright > 30 && sat > 8) count++;
    }
    signals.push(count);
  }

  const threshold = width * 0.05;
  const active = new Set<number>();
  for (let y = 0; y < height; y++) {
    if (signals[y] > threshold) active.add(y);
  }

  const sorted = [...active].sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  const rawGroups: { top: number; bottom: number }[] = [];
  let start = sorted[0], prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - prev > 2) {
      rawGroups.push({ top: start, bottom: prev });
      start = sorted[i];
    }
    prev = sorted[i];
  }
  rawGroups.push({ top: start, bottom: prev });

  return rawGroups
    .filter((g) => g.bottom - g.top + 1 >= 7)
    .map((g) => ({
      top: g.top,
      bottom: g.bottom,
      midY: Math.floor((g.top + g.bottom) / 2),
      height: g.bottom - g.top + 1,
    }));
}

function sampleColumnColor(
  data: Uint8ClampedArray, width: number,
  top: number, bottom: number,
  xStart: number, xEnd: number,
): { r: number; g: number; b: number; count: number } | null {
  const xs = Math.floor(width * xStart);
  const xe = Math.floor(width * xEnd);
  const area = (bottom - top + 1) * (xe - xs);
  const pixels: { r: number; g: number; b: number; sat: number }[] = [];
  const whitePx: { r: number; g: number; b: number }[] = [];

  for (let y = top; y <= bottom; y++) {
    for (let x = xs; x < xe; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const bright = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (bright > 28 && sat > 12) {
        pixels.push({ r, g, b, sat });
      }
      // 牧师白色：高亮 + 低饱和
      if (bright > 180 && sat < 25) {
        whitePx.push({ r, g, b });
      }
    }
  }

  // 牧师优先：白色像素占比 > 3% 直接返回纯白
  if (whitePx.length >= Math.max(8, area * 0.03)) {
    return { r: 255, g: 255, b: 255, count: whitePx.length };
  }

  // 灰色检测：离线玩家（低饱和 + 中等亮度像素占主导）
  let greyCount = 0;
  for (let y = top; y <= bottom; y++) {
    for (let x = xs; x < xe; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const bright = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (bright > 40 && bright < 200 && sat < 18) greyCount++;
    }
  }
  if (greyCount >= area * 0.15) {
    return { r: 128, g: 128, b: 128, count: greyCount };
  }

  // 常规颜色采样
  if (pixels.length >= 2) {
    pixels.sort((a, b) => b.sat - a.sat);
    const topN = Math.max(2, Math.floor(pixels.length * 0.25));
    let sr = 0, sg = 0, sb = 0;
    for (let i = 0; i < topN; i++) { sr += pixels[i].r; sg += pixels[i].g; sb += pixels[i].b; }
    return { r: Math.round(sr / topN), g: Math.round(sg / topN), b: Math.round(sb / topN), count: topN };
  }

  return null;
}

function processName(raw: string): string {
  let name = raw.trim();
  // 移除 OCR 常见噪声：竖线及其全角/笔画变体
  name = name.replace(/[|｜丨]/g, '');
  // 去掉首尾非文字/字母/数字/分隔符（竖线已在上一步移除，不再列入保留集）
  name = name.replace(/^[^a-zA-Z一-鿿㐀-䶿0-9\-·•—–]+/, '');
  name = name.replace(/[^a-zA-Z一-鿿㐀-䶿0-9\-·•—–]+$/, '');
  // 按分隔符拆分，取第一段（Name-Server 格式）
  // 包含：- · • — – 及其 OCR 误识别变体（丨 l I 1 一 — / \）
  const sepIdx = name.search(/[-·•—–丨一—/\\lI1]/);
  if (sepIdx > 0) name = name.substring(0, sepIdx);
  // 纯中文且过长（>6字），大概率 OCR 把服务器名拼进去了，截断到合理长度
  if (/^[一-鿿]{7,}$/.test(name)) name = name.substring(0, 6);
  // 去括号内容
  name = name.replace(/[（(][^)）]*[)）]/g, '').trim();
  return name || raw.trim().replace(/[|｜丨]/g, '');
}

function cropAndEnhanceRow(
  img: HTMLImageElement,
  imgW: number,
  rowY: number,
  rowH: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = imgW;
  canvas.height = rowH;
  const ctx = canvas.getContext('2d')!;
  // 从放大图中裁剪该行
  ctx.drawImage(img, 0, rowY, imgW, rowH, 0, 0, imgW, rowH);

  // 对比度增强：直方图拉伸
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  let minVal = 255, maxVal = 0;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (gray < minVal) minVal = gray;
    if (gray > maxVal) maxVal = gray;
  }
  if (maxVal > minVal + 20) {
    const scale = 255 / (maxVal - minVal);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.max(0, (d[i] - minVal) * scale));
      d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - minVal) * scale));
      d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - minVal) * scale));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

function upscaleImage(
  sourceDataUrl: string,
): Promise<{ dataUrl: string; scale: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const minWidth = 900;
      let scale = 1;
      while (w * scale < minWidth && scale < 5) scale++;
      if (w * scale > 3000) scale = Math.floor(3000 / w);
      if (scale <= 1) {
        resolve({ dataUrl: sourceDataUrl, scale: 1 });
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ dataUrl: canvas.toDataURL('image/png'), scale });
    };
    img.onerror = reject;
    img.src = sourceDataUrl;
  });
}

export async function analyzeScreenshot(
  dataUrl: string,
  onProgress?: (msg: string, pct: number) => void,
): Promise<DetectedPlayer[]> {
  onProgress?.('预处理图片...', 0);
  const { dataUrl: ocrDataUrl, scale } = await upscaleImage(dataUrl);

  const { data, width, height } = await loadImageData(dataUrl);

  const bands = detectTextBands(data, width, height);
  if (bands.length === 0) return [];

  onProgress?.('加载 OCR 引擎...', 2);
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker('chi_sim', 1, {
    logger: (info) => {
      if (!onProgress) return;
      if (info.status === 'loading language traineddata') {
        onProgress('下载中文语言包...', Math.round(5 + info.progress * 15));
      }
    },
  });

  // 加载放大后的图片（只加载一次，后续裁剪用）
  const ocrImg = await loadImage(ocrDataUrl);
  const ocrImgW = Math.round(width * scale);

  const detected: DetectedPlayer[] = [];
  let fallbackIdx = 0;

  try {
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      const pct = Math.round(20 + (i / bands.length) * 75);
      onProgress?.(`识别第 ${i + 1}/${bands.length} 行...`, pct);

      // 裁剪该行并增强对比度
      const rowY = Math.round(band.top * scale);
      const rowH = Math.round(band.height * scale);
      const cropDataUrl = cropAndEnhanceRow(ocrImg, ocrImgW, rowY, rowH);

      let rowWords: Word[] = [];
      try {
        const result = await worker.recognize(cropDataUrl);
        rowWords = result.data.words || [];
      } catch {
        // 该行 OCR 失败，继续
      }

      // 坐标映射回原始图比例（裁剪图中 y 坐标需要加上 band.top）
      const remapped: Word[] = rowWords.map((w) => ({
        ...w,
        bbox: {
          x0: w.bbox.x0 / scale,
          y0: w.bbox.y0 / scale + band.top,
          x1: w.bbox.x1 / scale,
          y1: w.bbox.y1 / scale + band.top,
        },
      }));

      const midX = width / 2;
      const leftWords = remapped
        .filter((w) => (w.bbox.x0 + w.bbox.x1) / 2 < midX)
        .sort((a, b) => a.bbox.x0 - b.bbox.x0);
      const rightWords = remapped
        .filter((w) => (w.bbox.x0 + w.bbox.x1) / 2 >= midX)
        .sort((a, b) => a.bbox.x0 - b.bbox.x0);

      // 固定范围采样职业色标：左列左侧 0.5%-10%，右列左侧 49%-60%
      const leftColor = sampleColumnColor(data, width, band.top, band.bottom, 0.005, 0.10);
      const rightColor = sampleColumnColor(data, width, band.top, band.bottom, 0.49, 0.60);

      const extractPlayer = (
        color: { r: number; g: number; b: number; count: number } | null,
        words: Word[],
      ): DetectedPlayer | null => {
        if (!color) return null;

        // 灰色检测：低饱和 + 中等亮度 → 离线玩家，标记为未知
        const greySat = Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b);
        const greyBright = (color.r + color.g + color.b) / 3;
        const isGrey = greySat < 22 && greyBright > 80 && greyBright < 180;

        const { cls, dist } = findClosestClass(color.r, color.g, color.b);
        // 色度距离：<0.05 优秀，<0.10 良好，>0.15 差
        const colorConf = isGrey ? 0.5 : Math.max(0, Math.min(1, 1 - dist / 0.12));

        const resolvedClass: WoWClass = isGrey ? 'unknown' : cls.key;

        const validWords = words.filter((w) => {
          const t = w.text.trim();
          return t.length <= 30 && (t.length >= 2 || /[一-鿿\-·•]/.test(t));
        });
        const rawName = validWords.map((w) => w.text).join('');
        const name = processName(rawName);

        const ocrConf = validWords.length > 0
          ? validWords.reduce((s, w) => s + w.confidence, 0) / validWords.length / 100
          : 0.5;
        const conf = Math.round((colorConf * 0.6 + ocrConf * 0.4) * 100) / 100;

        if (name.length >= 2) {
          return { className: resolvedClass, confidence: conf, name };
        }
        // 回退名加序号避免去重时合并
        fallbackIdx++;
        return { className: resolvedClass, confidence: Math.round(colorConf * 100) / 100, name: `${CLASS_NAMES[resolvedClass]}${fallbackIdx}` };
      };

      const leftPlayer = extractPlayer(leftColor, leftWords);
      if (leftPlayer) detected.push(leftPlayer);

      const rightPlayer = extractPlayer(rightColor, rightWords);
      if (rightPlayer) detected.push(rightPlayer);
    }
  } finally {
    await worker.terminate();
  }

  // 只对非回退名去重
  const seen = new Map<string, DetectedPlayer>();
  for (const d of detected) {
    const lower = d.name.toLowerCase();
    // 回退名带序号，不会冲突；正常 OCR 名才去重
    const existing = seen.get(lower);
    if (!existing || d.confidence > existing.confidence) {
      seen.set(lower, d);
    }
  }

  onProgress?.('识别完成', 100);
  return [...seen.values()];
}
