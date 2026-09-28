import React, { useState } from 'react';
import { FolderTree, Layers, Trash2, RefreshCw, Copy, Check, Filter, HardDrive } from 'lucide-react';
import { SAMPLE_VFS, generateAsciiTree, calculateVFSSummary, simulateFlatten, formatBytes, VFSNode } from '../utils/fileOperations';

export const DirectoryLab: React.FC = () => {
  const [vfs, setVfs] = useState<VFSNode>(SAMPLE_VFS);
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [showSizes, setShowSizes] = useState<boolean>(true);
  const [filterPattern, setFilterPattern] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'tree' | 'summary' | 'flatten' | 'empty_cleaner'>('tree');
  const [copiedTree, setCopiedTree] = useState<boolean>(false);
  const [flattenSeparator, setFlattenSeparator] = useState<string>('_');
  const [cleanedEmpty, setCleanedEmpty] = useState<boolean>(false);

  const treeText = generateAsciiTree(vfs, {
    maxDepth,
    showHidden,
    showSizes,
    filterPattern,
  });

  const summary = calculateVFSSummary(vfs);
  const flattenedFiles = simulateFlatten(vfs, flattenSeparator);

  const handleCopyTree = () => {
    navigator.clipboard.writeText(treeText);
    setCopiedTree(true);
    setTimeout(() => setCopiedTree(false), 2000);
  };

  const handleCleanEmptyDirs = () => {
    function removeEmpty(node: VFSNode): VFSNode {
      if (node.type === 'file' || !node.children) return node;
      const filteredChildren = node.children
        .map(removeEmpty)
        .filter((child) => child.type === 'file' || (child.children && child.children.length > 0));
      return { ...node, children: filteredChildren };
    }
    setVfs(removeEmpty(vfs));
    setCleanedEmpty(true);
    setTimeout(() => setCleanedEmpty(false), 3000);
  };

  const handleResetVFS = () => {
    setVfs(SAMPLE_VFS);
    setCleanedEmpty(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>pytoolkit.directories</span>
            <span aria-hidden="true">·</span>
            <span>Interactive Visual Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5">
            Directory Procedures Workbench
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Test directory tree visualizers, recursive size profiling, hierarchy flattening, and automated empty folder pruning on a live virtual file system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetVFS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset VFS State
          </button>
        </div>
      </div>

      {/* Subtab Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('tree')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'tree'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          Tree Visualizer
        </button>
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'summary'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          Size & Distribution Breakdown
        </button>
        <button
          onClick={() => setActiveSubTab('flatten')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'flatten'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Flatten Hierarchy
        </button>
        <button
          onClick={() => setActiveSubTab('empty_cleaner')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'empty_cleaner'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Empty Folder Pruner
        </button>
      </div>

      {/* SUBTAB 1: TREE VISUALIZER */}
      {activeSubTab === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Tree Generation Parameters
            </div>

            {/* Depth Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Max Depth (max_depth)</span>
                <span className="font-mono text-cyan-400 tabular-nums">{maxDepth}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Filter Pattern */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filter Pattern (pattern)
              </label>
              <input
                type="text"
                placeholder="e.g. *.py, *.jpg, doc"
                value={filterPattern}
                onChange={(e) => setFilterPattern(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Display file sizes (show_sizes)</span>
                <input
                  type="checkbox"
                  checked={showSizes}
                  onChange={(e) => setShowSizes(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Include hidden dotfiles (show_hidden)</span>
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>

            {/* Equivalent Python Code */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400">
              <div className="text-[10px] uppercase text-slate-500 mb-1 font-sans">Python Invocation:</div>
              <span className="text-cyan-400">generate_tree</span>(
              <br />
              &nbsp;&nbsp;dir_path=<span className="text-emerald-400">"./project_root"</span>,
              <br />
              &nbsp;&nbsp;max_depth=<span className="text-amber-400">{maxDepth}</span>,
              <br />
              &nbsp;&nbsp;show_sizes=<span className="text-pink-400">{showSizes ? 'True' : 'False'}</span>,
              <br />
              &nbsp;&nbsp;show_hidden=<span className="text-pink-400">{showHidden ? 'True' : 'False'}</span>
              {filterPattern ? `, pattern="${filterPattern}"` : ''}
              <br />)
            </div>
          </div>

          {/* Rendered ASCII Output */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <span>Standard Output (stdout)</span>
              </div>
              <button
                onClick={handleCopyTree}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
              >
                {copiedTree ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTree ? 'Copied' : 'Copy Tree'}
              </button>
            </div>

            <div className="p-5 bg-slate-950/80 font-mono text-xs leading-relaxed text-emerald-400 overflow-x-auto min-h-[360px]">
              <pre>{treeText}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SIZE & SUMMARY */}
      {activeSubTab === 'summary' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Total Storage</div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">{summary.humanSize}</div>
              <div className="text-xs text-slate-400 font-mono tabular-nums">{summary.totalBytes.toLocaleString()} bytes</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Total Files</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">{summary.totalFiles}</div>
              <div className="text-xs text-slate-400">Indexed in tree</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Total Folders</div>
              <div className="text-2xl font-bold font-mono text-indigo-400 tabular-nums">{summary.totalDirs}</div>
              <div className="text-xs text-slate-400">Subdirectory nodes</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Empty Directories</div>
              <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">{summary.emptyDirs.length}</div>
              <div className="text-xs text-slate-400">Available to prune</div>
            </div>
          </div>

          {/* Extension Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Extension Breakdown (<code className="text-cyan-400">get_dir_summary</code>)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-5">File Extension</th>
                    <th className="py-3 px-5">File Count</th>
                    <th className="py-3 px-5">Aggregated Size</th>
                    <th className="py-3 px-5">Relative Footprint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(summary.extensionCounts)
                    .sort((a, b) => (summary.extensionBytes[b[0]] || 0) - (summary.extensionBytes[a[0]] || 0))
                    .map(([ext, count]) => {
                      const bytes = summary.extensionBytes[ext] || 0;
                      const pct = summary.totalBytes > 0 ? (bytes / summary.totalBytes) * 100 : 0;
                      return (
                        <tr key={ext} className="hover:bg-slate-800/40">
                          <td className="py-3 px-5 font-bold text-cyan-300">{ext}</td>
                          <td className="py-3 px-5 text-slate-300 tabular-nums">{count}</td>
                          <td className="py-3 px-5 text-slate-300 tabular-nums">{formatBytes(bytes)}</td>
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-cyan-500 h-full rounded-full"
                                  style={{ width: `${Math.max(4, pct)}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-400 tabular-nums">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: FLATTEN HIERARCHY */}
      {activeSubTab === 'flatten' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Flatten Subfolder Hierarchy Simulator</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Maps nested subpaths into a single destination folder with safe delimiter naming.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Path Separator:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {['_', '-', '.'].map((sep) => (
                  <button
                    key={sep}
                    onClick={() => setFlattenSeparator(sep)}
                    className={`px-2.5 py-1 text-xs font-mono rounded ${
                      flattenSeparator === sep ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    "{sep}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-5">Original Nested Path</th>
                    <th className="py-3 px-5">Flattened Target File Name</th>
                    <th className="py-3 px-5">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {flattenedFiles.map((file, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-5 text-slate-400">{file.originalPath}</td>
                      <td className="py-3 px-5 text-cyan-300 font-semibold">{file.flatName}</td>
                      <td className="py-3 px-5 text-slate-400 tabular-nums">{formatBytes(file.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: EMPTY FOLDER CLEANER */}
      {activeSubTab === 'empty_cleaner' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Empty Directory Discovery & Pruning</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Performs a bottom-up walk to safely detect zero-item directories and remove them without touching populated folders.
              </p>
            </div>
            <button
              onClick={handleCleanEmptyDirs}
              disabled={summary.emptyDirs.length === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                summary.emptyDirs.length > 0
                  ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Prune Discovered Empty Folders
            </button>
          </div>

          {cleanedEmpty && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Empty directories have been pruned from the Virtual File System!
            </div>
          )}

          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Discovered Empty Directories ({summary.emptyDirs.length})
            </div>
            {summary.emptyDirs.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                ✨ No empty directories in the current filesystem tree.
              </div>
            ) : (
              <div className="space-y-2">
                {summary.emptyDirs.map((dir, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 flex items-center justify-between"
                  >
                    <span>📁 {dir}</span>
                    <span className="text-[11px] text-slate-500 font-sans">0 items (empty)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
