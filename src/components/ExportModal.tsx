import React, { useState } from 'react';
import { X, Download, Check, Copy, Package, Terminal, ShieldCheck, Folder } from 'lucide-react';
import { downloadPythonPackageZip } from '../utils/zipExporter';
import { PYTHON_LIBRARY_FILES, PYTHON_PACKAGE_NAME, PYTHON_PACKAGE_VERSION } from '../data/pythonLibraryCode';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedPip, setCopiedPip] = useState(false);
  const [copiedDevInstall, setCopiedDevInstall] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadPythonPackageZip();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyPip = (cmd: string, type: 'pip' | 'dev') => {
    navigator.clipboard.writeText(cmd);
    if (type === 'pip') {
      setCopiedPip(true);
      setTimeout(() => setCopiedPip(false), 2000);
    } else {
      setCopiedDevInstall(true);
      setTimeout(() => setCopiedDevInstall(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-base text-white">
              Export {PYTHON_PACKAGE_NAME} Package
            </span>
            <span className="text-xs font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              v{PYTHON_PACKAGE_VERSION}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Download Hero */}
          <div className="p-5 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">
                Download Complete Source Bundle (.zip)
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Includes all {PYTHON_LIBRARY_FILES.length} source files, pyproject.toml, tests, and CLI entry points.
              </p>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Packaging Zip...' : 'Download .zip'}
            </button>
          </div>

          {/* Quick Install Commands */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Installation & Integration Instructions
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-400">1. Install in editable mode from unpacked directory:</div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs flex items-center justify-between text-cyan-300">
                <span>pip install -e .</span>
                <button
                  onClick={() => handleCopyPip('pip install -e .', 'pip')}
                  className="text-slate-400 hover:text-cyan-400 p-1"
                >
                  {copiedPip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-slate-400">2. Run CLI directly from terminal:</div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs flex items-center justify-between text-slate-300">
                <span>python -m pytoolkit tree --depth 2</span>
                <button
                  onClick={() => handleCopyPip('python -m pytoolkit tree --depth 2', 'dev')}
                  className="text-slate-400 hover:text-cyan-400 p-1"
                >
                  {copiedDevInstall ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Package Contents Breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Files Included in Archive
            </div>
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 font-mono text-xs space-y-1 text-slate-400 max-h-40 overflow-y-auto">
              {PYTHON_LIBRARY_FILES.map((f) => (
                <div key={f.path} className="flex items-center justify-between py-0.5">
                  <span className="text-slate-300">{f.path}</span>
                  <span className="text-[11px] text-slate-500 font-sans">{f.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>MIT License · Open Source</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
