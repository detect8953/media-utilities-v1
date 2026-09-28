/**
 * In-browser Image Manipulation and Processing Engine for PyToolkit Studio
 */

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
  quality?: number; // 0.1 to 1.0
  filter?: 'none' | 'grayscale' | 'sepia' | 'blur' | 'sharpen' | 'invert' | 'vintage' | 'high_contrast';
  watermark?: {
    text: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tile';
    opacity: number;
    fontSize: number;
    color: string;
  };
}

export interface ProcessedImageResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  originalSizeBytes: number;
  compressionRatio: number; // percentage saved
}

export async function processImageOnCanvas(
  imageSource: HTMLImageElement | string,
  options: ImageProcessingOptions
): Promise<ProcessedImageResult> {
  const img = typeof imageSource === 'string' ? await loadImage(imageSource) : imageSource;

  let targetW = options.width || img.naturalWidth || img.width;
  let targetH = options.height || img.naturalHeight || img.height;

  if (options.maintainAspectRatio && (options.width || options.height)) {
    const ratio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
    if (options.width && !options.height) {
      targetH = Math.round(options.width / ratio);
    } else if (options.height && !options.width) {
      targetW = Math.round(options.height * ratio);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to obtain 2D canvas context');

  // Draw scaled image
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Apply visual filters if selected
  if (options.filter && options.filter !== 'none') {
    applyFilterToCanvas(ctx, targetW, targetH, options.filter);
  }

  // Apply Watermark if specified
  if (options.watermark && options.watermark.text.trim()) {
    applyWatermarkToCanvas(ctx, targetW, targetH, options.watermark);
  }

  const format = options.format || 'image/webp';
  const quality = options.quality !== undefined ? options.quality : 0.85;

  const dataUrl = canvas.toDataURL(format, quality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), format, quality);
  });

  const originalSizeBytes = typeof imageSource === 'string' && imageSource.startsWith('data:')
    ? Math.round((imageSource.length * 3) / 4)
    : blob.size * 1.4; // estimated if raw element

  const savings = originalSizeBytes > 0 ? ((originalSizeBytes - blob.size) / originalSizeBytes) * 100 : 0;

  return {
    dataUrl,
    blob,
    width: targetW,
    height: targetH,
    sizeBytes: blob.size,
    originalSizeBytes,
    compressionRatio: Math.max(0, Math.round(savings)),
  };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

function applyFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: string
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (filter === 'grayscale') {
    for (let i = 0; i < data.length; i += 4) {
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
  } else if (filter === 'sepia') {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
      data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
      data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
    }
  } else if (filter === 'invert') {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  } else if (filter === 'high_contrast') {
    const factor = 1.6;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
  } else if (filter === 'vintage') {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * 1.1 + 10);
      data[i + 1] = Math.min(255, data[i + 1] * 0.95);
      data[i + 2] = Math.min(255, data[i + 2] * 0.8 - 10);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyWatermarkToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  wm: {
    text: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tile';
    opacity: number;
    fontSize: number;
    color: string;
  }
) {
  ctx.save();
  ctx.font = `600 ${wm.fontSize}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillStyle = wm.color || '#ffffff';
  ctx.globalAlpha = wm.opacity;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const metrics = ctx.measureText(wm.text);
  const textW = metrics.width;
  const textH = wm.fontSize;
  const padding = 20;

  if (wm.position === 'bottom-right') {
    ctx.fillText(wm.text, width - textW - padding, height - padding);
  } else if (wm.position === 'bottom-left') {
    ctx.fillText(wm.text, padding, height - padding);
  } else if (wm.position === 'top-right') {
    ctx.fillText(wm.text, width - textW - padding, textH + padding);
  } else if (wm.position === 'center') {
    ctx.fillText(wm.text, (width - textW) / 2, (height + textH) / 2);
  } else if (wm.position === 'tile') {
    ctx.rotate((-25 * Math.PI) / 180);
    for (let x = -width; x < width * 2; x += textW + 80) {
      for (let y = -height; y < height * 2; y += textH + 70) {
        ctx.fillText(wm.text, x, y);
      }
    }
  }

  ctx.restore();
}

export function generateAsciiArtFromCanvas(
  img: HTMLImageElement,
  cols: number = 70,
  charset: string = '@%#*+=-:. '
): string {
  const canvas = document.createElement('canvas');
  const aspect = (img.naturalHeight || img.height) / (img.naturalWidth || img.width);
  const rows = Math.max(1, Math.round(cols * aspect * 0.52)); // font height correction

  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(img, 0, 0, cols, rows);
  const imgData = ctx.getImageData(0, 0, cols, rows);
  const data = imgData.data;

  let ascii = '';
  const numChars = charset.length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = (y * cols + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const charIndex = Math.min(numChars - 1, Math.floor(brightness * numChars));
      ascii += charset[charIndex];
    }
    ascii += '\n';
  }

  return ascii;
}

export function detectBlackBordersCanvas(
  img: HTMLImageElement,
  threshold: number = 8
): {
  cropVals: string;
  isCropped: boolean;
  box: { left: number; top: number; right: number; bottom: number };
  canvas: HTMLCanvasElement;
} {
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let foundNonBlack = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      if (luminance > threshold) {
        foundNonBlack = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!foundNonBlack || (minX === 0 && minY === 0 && maxX === w - 1 && maxY === h - 1)) {
    return {
      cropVals: 'Not Needed',
      isCropped: false,
      box: { left: 0, top: 0, right: w, bottom: h },
      canvas,
    };
  }

  const right = maxX + 1;
  const bottom = maxY + 1;
  const cropW = right - minX;
  const cropH = bottom - minY;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const cropCtx = croppedCanvas.getContext('2d');
  if (cropCtx) {
    cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  }

  return {
    cropVals: `${minX}:${minY}:${right}:${bottom}`,
    isCropped: true,
    box: { left: minX, top: minY, right, bottom },
    canvas: croppedCanvas,
  };
}

export function enforce16x9RatioCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetRatio: number = 16 / 9
): {
  fixVals: string;
  isFixed: boolean;
  canvas: HTMLCanvasElement;
} {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const currentRatio = w / h;

  if (Math.abs(currentRatio - targetRatio) < 0.01) {
    return { fixVals: 'Not Needed', isFixed: false, canvas: sourceCanvas };
  }

  const outCanvas = document.createElement('canvas');
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return { fixVals: 'Not Needed', isFixed: false, canvas: sourceCanvas };

  if (currentRatio > targetRatio) {
    const newW = Math.round(h * targetRatio);
    const excess = w - newW;
    const leftCrop = Math.floor(excess / 2);
    outCanvas.width = newW;
    outCanvas.height = h;
    outCtx.drawImage(sourceCanvas, leftCrop, 0, newW, h, 0, 0, newW, h);
    return {
      fixVals: `L: ${leftCrop}px | R: ${excess - leftCrop}px`,
      isFixed: true,
      canvas: outCanvas,
    };
  } else {
    const newH = Math.round(w / targetRatio);
    const excess = h - newH;
    const topCrop = Math.floor(excess / 2);
    outCanvas.width = w;
    outCanvas.height = newH;
    outCtx.drawImage(sourceCanvas, 0, topCrop, w, newH, 0, 0, w, newH);
    return {
      fixVals: `T: ${topCrop}px | B: ${excess - topCrop}px`,
      isFixed: true,
      canvas: outCanvas,
    };
  }
}

export interface SeasonArtworkBatchItem {
  filename: string;
  season: string;
  originalSize: [number, number];
  cropValues: string;
  aspectFixValues: string;
  finalSize: [number, number];
  status: 'Processed' | 'Skipped' | 'Error';
}

export const SAMPLE_SEASON_FILES: SeasonArtworkBatchItem[] = [
  {
    filename: 'Slow.Horses.S01E01.Failure.Contagious.jpg',
    season: 'Season 01',
    originalSize: [1920, 1200], // 16:10 with black letterbox top/bottom
    cropValues: '0:60:1920:1140',
    aspectFixValues: 'Not Needed',
    finalSize: [1920, 1080],
    status: 'Processed',
  },
  {
    filename: 'Slow.Horses.S01E02.Work.Drinks.jpg',
    season: 'Season 01',
    originalSize: [2048, 1152], // 16:9 2K
    cropValues: 'Not Needed',
    aspectFixValues: 'Not Needed',
    finalSize: [1920, 1080],
    status: 'Processed',
  },
  {
    filename: 'Slow.Horses.S01E03.Bad.Tradecraft.jpg',
    season: 'Season 01',
    originalSize: [1600, 1200], // 4:3 with heavy pillarbox sides
    cropValues: '100:0:1500:1200',
    aspectFixValues: 'T: 20px | B: 20px',
    finalSize: [1920, 1080],
    status: 'Processed',
  },
  {
    filename: 'Slow.Horses.S02E01.Last.Stop.jpg',
    season: 'Season 02',
    originalSize: [1920, 1080], // Already pristine 1080p 16:9
    cropValues: 'Not Needed',
    aspectFixValues: 'Not Needed',
    finalSize: [1920, 1080],
    status: 'Processed',
  },
  {
    filename: 'Slow.Horses.S02E02.From.Uppsala.With.Love.jpg',
    season: 'Season 02',
    originalSize: [1920, 1080],
    cropValues: '0:20:1920:1060',
    aspectFixValues: 'L: 18px | R: 18px',
    finalSize: [1920, 1080],
    status: 'Processed',
  },
];

export const SAMPLE_IMAGES = [
  {
    id: 'landscape',
    name: 'Alpine Mountain Peak',
    category: 'Landscape',
    url: '/src/assets/images/sample_alpine_mountain_1790583577549.jpg',
    dimensions: '1920 × 1080',
  },
  {
    id: 'architecture',
    name: 'Brutalist Glass & Concrete',
    category: 'Architecture',
    url: '/src/assets/images/sample_tech_architecture_1790583590607.jpg',
    dimensions: '1440 × 1080',
  },
  {
    id: 'product',
    name: 'Studio Workstation Desk',
    category: 'Product',
    url: '/src/assets/images/sample_product_desk_1790583604000.jpg',
    dimensions: '1440 × 1080',
  }
];
