import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Layers,
  Zap
} from 'lucide-react';

interface RoutingConfig {
  fastModePrimary: string;
  fastModeFallback: string;
  smartModePrimary: string;
  smartModeFallback: string;
  deepModeCouncil: string[];
  fallbackTimeoutMs: number;
}

export const AdminAiRouting: React.FC = () => {
  const [config, setConfig] = useState<RoutingConfig>({
    fastModePrimary: 'gemini-3.6-flash',
    fastModeFallback: 'llama-3.3-70b',
    smartModePrimary: 'gemini-3.6-flash',
    smartModeFallback: 'gpt-4o',
    deepModeCouncil: ['gemini-3.6-flash', 'gpt-4o', 'llama-3.3-70b', 'deepseek-r1'],
    fallbackTimeoutMs: 4000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/routing', {
      headers: { 'x-admin-key': 'avo-master-admin-token' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.fastModePrimary) setConfig(data);
      })
      .catch((err) => console.warn('Using default routing config:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/routing', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'avo-master-admin-token',
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Failed to update routing');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="admin-ai-routing-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">AI Routing & Consensus</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Orchestration rules, dynamic fallback chains, and multi-model council weights.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-xs font-mono text-[#ffffff] transition-colors disabled:opacity-50 self-start"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-[#18181b] border border-[#3f3f46] text-xs font-mono text-[#ffffff] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#ffffff]" />
          <span>Routing configuration committed to active runtime pipeline.</span>
        </div>
      )}

      {/* Modes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fast Mode */}
        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#ffffff]" />
            <h3 className="text-sm font-semibold text-white">Fast Mode</h3>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Optimized for lowest time-to-first-token. Answers simple queries instantly.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-mono text-[#71717a] uppercase">Primary Model</label>
              <select
                value={config.fastModePrimary}
                onChange={(e) => setConfig({ ...config, fastModePrimary: e.target.value })}
                className="w-full mt-1 bg-[#09090b] border border-[#27272a] rounded px-2.5 py-1.5 text-white font-mono"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fastest)</option>
                <option value="llama-3.3-70b">NVIDIA Llama 3.3 70B</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#71717a] uppercase">Fallback Model</label>
              <select
                value={config.fastModeFallback}
                onChange={(e) => setConfig({ ...config, fastModeFallback: e.target.value })}
                className="w-full mt-1 bg-[#09090b] border border-[#27272a] rounded px-2.5 py-1.5 text-white font-mono"
              >
                <option value="llama-3.3-70b">NVIDIA Llama 3.3 70B</option>
                <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
              </select>
            </div>
          </div>
        </div>

        {/* Smart Mode */}
        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffffff]" />
            <h3 className="text-sm font-semibold text-white">Smart Mode (Default)</h3>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Balances high-speed streaming with reasoning verification and web grounding.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-mono text-[#71717a] uppercase">Primary Model</label>
              <select
                value={config.smartModePrimary}
                onChange={(e) => setConfig({ ...config, smartModePrimary: e.target.value })}
                className="w-full mt-1 bg-[#09090b] border border-[#27272a] rounded px-2.5 py-1.5 text-white font-mono"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Grounding + Speed)</option>
                <option value="gpt-4o">OpenAI GPT-4o</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#71717a] uppercase">Fallback Model</label>
              <select
                value={config.smartModeFallback}
                onChange={(e) => setConfig({ ...config, smartModeFallback: e.target.value })}
                className="w-full mt-1 bg-[#09090b] border border-[#27272a] rounded px-2.5 py-1.5 text-white font-mono"
              >
                <option value="gpt-4o">OpenAI GPT-4o</option>
                <option value="llama-3.3-70b">NVIDIA Llama 3.3 70B</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deep Mode */}
        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#ffffff]" />
            <h3 className="text-sm font-semibold text-white">Deep Council Mode</h3>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Runs multi-model deliberation across 4 engines and synthesizes highest consensus.
          </p>

          <div className="space-y-2 text-xs">
            <label className="text-[10px] font-mono text-[#71717a] uppercase">Council Participants</label>
            {[
              { id: 'gemini-3.6-flash', label: 'Google Gemini 3.6 Flash' },
              { id: 'gpt-4o', label: 'OpenAI GPT-4o' },
              { id: 'llama-3.3-70b', label: 'NVIDIA Llama 3.3' },
              { id: 'deepseek-r1', label: 'OpenRouter DeepSeek-R1' },
            ].map((p) => {
              const active = config.deepModeCouncil.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    const next = active
                      ? config.deepModeCouncil.filter((c) => c !== p.id)
                      : [...config.deepModeCouncil, p.id];
                    if (next.length > 0) setConfig({ ...config, deepModeCouncil: next });
                  }}
                  className={`p-2 rounded border cursor-pointer font-mono text-[11px] flex items-center justify-between ${
                    active
                      ? 'bg-[#18181b] border-[#3f3f46] text-[#ffffff]'
                      : 'bg-[#09090b] border-[#27272a] text-[#a1a1aa]'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="text-[10px]">{active ? 'ACTIVE' : 'OFF'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Latency & Timeout Settings */}
      <div className="p-5 rounded-lg bg-[#09090b] border border-[#27272a] space-y-4">
        <h3 className="text-xs font-mono font-semibold text-[#e4e4e7] uppercase tracking-wider">
          FAILOVER THRESHOLD & TIMEOUT
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-white font-medium">Automatic Fallback Timeout</span>
            <p className="text-[11px] text-[#a1a1aa]">
              If the primary model does not emit the first token within this threshold, stream redirects to secondary model.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <input
              type="range"
              min="1500"
              max="8000"
              step="500"
              value={config.fallbackTimeoutMs}
              onChange={(e) => setConfig({ ...config, fallbackTimeoutMs: Number(e.target.value) })}
              className="w-36 accent-[#ffffff]"
            />
            <span className="text-[#ffffff] font-bold w-14 text-right">
              {config.fallbackTimeoutMs}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
