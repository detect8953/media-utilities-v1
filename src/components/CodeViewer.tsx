import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Folder, Terminal, Sparkles } from 'lucide-react';
import { PYTHON_LIBRARY_FILES, PythonFile } from '../data/pythonLibraryCode';
import { downloadSingleFile } from '../utils/zipExporter';

interface CodeViewerProps {
  onOpenQuickstart?: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = () => {
  const [selectedPath, setSelectedPath] = useState<string>('pytoolkit/directories.py');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentFile = PYTHON_LIBRARY_FILES.find((f) => f.path === selectedPath) || PYTHON_LIBRARY_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadSingleFile(currentFile.filename, currentFile.code);
  };

  const categories: Array<{ id: PythonFile['category']; label: string }> = [
    { id: 'core', label: 'Core & Overview' },
    { id: 'modules', label: 'Utility Modules' },
    { id: 'cli', label: 'CLI & Automation' },
    { id: 'packaging', label: 'Packaging & Setup' },
    { id: 'tests', label: 'Test Suite' },
    { id: 'examples', label: 'Demo Scripts' },
  ];

  const filteredFiles = PYTHON_LIBRARY_FILES.filter(
    (f) =>
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium tracking-wide">
            <span>Python 3.9+</span>
            <span aria-hidden="true">·</span>
            <span>Type-Annotated</span>
            <span aria-hidden="true">·</span>
            <span>Zero External C-Dependencies (Pillow only for images)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5 font-sans">
            PyToolkit Package Source
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Modular, production-ready utility procedures for recursive directory traversal, atomic file handling, cryptographic hashing, and image transformations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
            pip install <span className="text-cyan-400 font-semibold">pytoolkit</span>
          </div>
        </div>
      </div>

      {/* Main File Browser & Code View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: File Tree Navigation */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Package Tree
            </span>
            <span className="text-xs font-mono text-cyan-400">
              {PYTHON_LIBRARY_FILES.length} files
            </span>
          </div>

          <input
            type="text"
            placeholder="Search files or procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const catFiles = filteredFiles.filter((f) => f.category === cat.id);
              if (catFiles.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 px-2 uppercase tracking-wider">
                    {cat.label}
                  </div>
                  <div className="space-y-1">
                    {catFiles.map((file) => {
                      const isSelected = file.path === selectedPath;
                      return (
                        <button
                          key={file.path}
                          onClick={() => setSelectedPath(file.path)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                          }`}
                        >
                          <div className="truncate flex-1">
                            <div className="font-semibold truncate">{file.path}</div>
                            <div className="text-[11px] font-sans text-slate-500 truncate mt-0.5">
                              {file.description}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Code Display and Toolbar */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* File Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                {currentFile.path}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 truncate hidden sm:inline">
                {currentFile.description}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                title="Copy code to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                title="Download this file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="p-4 bg-slate-950/70 overflow-x-auto max-h-[700px]">
            <pre className="font-mono text-xs leading-relaxed text-slate-300 select-text">
              <code>
                {currentFile.code.split('\n').map((line, idx) => (
                  <div key={idx} className="table-row">
                    <span className="table-cell select-none pr-4 text-slate-600 text-right font-mono tabular-nums text-[11px] w-8">
                      {idx + 1}
                    </span>
                    <span className="table-cell whitespace-pre">
                      {formatPythonSyntax(line)}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatPythonSyntax(line: string): React.ReactNode {
  // Simple clean syntax highlight decorator for Python keywords & docstrings
  if (line.trim().startsWith('#')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }
  if (line.trim().startsWith('"""') || line.trim().startsWith("'''") || line.includes('"""')) {
    return <span className="text-emerald-400/90">{line}</span>;
  }
  if (line.trim().startsWith('def ') || line.trim().startsWith('class ')) {
    return <span className="text-cyan-400 font-semibold">{line}</span>;
  }
  if (line.trim().startsWith('from ') || line.trim().startsWith('import ')) {
    return <span className="text-indigo-400 font-medium">{line}</span>;
  }
  if (line.trim().startsWith('@')) {
    return <span className="text-amber-400 font-medium">{line}</span>;
  }
  if (line.trim().startsWith('return ') || line.trim().startsWith('yield ')) {
    return <span className="text-pink-400 font-medium">{line}</span>;
  }
  return line;
}
