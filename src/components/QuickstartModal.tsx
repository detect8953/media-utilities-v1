import React, { useState } from 'react';
import { X, Play, Copy, Check, Terminal, FolderTree, FileCode, Sparkles } from 'lucide-react';

interface QuickstartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickstartModal: React.FC<QuickstartModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const quickSnippets = [
    {
      id: 'snippet-1',
      title: '1. Directory Traversal & Unicode Tree',
      code: `from pytoolkit import generate_tree, get_dir_summary

# Render visual directory structure with byte sizes
print(generate_tree("./workspace", max_depth=3, show_sizes=True))

# Extract recursive stats & extension breakdown
summary = get_dir_summary("./workspace")
print(f"Total size: {summary['human_size']} ({summary['total_files']} files)")`,
    },
    {
      id: 'snippet-2',
      title: '2. Batch Renaming with Counter Formatting',
      code: `from pathlib import Path
from pytoolkit import batch_rename

files = list(Path("./scans").glob("*.png"))
# Formats into: scan_001_raw.png, scan_002_raw.png, etc.
batch_rename(files, template="scan_{n:03d}_{name}")`,
    },
    {
      id: 'snippet-3',
      title: '3. Image Processing: Resize, EXIF Privacy & Watermark',
      code: `from pytoolkit import (
    batch_resize_images,
    strip_exif_metadata,
    add_watermark,
    convert_image_format
)

# 1. Scrub GPS & camera metadata
clean_path, _ = strip_exif_metadata("user_upload.jpg")

# 2. Resize to 1080p Lanczos
resized = batch_resize_images([clean_path], max_dimension=1080)

# 3. Add branded semi-transparent watermark
marked = add_watermark(resized[0], watermark_text="© 2026 PyToolkit", position="bottom-right")

# 4. Convert to modern high-compression WebP
final_webp = convert_image_format(marked, target_format="webp", quality=85)`,
    },
    {
      id: 'snippet-4',
      title: '4. TV Series Artwork: Auto-Crop Black Borders & 16:9 (1080p)',
      code: `from pytoolkit.images import process_images, print_processing_results

# Scans Season XX folders, autocrops letterbox bars, enforces 16:9, scales to 1920x1080
results = process_images(
    target_dir=r"F:\\MediaStore\\TV\\Series\\Slow Horses (2022)",
    dry_run=False,
    season_pattern=r"Season \\d{2}$"
)

# Render clean status and dimension report table
print_processing_results(results)`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Play className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-base text-white">
              PyToolkit Quickstart Recipes
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-slate-400">
            Copy and paste these standard idioms directly into your Python scripts or Jupyter notebooks:
          </p>

          <div className="space-y-4">
            {quickSnippets.map((s) => (
              <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{s.title}</span>
                  <button
                    onClick={() => handleCopy(s.code, s.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {copiedSection === s.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                  <pre>{s.code}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
