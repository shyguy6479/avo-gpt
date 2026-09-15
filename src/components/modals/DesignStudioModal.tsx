import React from 'react';
import { X, Palette, Sparkles, Layout, Monitor, Layers, ArrowRight } from 'lucide-react';

interface DesignStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateDesign: (prompt: string) => void;
}

export const DesignStudioModal: React.FC<DesignStudioModalProps> = ({
  isOpen,
  onClose,
  onGenerateDesign
}) => {
  if (!isOpen) return null;

  const PRESETS = [
    {
      title: 'Modern Dashboard Layout',
      desc: 'Responsive dark/light sidebar dashboard with analytics charts and metrics.',
      prompt: 'Design a high-contrast responsive Dashboard component using React, Tailwind CSS, Lucide icons, and Recharts.'
    },
    {
      title: 'SaaS Pricing Grid',
      desc: '3-tier pricing card comparison section with toggleable annual discount pill.',
      prompt: 'Design an elegant SaaS Pricing page with Monthly/Yearly toggle, recommended tier badge, and feature checklist using React and Tailwind CSS.'
    },
    {
      title: 'Live Chat Workspace Interface',
      desc: 'Desktop-class chat view with side panel, code syntax viewer, and command bar.',
      prompt: 'Design a sleek desktop AI chat interface with message threads, code blocks, and model dropdown using React and Tailwind CSS.'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200">
              <Palette className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">AI UI Design Studio</h3>
              <p className="text-xs text-zinc-400">Generate production-ready React Tailwind UI components directly in chat.</p>
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
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-zinc-300">Select a design archetype to launch directly into the AI workspace:</p>

          <div className="space-y-3">
            {PRESETS.map((preset, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{preset.title}</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1">{preset.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onGenerateDesign(preset.prompt);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md"
                >
                  <span>Generate Component</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
