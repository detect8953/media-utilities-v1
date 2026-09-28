import React, { useState } from 'react';
import {
  Tv,
  Film,
  Sliders,
  Settings,
  Code2,
  Play,
  FolderOpen,
  Copy,
  Check,
  Download,
  Terminal,
  RefreshCw,
  Sparkles,
  Layers,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PYTHON_LIBRARY_FILES } from './data/pythonLibraryCode';

interface ConfigState {
  paths: {
    default_tv_series_dir: string;
    default_reality_series_dir: string;
  };
  crop_and_resize: {
    target_width: number;
    target_height: number;
    target_aspect_ratio: number;
    black_threshold: number;
    season_folder_regex: string;
    supported_image_extensions: string[];
  };
  thumbnail_replacement: {
    max_width: number;
    max_height: number;
    ffmpeg_qscale: number;
    video_extensions: string[];
    thumb_suffix: string;
  };
}

const DEFAULT_CONFIG: ConfigState = {
  paths: {
    default_tv_series_dir: 'F:\\MediaStore\\TV\\Series\\Slow Horses (2022)',
    default_reality_series_dir: 'E:\\MediaStore\\TV\\Reality\\Survivor (2000)',
  },
  crop_and_resize: {
    target_width: 1920,
    target_height: 1080,
    target_aspect_ratio: 16 / 9,
    black_threshold: 5,
    season_folder_regex: '^Season \\d{2}$',
    supported_image_extensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  thumbnail_replacement: {
    max_width: 1920,
    max_height: 1080,
    ffmpeg_qscale: 4,
    video_extensions: ['.mkv', '.mp4'],
    thumb_suffix: '-thumb.jpg',
  },
};

const SAMPLE_ARTWORK_RESULTS = [
  {
    filename: 'Slow Horses - S01E01 - Failure\'s Contagious.jpg',
    season: 'Season 01',
    originalSize: '1920x1200',
    cropValues: '0:60:1920:1140',
    aspectFix: 'Not Needed',
    finalSize: '1920x1080',
    status: 'Border Cropped & Scaled',
  },
  {
    filename: 'Slow Horses - S01E02 - Work Drinks.jpg',
    season: 'Season 01',
    originalSize: '1920x1080',
    cropValues: 'Not Needed',
    aspectFix: 'Not Needed',
    finalSize: '1920x1080',
    status: 'Already Compliant (16:9)',
  },
  {
    filename: 'Slow Horses - S01E03 - Bad Tradecraft.jpg',
    season: 'Season 01',
    originalSize: '2048x1152',
    cropValues: 'Not Needed',
    aspectFix: 'L: 14px | R: 14px',
    finalSize: '1920x1080',
    status: 'Aspect Adjusted & Scaled',
  },
  {
    filename: 'Slow Horses - S02E01 - Last Stop.jpg',
    season: 'Season 02',
    originalSize: '1920x1280',
    cropValues: '0:100:1920:1180',
    aspectFix: 'Not Needed',
    finalSize: '1920x1080',
    status: 'Border Cropped & Scaled',
  },
];

const SAMPLE_THUMBNAIL_RESULTS = [
  {
    season: 'Season 01',
    sourceThumb: 'season01-thumb.jpg (2400x1350 → 1920x1080, q=4)',
    mkvFile: 'Survivor - S01E01 - Marooned.mkv',
    targetThumb: 'Survivor - S01E01 - Marooned-thumb.jpg',
    status: 'Synced',
  },
  {
    season: 'Season 01',
    sourceThumb: 'season01-thumb.jpg (2400x1350 → 1920x1080, q=4)',
    mkvFile: 'Survivor - S01E02 - The Generation Gap.mkv',
    targetThumb: 'Survivor - S01E02 - The Generation Gap-thumb.jpg',
    status: 'Synced',
  },
  {
    season: 'Season 02',
    sourceThumb: 'season02-thumb.jpg (1920x1080 compliant)',
    mkvFile: 'Survivor - S02E01 - Stranded.mkv',
    targetThumb: 'Survivor - S02E01 - Stranded-thumb.jpg',
    status: 'Synced',
  },
  {
    season: 'Season 02',
    sourceThumb: 'season02-thumb.jpg (1920x1080 compliant)',
    mkvFile: 'Survivor - S02E02 - Suspicion.mkv',
    targetThumb: 'Survivor - S02E02 - Suspicion-thumb.jpg',
    status: 'Synced',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'manager' | 'crop_tool' | 'thumb_tool' | 'config' | 'code'>('manager');
  const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG);

  // Tool 1 state
  const [tvDirPrompt, setTvDirPrompt] = useState<string>(DEFAULT_CONFIG.paths.default_tv_series_dir);
  const [tvDryRun, setTvDryRun] = useState<boolean>(false);
  const [tvThreshold, setTvThreshold] = useState<number>(DEFAULT_CONFIG.crop_and_resize.black_threshold);
  const [tvRunning, setTvRunning] = useState<boolean>(false);
  const [tvProgress, setTvProgress] = useState<number>(100);

  // Tool 2 state
  const [realityDirPrompt, setRealityDirPrompt] = useState<string>(DEFAULT_CONFIG.paths.default_reality_series_dir);
  const [realityDryRun, setRealityDryRun] = useState<boolean>(false);
  const [realityRunning, setRealityRunning] = useState<boolean>(false);
  const [realityProgress, setRealityProgress] = useState<number>(100);

  // Active Code Viewer
  const [selectedScriptPath, setSelectedScriptPath] = useState<string>('media_artwork_manager.py');
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);

  const handleRunTool1 = async () => {
    setTvRunning(true);
    setTvProgress(0);
    for (let i = 10; i <= 100; i += 25) {
      await new Promise((r) => setTimeout(r, 120));
      setTvProgress(i);
    }
    setTvRunning(false);
  };

  const handleRunTool2 = async () => {
    setRealityRunning(true);
    setRealityProgress(0);
    for (let i = 10; i <= 100; i += 25) {
      await new Promise((r) => setTimeout(r, 120));
      setRealityProgress(i);
    }
    setRealityRunning(false);
  };

  const activeScript = PYTHON_LIBRARY_FILES.find((f) => f.path === selectedScriptPath) || PYTHON_LIBRARY_FILES[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleSaveConfigJson = () => {
    const jsonStr = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 font-mono font-black text-base">
              PY
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white font-mono">PyToolkit</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                  v1.2.0 Media Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">TV Artwork & MKV Thumbnail Automation Suite</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('manager')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'manager'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Unified Menu
            </button>
            <button
              onClick={() => setActiveTab('crop_tool')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'crop_tool'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              16:9 Border Auto-Crop
            </button>
            <button
              onClick={() => setActiveTab('thumb_tool')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'thumb_tool'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              MKV Thumbnail Sync
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'config'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              config.json
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Python Scripts
            </button>
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* TAB 1: UNIFIED MENU MANAGER */}
        {activeTab === 'manager' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-3xl space-y-3">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  media_artwork_manager.py
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Media Artwork & MKV Thumbnail Automation Suite
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A standardized Python package with interactive folder prompts, configuration persistence, and independent tool runners.
                </p>
              </div>
            </div>

            {/* Tool Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: 16:9 Border Auto-Crop */}
              <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Tv className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">1. 16:9 Border Auto-Crop & 1080p Resizer</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Scans TV Season folders (<code className="text-cyan-300">Season \d&#123;2&#125;$</code>), strips letterbox/pillarbox bars using luminance thresholding, enforces 16:9 ratio, and resizes to 1920×1080.
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
                    <span className="text-slate-500">Runner:</span> crop_and_resize_artwork.py
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('crop_tool')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  Launch Tool 1 (Interactive)
                </button>
              </div>

              {/* Card 2: MKV Thumbnail Synchronizer */}
              <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">2. MKV Season Thumbnail Replacer</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Finds normalized season thumbnails (<code className="text-blue-300">season01-thumb.jpg</code>), optimizes & downscales to 1080p, and propagates them to match all episode <code className="text-blue-300">.mkv</code> files.
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
                    <span className="text-slate-500">Runner:</span> sync_mkv_thumbnails.py
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('thumb_tool')}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  Launch Tool 2 (Interactive)
                </button>
              </div>
            </div>

            {/* Interactive Terminal Demo Simulation */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-slate-300 space-y-2 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-500 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2">Interactive Terminal Menu Preview</span>
                </div>
                <span>python media_artwork_manager.py</span>
              </div>
              <pre className="text-cyan-400 select-text leading-relaxed">
{`======================================================================
         🎬 MEDIA ARTWORK & THUMBNAIL SUITE
======================================================================
  [1] 🖼️  Auto-Crop Black Borders & Enforce 16:9 Ratio (1080p)
  [2] 🎞️  Sync Season Thumbnail to Episode .MKV Files
  [3] ⚡  Run Full Pipeline (Border Crop + Thumbnail Sync)
  [0] 🚪  Exit
----------------------------------------------------------------------
Enter your choice [0-3]: 1

Select TV Series Folder for 16:9 Auto-Crop
Default: ${config.paths.default_tv_series_dir}
Enter path (or press Enter to use default):
> 

Run in Dry-Run simulation mode? [Y/n] (default: No): n
🚀 Found 4 episode images. Processing...
Progress |████████████████████████████████████████| 100.0% Complete`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: TOOL 1 - 16:9 BORDER AUTO-CROP */}
        {activeTab === 'crop_tool' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <span>crop_and_resize_artwork.py</span>
                  <span>·</span>
                  <span>Standalone Runner</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">TV Series 16:9 Border Auto-Crop & Resizer</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactively prompt for directory, clean drag-and-drop quotes, detect borders, and resize to 1920×1080.
                </p>
              </div>

              <button
                onClick={handleRunTool1}
                disabled={tvRunning}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  tvRunning
                    ? 'bg-slate-800 text-slate-500 cursor-wait'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95'
                }`}
              >
                <Play className={`w-4 h-4 fill-current ${tvRunning ? 'animate-spin' : ''}`} />
                {tvRunning ? `Processing ${tvProgress}%` : 'Execute Artwork Scan'}
              </button>
            </div>

            {/* Target Directory Prompt Box */}
            <div className="p-5 bg-slate-950 rounded-xl border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                  Target Directory Input Prompt
                </div>
                <span className="text-[11px] text-cyan-400 font-mono">Validated Directory</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">
                  Enter target TV series directory (or leave default):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tvDirPrompt}
                    onChange={(e) => setTvDirPrompt(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:outline-none"
                  />
                  <button
                    onClick={() => setTvDirPrompt(config.paths.default_tv_series_dir)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 rounded-xl"
                  >
                    Reset Default
                  </button>
                </div>
              </div>

              {/* Threshold & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-900">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Black Border Luminance Threshold</span>
                    <span className="font-mono text-cyan-400 font-bold">{tvThreshold} / 255</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={tvThreshold}
                    onChange={(e) => setTvThreshold(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tvDryRun}
                      onChange={(e) => setTvDryRun(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Dry-Run Mode (Preview dimensions only)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Directory: <span className="text-cyan-300">{tvDirPrompt}</span></span>
                <span className="text-emerald-400">{SAMPLE_ARTWORK_RESULTS.length} files scanned</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-inner">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-900/60">
                      <th className="py-3 px-4">Season</th>
                      <th className="py-3 px-4">Episode File</th>
                      <th className="py-3 px-4">Border Crop</th>
                      <th className="py-3 px-4">Aspect Fix</th>
                      <th className="py-3 px-4">Resolution (Orig → Final)</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {SAMPLE_ARTWORK_RESULTS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 text-slate-400">{row.season}</td>
                        <td className="py-3 px-4 text-slate-200 font-bold">{row.filename}</td>
                        <td className="py-3 px-4 text-cyan-300">{row.cropValues}</td>
                        <td className="py-3 px-4 text-amber-300">{row.aspectFix}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {row.originalSize} → <span className="text-emerald-400 font-bold">{row.finalSize}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-400 text-[11px] font-sans font-semibold">
                            ✓ {row.status}
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

        {/* TAB 3: TOOL 2 - MKV THUMBNAIL SYNC */}
        {activeTab === 'thumb_tool' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
                  <span>sync_mkv_thumbnails.py</span>
                  <span>·</span>
                  <span>Standalone Runner</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">MKV Season Thumbnail Replacer & Compressor</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Downscales master season thumbnail in-place and duplicates it across all episode <code className="text-blue-300">.mkv</code> files.
                </p>
              </div>

              <button
                onClick={handleRunTool2}
                disabled={realityRunning}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  realityRunning
                    ? 'bg-slate-800 text-slate-500 cursor-wait'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 active:scale-95'
                }`}
              >
                <Play className={`w-4 h-4 fill-current ${realityRunning ? 'animate-spin' : ''}`} />
                {realityRunning ? `Processing ${realityProgress}%` : 'Execute Thumbnail Sync'}
              </button>
            </div>

            {/* Directory Input Prompt */}
            <div className="p-5 bg-slate-950 rounded-xl border border-blue-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  Target Series Directory Prompt
                </div>
                <span className="text-[11px] text-blue-400 font-mono">MKV Episode Target</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">
                  Enter series directory with season subfolders:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={realityDirPrompt}
                    onChange={(e) => setRealityDirPrompt(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs font-mono text-blue-300 focus:outline-none"
                  />
                  <button
                    onClick={() => setRealityDirPrompt(config.paths.default_reality_series_dir)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 rounded-xl"
                  >
                    Reset Default
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                <div className="text-xs text-slate-400 font-mono">
                  Master Thumb Pattern: <span className="text-blue-300">season&#123;XX&#125;-thumb.jpg</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={realityDryRun}
                    onChange={(e) => setRealityDryRun(e.target.checked)}
                    className="rounded border-slate-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span>Dry-Run Simulation (No file changes)</span>
                </label>
              </div>
            </div>

            {/* Results Table */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Scanned: <span className="text-blue-300">{realityDirPrompt}</span></span>
                <span className="text-emerald-400">4 video thumbnails synced</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-inner">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-900/60">
                      <th className="py-3 px-4">Season</th>
                      <th className="py-3 px-4">Optimized Source Thumbnail</th>
                      <th className="py-3 px-4">Episode Video (.MKV)</th>
                      <th className="py-3 px-4">Created Episode Thumb</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {SAMPLE_THUMBNAIL_RESULTS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 text-slate-400">{row.season}</td>
                        <td className="py-3 px-4 text-blue-300">{row.sourceThumb}</td>
                        <td className="py-3 px-4 text-slate-200">{row.mkvFile}</td>
                        <td className="py-3 px-4 text-emerald-400 font-bold">{row.targetThumb}</td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-400 text-[11px] font-sans font-semibold">
                            ✓ {row.status}
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

        {/* TAB 4: CONFIGURATION MANAGER */}
        {activeTab === 'config' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <span>config.json</span>
                  <span>·</span>
                  <span>Configuration Manager</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">Suite Configuration & Default Paths</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Changes made here are read automatically by all runner scripts and user prompts.
                </p>
              </div>

              <button
                onClick={handleSaveConfigJson}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {copiedConfig ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedConfig ? 'Copied config.json' : 'Copy config.json'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Controls */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Default TV Series Path</label>
                  <input
                    type="text"
                    value={config.paths.default_tv_series_dir}
                    onChange={(e) => setConfig({
                      ...config,
                      paths: { ...config.paths, default_tv_series_dir: e.target.value }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Default Reality Show Path</label>
                  <input
                    type="text"
                    value={config.paths.default_reality_series_dir}
                    onChange={(e) => setConfig({
                      ...config,
                      paths: { ...config.paths, default_reality_series_dir: e.target.value }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target Width</label>
                    <input
                      type="number"
                      value={config.crop_and_resize.target_width}
                      onChange={(e) => setConfig({
                        ...config,
                        crop_and_resize: { ...config.crop_and_resize, target_width: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target Height</label>
                    <input
                      type="number"
                      value={config.crop_and_resize.target_height}
                      onChange={(e) => setConfig({
                        ...config,
                        crop_and_resize: { ...config.crop_and_resize, target_height: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Season Subfolder Regex</label>
                  <input
                    type="text"
                    value={config.crop_and_resize.season_folder_regex}
                    onChange={(e) => setConfig({
                      ...config,
                      crop_and_resize: { ...config.crop_and_resize, season_folder_regex: e.target.value }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300"
                  />
                </div>
              </div>

              {/* JSON Live Viewer */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-slate-500 uppercase pb-2 mb-2 border-b border-slate-900 flex justify-between">
                    <span>Active config.json Preview</span>
                    <span className="text-cyan-400">JSON</span>
                  </div>
                  <pre className="text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed select-text max-h-80">
                    {JSON.stringify(config, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SCRIPT SOURCE CODE EXPLORER */}
        {activeTab === 'code' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  'media_artwork_manager.py',
                  'crop_and_resize_artwork.py',
                  'sync_mkv_thumbnails.py',
                  'media_config.py',
                  'config.json',
                  'run.bat',
                  'run.sh',
                ].map((fname) => (
                  <button
                    key={fname}
                    onClick={() => setSelectedScriptPath(fname)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                      selectedScriptPath === fname
                        ? 'bg-cyan-500/10 border border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fname}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopyCode(activeScript?.code || '')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg transition-colors"
              >
                {copiedFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFile ? 'Copied File' : 'Copy File'}
              </button>
            </div>

            <div className="p-6 bg-slate-950 font-mono text-xs overflow-x-auto select-text leading-relaxed">
              <pre className="text-slate-300">{activeScript?.code || '// File not found'}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
