import React, { useState } from 'react';
import { X, Shapes, Code, Image, FileText, Search, Copy, Check, Download, ExternalLink } from 'lucide-react';

interface ArtifactItem {
  id: string;
  title: string;
  type: 'code' | 'image' | 'markdown' | 'table';
  content: string;
  language?: string;
  createdAt: string;
}

interface ArtifactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const ArtifactsModal: React.FC<ArtifactsModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'code' | 'image' | 'markdown'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const MOCK_ARTIFACTS: ArtifactItem[] = [
    {
      id: 'art-1',
      title: 'useStreamingText Custom Hook',
      type: 'code',
      language: 'typescript',
      content: `export function useStreamingText() {\n  const textRef = useRef("");\n  return textRef;\n}`,
      createdAt: 'Just now'
    },
    {
      id: 'art-2',
      title: 'Dark Mode Glassmorphism Card Component',
      type: 'code',
      language: 'tsx',
      content: `<div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl backdrop-blur-md">...</div>`,
      createdAt: '10 mins ago'
    },
    {
      id: 'art-3',
      title: 'Full-Stack Express + Vite Architecture Diagram',
      type: 'markdown',
      content: `| Layer | Technology | Port |\n|---|---|---|\n| Frontend | React + Tailwind | 3000 |\n| Backend | Express ESM | 3000 |`,
      createdAt: '1 hour ago'
    }
  ];

  const filtered = MOCK_ARTIFACTS.filter((art) => {
    const matchesFilter = filterType === 'all' || art.type === filterType;
    const matchesSearch = art.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Artifact copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200">
              <Shapes className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Artifacts & Code Gallery</h3>
              <p className="text-xs text-zinc-400">Inspect, search, and export generated code blocks and UI designs.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Search & Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search artifacts by name or keyword..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
              {(['all', 'code', 'markdown'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    filterType === t
                      ? 'bg-white text-black shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Artifacts List */}
          <div className="space-y-3">
            {filtered.map((art) => (
              <div key={art.id} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{art.title}</span>
                    <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">{art.language || art.type}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">{art.createdAt}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(art.id, art.content)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Copy artifact code"
                    >
                      {copiedId === art.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-32">
                  <pre>{art.content}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
