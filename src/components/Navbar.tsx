import React from 'react';
import { Download, Code2, Play, Sparkles } from 'lucide-react';

export type ActiveTab = 'explorer' | 'docs' | 'directory_lab' | 'file_lab' | 'image_lab' | 'pipeline_builder' | 'tests';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenExport: () => void;
  onOpenQuickstart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenExport,
  onOpenQuickstart,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-base shadow-sm shadow-cyan-500/20">
            Py
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-sans">
            PyToolkit
          </span>
        </div>

        {/* Zone 2: 4-6 Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectTab('explorer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'explorer'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Library Source
          </button>
          <button
            onClick={() => onSelectTab('docs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'docs'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            API Reference
          </button>
          <button
            onClick={() => onSelectTab('directory_lab')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'directory_lab'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Directory Lab
          </button>
          <button
            onClick={() => onSelectTab('file_lab')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'file_lab'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            File & Rename Lab
          </button>
          <button
            onClick={() => onSelectTab('image_lab')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'image_lab'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Image Studio
          </button>
          <button
            onClick={() => onSelectTab('pipeline_builder')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'pipeline_builder'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline Composer
          </button>
          <button
            onClick={() => onSelectTab('tests')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'tests'
                ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unit Tests
          </button>
        </nav>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden flex items-center">
          <select
            value={activeTab}
            onChange={(e) => onSelectTab(e.target.value as ActiveTab)}
            aria-label="Navigation View"
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="explorer">Library Source</option>
            <option value="docs">API Reference</option>
            <option value="directory_lab">Directory Lab</option>
            <option value="file_lab">File & Rename Lab</option>
            <option value="image_lab">Image Studio</option>
            <option value="pipeline_builder">Pipeline Composer</option>
            <option value="tests">Unit Tests</option>
          </select>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenQuickstart}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 rounded-lg transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            Quickstart
          </button>
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-lg shadow-sm shadow-cyan-500/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Download Package
          </button>
        </div>
      </div>
    </header>
  );
};
