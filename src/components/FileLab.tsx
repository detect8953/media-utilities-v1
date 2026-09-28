import React, { useState } from 'react';
import { FileText, Copy, Check, Upload, ShieldCheck, AlertCircle, RefreshCw, Hash, Sliders } from 'lucide-react';
import { previewBatchRename, computeFileCryptoHash, formatBytes } from '../utils/fileOperations';

const DEFAULT_SAMPLE_FILES = [
  'IMG_4021_RAW.JPEG',
  'IMG_4022_RAW.JPEG',
  'IMG_4023_RAW.JPEG',
  'contract_v1_draft.pdf',
  'contract_v2_final.pdf',
  'customer_export (2026).csv',
  'customer_export (2026) (1).csv',
  'audio_track_01.flac',
  'audio_track_02.flac',
];

export const FileLab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'renamer' | 'duplicates' | 'hash_calc'>('renamer');
  const [fileList, setFileList] = useState<string[]>(DEFAULT_SAMPLE_FILES);
  const [template, setTemplate] = useState<string>('photo_{n:03d}_{name}');
  const [findPattern, setFindPattern] = useState<string>('');
  const [replaceWith, setReplaceWith] = useState<string>('');
  const [isRegex, setIsRegex] = useState<boolean>(false);
  const [caseTransform, setCaseTransform] = useState<'none' | 'lowercase' | 'uppercase' | 'slugify'>('none');
  const [startIndex, setStartIndex] = useState<number>(1);
  const [newFileEntry, setNewFileEntry] = useState<string>('');

  // Uploaded real files for duplicate/hash lab
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; hash?: string; file: File }>>([]);
  const [hashingAlgorithm, setHashingAlgorithm] = useState<'SHA-256' | 'SHA-1' | 'MD5'>('SHA-256');
  const [isHashing, setIsHashing] = useState<boolean>(false);

  const renamePlan = previewBatchRename(fileList, {
    template: template.trim() ? template : undefined,
    findPattern: findPattern.trim() ? findPattern : undefined,
    replaceWith,
    isRegex,
    caseTransform,
    startIndex,
  });

  const clashCount = renamePlan.filter((p) => p.status === 'clash').length;

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileEntry.trim()) return;
    setFileList([...fileList, newFileEntry.trim()]);
    setNewFileEntry('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setIsHashing(true);

    const processed = await Promise.all(
      files.map(async (f) => {
        const hash = await computeFileCryptoHash(f, hashingAlgorithm);
        return {
          name: f.name,
          size: f.size,
          hash,
          file: f,
        };
      })
    );

    setUploadedFiles((prev) => [...prev, ...processed]);
    setIsHashing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>pytoolkit.files</span>
          <span aria-hidden="true">·</span>
          <span>Batch Operations & Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5">
          File & Batch Renaming Studio
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Test zero-padded batch renaming patterns, regex replacements, collision checks, cryptographic hashing, and duplicate file analysis in real time.
        </p>
      </div>

      {/* Subtab Segmented Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveSubTab('renamer')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'renamer'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Batch Renamer Previewer
        </button>
        <button
          onClick={() => setActiveSubTab('duplicates')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'duplicates'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Duplicate File Finder
        </button>
        <button
          onClick={() => setActiveSubTab('hash_calc')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'hash_calc'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          Cryptographic Hash Lab
        </button>
      </div>

      {/* SUBTAB 1: BATCH RENAMER */}
      {activeSubTab === 'renamer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Renaming Configuration
              </span>
              <button
                onClick={() => setFileList(DEFAULT_SAMPLE_FILES)}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Reset Files
              </button>
            </div>

            {/* Template Pattern */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">
                Format Template (template)
              </label>
              <input
                type="text"
                value={template}
                onChange={(e) => {
                  setTemplate(e.target.value);
                  if (e.target.value) {
                    setFindPattern('');
                  }
                }}
                placeholder="e.g. photo_{n:03d}_{name}"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <div className="flex flex-wrap gap-1 text-[10px] text-slate-400 font-mono mt-1">
                <button onClick={() => setTemplate('doc_{n:03d}_{name}')} className="hover:text-cyan-400 underline">
                  {'{n:03d}'}
                </button>
                <span>·</span>
                <button onClick={() => setTemplate('{date}_{name}')} className="hover:text-cyan-400 underline">
                  {'{date}'}
                </button>
                <span>·</span>
                <button onClick={() => setTemplate('{name}_backup.{ext}')} className="hover:text-cyan-400 underline">
                  {'{name}.{ext}'}
                </button>
              </div>
            </div>

            {/* Search & Replace Alternative */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">Or Search & Replace:</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Find..."
                  value={findPattern}
                  onChange={(e) => {
                    setFindPattern(e.target.value);
                    if (e.target.value) setTemplate('');
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <input
                  type="text"
                  placeholder="Replace with..."
                  value={replaceWith}
                  onChange={(e) => setReplaceWith(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Regex mode (is_regex)</span>
              </label>
            </div>

            {/* Transformations & Counter */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Counter</label>
                  <input
                    type="number"
                    min="1"
                    value={startIndex}
                    onChange={(e) => setStartIndex(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Case Format</label>
                  <select
                    value={caseTransform}
                    onChange={(e) => setCaseTransform(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="none">Original</option>
                    <option value="lowercase">lowercase</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="slugify">kebab-slug</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Add File to list */}
            <form onSubmit={handleAddFile} className="pt-3 border-t border-slate-800 space-y-1.5">
              <label className="text-xs text-slate-400">Add Custom Filename:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. sample_scan.png"
                  value={newFileEntry}
                  onChange={(e) => setNewFileEntry(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Python Code Snippet */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400">
              <div className="text-[10px] uppercase text-slate-500 mb-1 font-sans">Python Code:</div>
              <span className="text-indigo-400">from</span> pytoolkit.files <span className="text-indigo-400">import</span> batch_rename
              <br />
              <span className="text-cyan-400">batch_rename</span>(
              <br />
              &nbsp;&nbsp;files=[...],
              <br />
              {template ? <>&nbsp;&nbsp;template=<span className="text-emerald-400">"{template}"</span>,<br /></> : null}
              {findPattern ? <>&nbsp;&nbsp;pattern=<span className="text-emerald-400">"{findPattern}"</span>,<br />&nbsp;&nbsp;replacement=<span className="text-emerald-400">"{replaceWith}"</span>,<br /></> : null}
              &nbsp;&nbsp;dry_run=<span className="text-pink-400">False</span>
              <br />)
            </div>
          </div>

          {/* Real-Time Preview Table */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Transformation Preview ({renamePlan.length} files)
                </span>
                {clashCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <AlertCircle className="w-3 h-3" />
                    {clashCount} Name Collision Detected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="w-3 h-3" />
                    Clean & Collision-Free
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-5">Original File Name</th>
                    <th className="py-3 px-5">New Target Name</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {renamePlan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-5 text-slate-400">{item.original}</td>
                      <td className={`py-3 px-5 font-semibold ${item.status === 'clash' ? 'text-rose-400 bg-rose-500/5' : 'text-cyan-300'}`}>
                        {item.renamed}
                      </td>
                      <td className="py-3 px-5 font-sans">
                        {item.status === 'clash' && (
                          <span className="text-rose-400 font-semibold text-[11px]">⚠️ Collision</span>
                        )}
                        {item.status === 'ok' && (
                          <span className="text-emerald-400 text-[11px]">✓ Renamed</span>
                        )}
                        {item.status === 'unchanged' && (
                          <span className="text-slate-500 text-[11px]">Unchanged</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2 & 3: DUPLICATE FINDER & HASH LAB */}
      {(activeSubTab === 'duplicates' || activeSubTab === 'hash_calc') && (
        <div className="space-y-6">
          {/* File Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-2xl p-8 text-center bg-slate-900/40 transition-colors">
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">
              Drop Files to Compute Real Checksums & Detect Duplicates
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Computes real cryptographic hashes in-browser (zero server uploads) using Web Crypto API to benchmark PyToolkit algorithms.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                Select Local Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Algorithm:</span>
                <select
                  value={hashingAlgorithm}
                  onChange={(e) => setHashingAlgorithm(e.target.value as any)}
                  aria-label="Cryptographic hash algorithm"
                  className="bg-transparent text-cyan-400 font-mono font-bold focus:outline-none"
                >
                  <option value="SHA-256">SHA-256</option>
                  <option value="SHA-1">SHA-1</option>
                  <option value="MD5">MD5</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Computed Checksums & Duplicate Clusters
              </span>
              {uploadedFiles.length > 0 && (
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear List
                </button>
              )}
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No files loaded yet. Click the upload button above or drop files to inspect their checksums.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-5">File Name</th>
                      <th className="py-3 px-5">Size</th>
                      <th className="py-3 px-5">{hashingAlgorithm} Checksum</th>
                      <th className="py-3 px-5">Duplicate Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {uploadedFiles.map((file, idx) => {
                      const duplicates = uploadedFiles.filter(
                        (f) => f.hash === file.hash && f.name !== file.name
                      );
                      const isDuplicate = duplicates.length > 0;

                      return (
                        <tr key={idx} className={isDuplicate ? 'bg-amber-500/5' : 'hover:bg-slate-800/40'}>
                          <td className="py-3 px-5 font-bold text-slate-200">{file.name}</td>
                          <td className="py-3 px-5 text-slate-400 tabular-nums">{formatBytes(file.size)}</td>
                          <td className="py-3 px-5 text-cyan-400 truncate max-w-xs">{file.hash}</td>
                          <td className="py-3 px-5 font-sans">
                            {isDuplicate ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                                ⚠️ Duplicate of {duplicates.map((d) => d.name).join(', ')}
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-400 font-medium">
                                ✓ Unique
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
