import React, { useState } from 'react';
import { Search, Copy, Check, Terminal, BookOpen, Layers } from 'lucide-react';
import { API_PROCEDURES, ApiProcedure } from '../data/apiDocs';

export const ApiReferenceView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const categories = ['All', 'Directories', 'Files', 'Images', 'Pipelines'];

  const filteredProcedures = API_PROCEDURES.filter((proc) => {
    const matchesCat = activeCategory === 'All' || proc.category === activeCategory;
    const matchesQuery =
      proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>API Reference</span>
          <span aria-hidden="true">·</span>
          <span>Version 1.0.0</span>
          <span aria-hidden="true">·</span>
          <span>Type Annotations Included</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5">
          Procedures & Modules Index
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Detailed signatures, parameter descriptions, exception invariants, and runnable code examples for all PyToolkit procedures.
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by procedure name, tag, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Procedures List */}
      <div className="space-y-6">
        {filteredProcedures.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">No procedures found matching "{searchQuery}".</p>
          </div>
        ) : (
          filteredProcedures.map((proc, idx) => (
            <div
              key={proc.name}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-colors space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span className="text-cyan-400">{proc.module}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proc.category}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1 font-mono">
                    {proc.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {proc.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {proc.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Signature Block */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                <code>{proc.signature}</code>
              </div>

              {/* Parameters Table */}
              {proc.parameters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Parameters
                  </div>
                  <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/50">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                          <th className="py-2.5 px-4 font-medium">Name</th>
                          <th className="py-2.5 px-4 font-medium">Type</th>
                          <th className="py-2.5 px-4 font-medium">Default</th>
                          <th className="py-2.5 px-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {proc.parameters.map((p) => (
                          <tr key={p.name} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-4 font-bold text-slate-200">{p.name}</td>
                            <td className="py-2.5 px-4 text-cyan-400">{p.type}</td>
                            <td className="py-2.5 px-4 text-slate-500">{p.default || 'required'}</td>
                            <td className="py-2.5 px-4 text-slate-300 font-sans">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Return Value */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  Returns:
                </span>
                <span className="font-mono text-cyan-400 font-medium">
                  {proc.returns.type}
                </span>
                <span className="text-slate-400">
                  — {proc.returns.description}
                </span>
              </div>

              {/* Example Code Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Example Usage
                  </span>
                  <button
                    onClick={() => handleCopy(proc.example, idx)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy snippet</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  <pre>{proc.example}</pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
