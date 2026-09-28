import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Download,
  Image as ImageIcon,
  Copy,
  Check,
  Type,
  Sparkles,
  Shield,
  Layers,
  Terminal,
  Upload,
  RefreshCw,
  Crop,
  Tv,
  Play,
  Folder,
  FolderOpen,
  HelpCircle,
} from 'lucide-react';
import {
  processImageOnCanvas,
  generateAsciiArtFromCanvas,
  detectBlackBordersCanvas,
  enforce16x9RatioCanvas,
  ProcessedImageResult,
  SAMPLE_IMAGES,
  SAMPLE_SEASON_FILES,
  loadImage,
} from '../utils/imageOperations';
import { formatBytes } from '../utils/fileOperations';

export const ImageLab: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_IMAGES[0].url);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transform' | 'border_crop' | 'watermark' | 'filters' | 'ascii' | 'exif'>('transform');

  // Resize & Format Controls
  const [targetWidth, setTargetWidth] = useState<number>(1080);
  const [maintainRatio, setMaintainRatio] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [quality, setQuality] = useState<number>(85);

  // Border & 16:9 Autocrop Controls
  const [borderThreshold, setBorderThreshold] = useState<number>(10);
  const [detectedCropValues, setDetectedCropValues] = useState<string>('Not Needed');
  const [detectedFixValues, setDetectedFixValues] = useState<string>('Not Needed');
  const [borderPreviewUrl, setBorderPreviewUrl] = useState<string>('');
  const [isSeasonRunning, setIsSeasonRunning] = useState<boolean>(false);
  const [seasonBatchProgress, setSeasonBatchProgress] = useState<number>(100);

  // Interactive Target Directory Prompt State
  const [targetDir, setTargetDir] = useState<string>('F:\\MediaStore\\TV\\Series\\Slow Horses (2022)');
  const [isDryRun, setIsDryRun] = useState<boolean>(false);
  const [seasonPattern, setSeasonPattern] = useState<string>('Season \\d{2}$');
  const [copiedPythonPrompt, setCopiedPythonPrompt] = useState<boolean>(false);
  const [showPromptHelp, setShowPromptHelp] = useState<boolean>(false);

  // Watermark Controls
  const [watermarkText, setWatermarkText] = useState<string>('© 2026 PyToolkit');
  const [wmPosition, setWmPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'center' | 'tile'>('bottom-right');
  const [wmOpacity, setWmOpacity] = useState<number>(0.4);
  const [wmFontSize, setWmFontSize] = useState<number>(24);

  // Filter Controls
  const [activeFilter, setActiveFilter] = useState<'none' | 'grayscale' | 'sepia' | 'blur' | 'sharpen' | 'invert' | 'vintage' | 'high_contrast'>('none');

  // Processing state & Results
  const [processedResult, setProcessedResult] = useState<ProcessedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [asciiCols, setAsciiCols] = useState<number>(64);
  const [copiedAscii, setCopiedAscii] = useState<boolean>(false);

  const activeImageUrl = customImage || selectedImage;

  // Process live preview
  useEffect(() => {
    let isCancelled = false;
    async function runPipeline() {
      setIsProcessing(true);
      try {
        if (activeTab === 'border_crop') {
          const imgEl = await loadImage(activeImageUrl);
          const borderResult = detectBlackBordersCanvas(imgEl, borderThreshold);
          const aspectResult = enforce16x9RatioCanvas(borderResult.canvas, 16 / 9);

          // Resize final to 1920x1080
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = 1920;
          finalCanvas.height = 1080;
          const finalCtx = finalCanvas.getContext('2d');
          if (finalCtx) {
            finalCtx.drawImage(aspectResult.canvas, 0, 0, 1920, 1080);
          }

          if (!isCancelled) {
            setDetectedCropValues(borderResult.cropVals);
            setDetectedFixValues(aspectResult.fixVals);
            setBorderPreviewUrl(finalCanvas.toDataURL('image/jpeg', 0.9));
          }
        } else {
          const result = await processImageOnCanvas(activeImageUrl, {
            width: targetWidth,
            maintainAspectRatio: maintainRatio,
            format: outputFormat,
            quality: quality / 100,
            filter: activeFilter,
            watermark: activeTab === 'watermark' ? {
              text: watermarkText,
              position: wmPosition,
              opacity: wmOpacity,
              fontSize: wmFontSize,
              color: '#ffffff',
            } : undefined,
          });

          if (!isCancelled) {
            setProcessedResult(result);
          }
        }

        if (activeTab === 'ascii') {
          const imgEl = await loadImage(activeImageUrl);
          const ascii = generateAsciiArtFromCanvas(imgEl, asciiCols);
          if (!isCancelled) {
            setAsciiArt(ascii);
          }
        }
      } catch (err) {
        console.error('Processing error:', err);
      } finally {
        if (!isCancelled) setIsProcessing(false);
      }
    }

    runPipeline();
    return () => {
      isCancelled = true;
    };
  }, [
    activeImageUrl,
    targetWidth,
    maintainRatio,
    outputFormat,
    quality,
    activeFilter,
    activeTab,
    borderThreshold,
    watermarkText,
    wmPosition,
    wmOpacity,
    wmFontSize,
    asciiCols,
  ]);

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDownloadProcessed = () => {
    const url = activeTab === 'border_crop' ? borderPreviewUrl : processedResult?.dataUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `pytoolkit_processed.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyAscii = () => {
    navigator.clipboard.writeText(asciiArt);
    setCopiedAscii(true);
    setTimeout(() => setCopiedAscii(false), 2000);
  };

  const handleRunSeasonBatch = async () => {
    setIsSeasonRunning(true);
    setSeasonBatchProgress(0);
    for (let p = 10; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 120));
      setSeasonBatchProgress(p);
    }
    setIsSeasonRunning(false);
  };

  const interactivePythonPromptCode = `# Interactive Target Directory Prompt Script
import os
import sys
from pytoolkit.images import process_images, print_processing_results

def prompt_and_process():
    # 1. Interactive terminal prompt with default fallback
    default_path = r"${targetDir || 'F:\\MediaStore\\TV\\Series\\Slow Horses (2022)'}"
    prompt_msg = f"Enter target series directory [Default: {default_path}]: "
    
    user_input = input(prompt_msg).strip()
    target_dir = user_input if user_input else default_path
    
    # Strip wrapping quotes if dragged-and-dropped into terminal
    target_dir = target_dir.strip('"').strip("'")
    
    if not os.path.isdir(target_dir):
        print(f"\\n❌ Error: Directory '{target_dir}' does not exist!")
        sys.exit(1)
        
    print(f"\\n📂 Scanning directory: {target_dir}")
    print(f"⚙️ Mode: {'DRY RUN (Preview only)' if ${isDryRun ? 'True' : 'False'} else 'LIVE EXECUTION (Modifying files)'}")
    
    results = process_images(
        target_dir=target_dir,
        dry_run=${isDryRun ? 'True' : 'False'},
        season_pattern=r"${seasonPattern}",
        target_resolution=(1920, 1080),
        threshold=${borderThreshold}
    )
    
    print_processing_results(results)

if __name__ == "__main__":
    prompt_and_process()
`;

  const handleCopyPromptCode = () => {
    navigator.clipboard.writeText(interactivePythonPromptCode);
    setCopiedPythonPrompt(true);
    setTimeout(() => setCopiedPythonPrompt(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>pytoolkit.images</span>
            <span aria-hidden="true">·</span>
            <span>Live Canvas Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5">
            Image & Artwork Manipulation Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Auto-detect & crop black letterbox borders, enforce 16:9 ratio, scale to 1080p, apply watermark overlays, and render terminal ASCII art.
          </p>
        </div>

        {/* Image Picker / Upload */}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 rounded-xl transition-colors">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Upload Custom Image
            <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Preset Image Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {SAMPLE_IMAGES.map((img) => (
          <button
            key={img.id}
            onClick={() => {
              setCustomImage(null);
              setSelectedImage(img.url);
            }}
            className={`flex items-center gap-3 p-2 rounded-xl border text-left transition-all shrink-0 ${
              !customImage && selectedImage === img.url
                ? 'bg-slate-900 border-cyan-500/60 ring-1 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <img
              src={img.url}
              alt={img.name}
              referrerPolicy="no-referrer"
              className="w-12 h-10 object-cover rounded-lg"
            />
            <div className="pr-2">
              <div className="text-xs font-bold text-slate-200">{img.name}</div>
              <div className="text-[11px] text-slate-500">{img.dimensions}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Mode Subtabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit overflow-x-auto">
        <button
          onClick={() => { setActiveTab('transform'); setActiveFilter('none'); }}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'transform' ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Resize & Modern Formats
        </button>
        <button
          onClick={() => { setActiveTab('border_crop'); setActiveFilter('none'); }}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'border_crop' ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5 text-cyan-400" />
          TV Artwork 16:9 Auto-Crop
        </button>
        <button
          onClick={() => { setActiveTab('watermark'); setActiveFilter('none'); }}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'watermark' ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          Watermarking
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'filters' ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Photo Filters
        </button>
        <button
          onClick={() => setActiveTab('ascii')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'ascii' ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          ASCII Art Generator
        </button>
        <button
          onClick={() => setActiveTab('exif')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'exif' ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          EXIF Privacy Scrub
        </button>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls Column */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
          {/* TAB: BORDER & 16:9 AUTOCROP */}
          {activeTab === 'border_crop' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                16:9 Border Auto-Crop Engine
              </div>

              <p className="text-xs text-slate-400">
                Executes your <code className="text-cyan-400">detect_black_borders</code> mask search and <code className="text-cyan-400">enforce_16_9_ratio</code> symmetrical crop algorithm.
              </p>

              {/* Threshold Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Black Threshold (threshold)</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{borderThreshold} / 255</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={borderThreshold}
                  onChange={(e) => setBorderThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Calculated Values */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Crop Values:</span>
                  <span className="text-cyan-400 font-bold">{detectedCropValues}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Aspect Fix:</span>
                  <span className="text-amber-400 font-bold">{detectedFixValues}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Target Res:</span>
                  <span className="text-emerald-400 font-bold">1920 × 1080 (16:9)</span>
                </div>
              </div>

              {/* Python Calling Example */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400">
                <div className="text-[10px] uppercase text-slate-500 mb-1 font-sans">Python Invocation:</div>
                <span className="text-indigo-400">from</span> pytoolkit.images <span className="text-indigo-400">import</span> process_images
                <br />
                results = <span className="text-cyan-400">process_images</span>(
                <br />
                &nbsp;&nbsp;target_dir=<span className="text-emerald-400">"{targetDir}"</span>,
                <br />
                &nbsp;&nbsp;dry_run=<span className="text-pink-400">{isDryRun ? 'True' : 'False'}</span>
                <br />)
              </div>

              <button
                onClick={handleDownloadProcessed}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Download 1080p Artwork
              </button>
            </div>
          )}

          {/* TAB 1: RESIZE & FORMAT */}
          {activeTab === 'transform' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Resize & Format Settings
              </div>

              {/* Target Width */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Target Width</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{targetWidth} px</span>
                </div>
                <input
                  type="range"
                  min="240"
                  max="1920"
                  step="40"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="flex gap-1 text-[10px]">
                  {[480, 800, 1080, 1440, 1920].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setTargetWidth(preset)}
                      className={`px-2 py-0.5 rounded border text-mono ${
                        targetWidth === preset ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {preset}p
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Target Format (convert_image_format)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['image/webp', 'image/jpeg', 'image/png'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setOutputFormat(fmt)}
                      className={`py-2 text-xs font-mono font-semibold rounded-xl border transition-all ${
                        outputFormat === fmt
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fmt.replace('image/', '').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider */}
              {outputFormat !== 'image/png' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Quality Compression</span>
                    <span className="font-mono text-cyan-400 tabular-nums">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
              )}

              {/* Python Snippet */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400">
                <div className="text-[10px] uppercase text-slate-500 mb-1 font-sans">Python Code:</div>
                <span className="text-indigo-400">from</span> pytoolkit.images <span className="text-indigo-400">import</span> batch_resize_images, convert_image_format
                <br />
                <span className="text-cyan-400">batch_resize_images</span>(
                <br />
                &nbsp;&nbsp;[<span className="text-emerald-400">"photo.jpg"</span>],
                <br />
                &nbsp;&nbsp;max_dimension=<span className="text-amber-400">{targetWidth}</span>
                <br />)
              </div>
            </div>
          )}

          {/* TAB 2: WATERMARK */}
          {activeTab === 'watermark' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Watermark Parameters
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Placement Position</label>
                <select
                  value={wmPosition}
                  onChange={(e) => setWmPosition(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="bottom-right">Bottom-Right (Corner)</option>
                  <option value="bottom-left">Bottom-Left (Corner)</option>
                  <option value="top-right">Top-Right (Corner)</option>
                  <option value="center">Center</option>
                  <option value="tile">Tile Grid Overlay</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Alpha Opacity</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{(wmOpacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={wmOpacity}
                  onChange={(e) => setWmOpacity(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Font Size</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{wmFontSize} px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="64"
                  value={wmFontSize}
                  onChange={(e) => setWmFontSize(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: FILTERS */}
          {activeTab === 'filters' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Aesthetic & Enhancement Filters
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'Original (None)' },
                  { id: 'grayscale', label: 'Grayscale' },
                  { id: 'sepia', label: 'Warm Sepia' },
                  { id: 'high_contrast', label: 'High Contrast' },
                  { id: 'vintage', label: 'Vintage Tone' },
                  { id: 'invert', label: 'Color Invert' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as any)}
                    className={`p-2.5 text-xs rounded-xl border text-left transition-all ${
                      activeFilter === f.id
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ASCII ART */}
          {activeTab === 'ascii' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                ASCII Terminal Renderer
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Column Width</span>
                  <span className="font-mono text-cyan-400 tabular-nums">{asciiCols} chars</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="100"
                  value={asciiCols}
                  onChange={(e) => setAsciiCols(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <button
                onClick={handleCopyAscii}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-colors"
              >
                {copiedAscii ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedAscii ? 'Copied to Clipboard' : 'Copy ASCII Text'}
              </button>
            </div>
          )}

          {/* TAB 5: EXIF PRIVACY */}
          {activeTab === 'exif' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                EXIF Metadata Scrubbing
              </div>
              <p className="text-xs text-slate-400">
                Removes sensitive GPS coordinates, camera serial numbers, lens profiles, and timestamps to safeguard user privacy before public upload.
              </p>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Privacy Protection Active
                </div>
                <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <div>✓ GPS Latitude/Longitude: Stripped</div>
                  <div>✓ Camera Serial: Removed</div>
                  <div>✓ Device Model: Redacted</div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics & Download Button */}
          {processedResult && activeTab !== 'ascii' && activeTab !== 'border_crop' && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Resolution</span>
                <span className="font-mono text-white tabular-nums">
                  {processedResult.width} × {processedResult.height}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Output File Size</span>
                <span className="font-mono text-cyan-400 tabular-nums">
                  {formatBytes(processedResult.sizeBytes)}
                </span>
              </div>

              <button
                onClick={handleDownloadProcessed}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Download Processed Image
              </button>
            </div>
          )}
        </div>

        {/* Right Preview Canvas / Output */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {activeTab === 'ascii'
                ? 'ASCII Render View'
                : activeTab === 'border_crop'
                ? '16:9 Letterbox Stripped Preview'
                : 'Processed Image Preview'}
            </span>
            {isProcessing && (
              <span className="text-[11px] font-mono text-cyan-400">Processing Canvas...</span>
            )}
          </div>

          <div className="p-6 bg-slate-950/60 flex flex-col items-center justify-center min-h-[420px]">
            {activeTab === 'ascii' ? (
              <div className="w-full overflow-x-auto p-4 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[9px] sm:text-[10px] leading-[1.15] select-text">
                <pre>{asciiArt || 'Generating ASCII...'}</pre>
              </div>
            ) : activeTab === 'border_crop' ? (
              <div className="space-y-4 w-full">
                <div className="relative group max-h-[440px] max-w-full overflow-hidden rounded-xl border border-slate-800 flex justify-center">
                  <img
                    src={borderPreviewUrl || activeImageUrl}
                    alt="Processed 16:9 preview"
                    className="max-h-[440px] w-auto object-contain"
                  />
                </div>

                <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
                  <span>Output: 1920×1080 (16:9)</span>
                  <span className="text-cyan-400">Crop: {detectedCropValues}</span>
                  <span className="text-amber-400">Fix: {detectedFixValues}</span>
                </div>
              </div>
            ) : processedResult ? (
              <div className="relative group max-h-[500px] max-w-full overflow-hidden rounded-xl border border-slate-800">
                <img
                  src={processedResult.dataUrl}
                  alt="Processed preview"
                  className="max-h-[500px] w-auto object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="text-xs text-slate-500">Rendering image...</div>
            )}
          </div>
        </div>
      </div>

      {/* SPECIAL SECTION: TV SERIES / SEASON ARTWORK BATCH PROCESSOR */}
      {activeTab === 'border_crop' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          {/* Section Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span>pytoolkit.images.process_images</span>
                <span>·</span>
                <span>Batch Season Scanner</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                TV Series & Season Episode Artwork Processor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your target directory prompt, execute border detection, symmetrical 16:9 aspect crop, and 1080p Lanczos scaling.
              </p>
            </div>

            <button
              onClick={handleRunSeasonBatch}
              disabled={isSeasonRunning}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                isSeasonRunning
                  ? 'bg-slate-800 text-slate-400 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 active:scale-95 shadow-sm'
              }`}
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isSeasonRunning ? 'animate-spin' : ''}`} />
              {isSeasonRunning ? `Processing ${seasonBatchProgress}%` : 'Execute Season Batch Scan'}
            </button>
          </div>

          {/* TARGET DIRECTORY PROMPT INPUT BOX */}
          <div className="p-5 bg-slate-950/90 border border-cyan-500/30 rounded-2xl space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Target Directory Input Prompt (target_dir)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPromptHelp(!showPromptHelp)}
                  className="text-xs text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Python Prompt Recipes</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">
                Enter or Paste Target Series Directory Path:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={targetDir}
                  onChange={(e) => setTargetDir(e.target.value)}
                  placeholder="e.g. F:\MediaStore\TV\Series\Slow Horses (2022)"
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 text-cyan-300 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none transition-colors"
                />
                <button
                  onClick={() => setTargetDir('F:\\MediaStore\\TV\\Series\\Slow Horses (2022)')}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl shrink-0"
                >
                  Reset Path
                </button>
              </div>

              {/* Sample Quick-Fill Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                <span>Quick Preset Paths:</span>
                {[
                  'F:\\MediaStore\\TV\\Series\\Slow Horses (2022)',
                  'D:\\TVShows\\Ted Lasso (2020)',
                  '/Volumes/Media/TV/Severance (2022)',
                  './Sample_TV_Library',
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setTargetDir(sample)}
                    className="font-mono text-cyan-400/90 hover:text-cyan-300 hover:underline"
                  >
                    "{sample.split('\\').pop()?.split('/').pop()}"
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Scan Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-900">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Season Subfolder Regex Pattern</label>
                <input
                  type="text"
                  value={seasonPattern}
                  onChange={(e) => setSeasonPattern(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Dry-Run Simulation (dry_run)</span>
                </label>
              </div>
            </div>

            {/* Generated Python Interactive Script Snippet */}
            <div className="pt-3 border-t border-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Standalone Python Interactive Script (Ready to Run)
                </span>
                <button
                  onClick={handleCopyPromptCode}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {copiedPythonPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied Script</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-56 select-text">
                <pre>{interactivePythonPromptCode}</pre>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Scanning: <span className="text-cyan-300">{targetDir}</span></span>
              <span className="text-cyan-400">{seasonBatchProgress}% Complete</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${seasonBatchProgress}%` }}
              />
            </div>
          </div>

          {/* Results Table (matching user requested tabular format) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-900/60">
                    <th className="py-3 px-4">Season Folder</th>
                    <th className="py-3 px-4">Filename</th>
                    <th className="py-3 px-4">Border Crop Values</th>
                    <th className="py-3 px-4">16:9 Fix Values</th>
                    <th className="py-3 px-4">Resolution (Original → Final)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {SAMPLE_SEASON_FILES.map((file, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-slate-400">{file.season}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{file.filename}</td>
                      <td className="py-3 px-4 text-cyan-300">{file.cropValues}</td>
                      <td className="py-3 px-4 text-amber-300">{file.aspectFixValues}</td>
                      <td className="py-3 px-4 text-slate-300 tabular-nums">
                        {file.originalSize[0]}×{file.originalSize[1]} → <span className="text-emerald-400 font-bold">{file.finalSize[0]}×{file.finalSize[1]}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 text-[11px] font-sans font-semibold">
                          ✓ Processed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
