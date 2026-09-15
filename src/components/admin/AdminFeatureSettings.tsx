import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  Sparkles,
  Search,
  Layers,
  Image,
  Volume2,
  FileText,
  Code2,
  RefreshCw
} from 'lucide-react';

interface FeatureFlags {
  deepResearchMode: boolean;
  imageGeneration: boolean;
  councilDebate: boolean;
  webSearchGrounding: boolean;
  speechSynthesizer: boolean;
  pdfDocumentAnalysis: boolean;
  codeExecutionSandbox: boolean;
}

export const AdminFeatureSettings: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlags>({
    deepResearchMode: true,
    imageGeneration: true,
    councilDebate: true,
    webSearchGrounding: true,
    speechSynthesizer: true,
    pdfDocumentAnalysis: true,
    codeExecutionSandbox: false,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/feature-flags', {
      headers: { 'x-admin-key': 'avo-master-admin-token' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) setFlags(data);
      })
      .catch((err) => console.warn('Using default feature flags:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleFlag = async (key: keyof FeatureFlags) => {
    setUpdating(key);
    const updatedValue = !flags[key];
    const newFlags = { ...flags, [key]: updatedValue };
    setFlags(newFlags);

    try {
      await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'avo-master-admin-token',
        },
        body: JSON.stringify({ [key]: updatedValue }),
      });
    } catch (err) {
      console.warn('Failed to persist flag to server:', err);
    } finally {
      setUpdating(null);
    }
  };

  const featureItems: {
    key: keyof FeatureFlags;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'webSearchGrounding',
      title: 'Web Search Grounding',
      desc: 'Allows Gemini models to retrieve real-time Google Search context and live facts.',
      icon: Search,
    },
    {
      key: 'councilDebate',
      title: 'Multi-Model Council Debate',
      desc: 'Enables consensus reasoning across Gemini, GPT-4o, and Llama 3.3 for deep queries.',
      icon: Layers,
    },
    {
      key: 'imageGeneration',
      title: 'AI Image Generation',
      desc: 'Allows users to generate visual concepts via the /api/generate-image backend pipeline.',
      icon: Image,
    },
    {
      key: 'deepResearchMode',
      title: 'Deep Research Synthesis',
      desc: 'Multi-step web extraction, citation parsing, and comprehensive report generation.',
      icon: Sparkles,
    },
    {
      key: 'speechSynthesizer',
      title: 'Speech Synthesis (TTS)',
      desc: 'Browser-side and server-side text-to-speech audio rendering for chat answers.',
      icon: Volume2,
    },
    {
      key: 'pdfDocumentAnalysis',
      title: 'PDF & File Multimodal Parser',
      desc: 'Allows users to upload PDFs, text files, and images into the chat context.',
      icon: FileText,
    },
    {
      key: 'codeExecutionSandbox',
      title: 'Code Execution Sandbox (Experimental)',
      desc: 'Isolated runner for Python and JavaScript snippets generated in assistant responses.',
      icon: Code2,
    },
  ];

  return (
    <div id="admin-feature-settings-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Feature Settings</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Globally enable or disable capabilities in the user application in real time without redeploying.
          </p>
        </div>
      </div>

      {/* Feature Toggles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featureItems.map((item) => {
          const Icon = item.icon;
          const enabled = flags[item.key];
          const isUpdating = updating === item.key;

          return (
            <div
              key={item.key}
              className="p-5 rounded-lg bg-[#09090b] border border-[#27272a] flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    enabled
                      ? 'bg-[#18181b] border-[#3f3f46] text-[#ffffff]'
                      : 'bg-[#000000] border-[#27272a] text-[#71717a]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">{item.desc}</p>
                  <div className="mt-2 text-[10px] font-mono text-[#71717a]">
                    KEY: <span className="text-[#a1a1aa]">{item.key}</span>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleFlag(item.key)}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabled ? 'bg-[#ffffff]' : 'bg-[#27272a]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
