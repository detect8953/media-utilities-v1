import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { CodeViewer } from './components/CodeViewer';
import { ApiReferenceView } from './components/ApiReferenceView';
import { DirectoryLab } from './components/DirectoryLab';
import { FileLab } from './components/FileLab';
import { ImageLab } from './components/ImageLab';
import { PipelineBuilder } from './components/PipelineBuilder';
import { TestRunner } from './components/TestRunner';
import { ExportModal } from './components/ExportModal';
import { QuickstartModal } from './components/QuickstartModal';
import {
  FolderTree,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  Download,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isQuickstartModalOpen, setIsQuickstartModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenQuickstart={() => setIsQuickstartModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'explorer' && (
          <CodeViewer onOpenQuickstart={() => setIsQuickstartModalOpen(true)} />
        )}

        {activeTab === 'docs' && <ApiReferenceView />}

        {activeTab === 'directory_lab' && <DirectoryLab />}

        {activeTab === 'file_lab' && <FileLab />}

        {activeTab === 'image_lab' && <ImageLab />}

        {activeTab === 'pipeline_builder' && <PipelineBuilder />}

        {activeTab === 'tests' && <TestRunner />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PyToolkit</span>
            <span aria-hidden="true">·</span>
            <span>Production Python Utility Procedures</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => setActiveTab('docs')}
              className="hover:text-slate-300 transition-colors"
            >
              API Reference
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className="hover:text-slate-300 transition-colors"
            >
              Test Suite
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Export Package (.zip)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <QuickstartModal
        isOpen={isQuickstartModalOpen}
        onClose={() => setIsQuickstartModalOpen(false)}
      />
    </div>
  );
}
