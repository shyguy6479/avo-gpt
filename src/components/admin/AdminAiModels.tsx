import React, { useState, useEffect } from 'react';
import {
  Boxes,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';

export interface ModelItem {
  id: string;
  name: string;
  provider: 'Google AI' | 'OpenAI' | 'NVIDIA' | 'OpenRouter' | 'AVO Core';
  modelKey: string;
  status: 'active' | 'disabled' | 'degraded';
  priority: number;
  isDefault: boolean;
  requestsCount: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  allowedPlans: ('Free' | 'Pro' | 'Enterprise')[];
  contextWindow: string;
  costPer1kTokens: string;
}

export const AdminAiModels: React.FC = () => {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-models', {
        headers: { 'x-admin-key': 'avo-master-admin-token' },
      });
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      setModels(data);
    } catch (err) {
      console.warn('Using local fallback model state:', err);
      setModels([
        {
          id: 'gemini-3.6-flash',
          name: 'Gemini 3.6 Flash',
          provider: 'Google AI',
          modelKey: 'gemini-3.6-flash',
          status: 'active',
          priority: 1,
          isDefault: true,
          requestsCount: 428,
          avgLatencyMs: 420,
          errorRatePercent: 0.12,
          allowedPlans: ['Free', 'Pro', 'Enterprise'],
          contextWindow: '1,000,000 tokens',
          costPer1kTokens: '$0.0001',
        },
        {
          id: 'gpt-4o',
          name: 'OpenAI GPT-4o',
          provider: 'OpenAI',
          modelKey: 'gpt-4o',
          status: 'active',
          priority: 2,
          isDefault: false,
          requestsCount: 184,
          avgLatencyMs: 640,
          errorRatePercent: 0.45,
          allowedPlans: ['Pro', 'Enterprise'],
          contextWindow: '128,000 tokens',
          costPer1kTokens: '$0.0025',
        },
        {
          id: 'llama-3.3-70b',
          name: 'NVIDIA Llama 3.3 70B',
          provider: 'NVIDIA',
          modelKey: 'llama-3.3-70b-instruct',
          status: 'active',
          priority: 3,
          isDefault: false,
          requestsCount: 96,
          avgLatencyMs: 380,
          errorRatePercent: 0.21,
          allowedPlans: ['Pro', 'Enterprise'],
          contextWindow: '128,000 tokens',
          costPer1kTokens: '$0.0007',
        },
        {
          id: 'deepseek-r1',
          name: 'DeepSeek-R1 (Distill)',
          provider: 'OpenRouter',
          modelKey: 'deepseek/deepseek-r1',
          status: 'active',
          priority: 4,
          isDefault: false,
          requestsCount: 72,
          avgLatencyMs: 850,
          errorRatePercent: 0.8,
          allowedPlans: ['Pro', 'Enterprise'],
          contextWindow: '64,000 tokens',
          costPer1kTokens: '$0.0008',
        },
        {
          id: 'avo-reasoning-judge',
          name: 'AVO Consensus Judge',
          provider: 'AVO Core',
          modelKey: 'avo-council-v2',
          status: 'active',
          priority: 1,
          isDefault: false,
          requestsCount: 65,
          avgLatencyMs: 310,
          errorRatePercent: 0.0,
          allowedPlans: ['Pro', 'Enterprise'],
          contextWindow: '128,000 tokens',
          costPer1kTokens: 'Internal',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const updateModel = async (id: string, updates: Partial<ModelItem>) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/ai-models/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'avo-master-admin-token',
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();

      setModels((prev) =>
        prev.map((m) => {
          if (updates.isDefault && m.id !== id) {
            return { ...m, isDefault: false };
          }
          return m.id === id ? updated : m;
        })
      );

      setSaveBanner(`Model ${updated.name} updated successfully.`);
      setTimeout(() => setSaveBanner(null), 3500);
    } catch (err: any) {
      alert(`Error updating model: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div id="admin-ai-models-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">AI Models</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Configure model availability, routing priorities, and plan restrictions in the shared AI engine.
          </p>
        </div>

        <button
          onClick={fetchModels}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-[#a1a1aa] hover:text-[#ffffff] transition-colors font-mono self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {saveBanner && (
        <div className="p-3 rounded-lg bg-[#18181b] border border-[#3f3f46] text-xs font-mono text-[#ffffff] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#ffffff]" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Models Table */}
      <div className="rounded-lg bg-[#09090b] border border-[#27272a] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#000000] text-[#a1a1aa] font-mono uppercase text-[10px] tracking-wider border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4">Model & Provider</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Default</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3">Plan Access</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[#f4f4f5]">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-[#09090b] transition-colors">
                  {/* Name & Provider */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{model.name}</span>
                        {model.isDefault && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#18181b] text-[#ffffff] border border-[#27272a]">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#a1a1aa] font-mono">
                        <span>{model.provider}</span>
                        <span>·</span>
                        <span>{model.contextWindow}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-3">
                    <button
                      onClick={() =>
                        updateModel(model.id, {
                          status: model.status === 'active' ? 'disabled' : 'active',
                        })
                      }
                      disabled={updatingId === model.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                        model.status === 'active'
                          ? 'bg-[#18181b] text-[#ffffff] border border-[#3f3f46]'
                          : 'bg-[#1C0F0F] text-[#F87171] border border-[#441E1E]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          model.status === 'active' ? 'bg-[#ffffff]' : 'bg-[#F87171]'
                        }`}
                      />
                      {model.status.toUpperCase()}
                    </button>
                  </td>

                  {/* Priority Selector */}
                  <td className="py-3.5 px-3">
                    <select
                      value={model.priority}
                      onChange={(e) =>
                        updateModel(model.id, { priority: Number(e.target.value) })
                      }
                      disabled={updatingId === model.id}
                      className="bg-[#09090b] border border-[#27272a] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#ffffff]"
                    >
                      <option value={1}>1 (Highest)</option>
                      <option value={2}>2 (High)</option>
                      <option value={3}>3 (Normal)</option>
                      <option value={4}>4 (Fallback)</option>
                    </select>
                  </td>

                  {/* Set as Default */}
                  <td className="py-3.5 px-3">
                    {model.isDefault ? (
                      <span className="text-[#ffffff] flex items-center gap-1 font-mono text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => updateModel(model.id, { isDefault: true })}
                        disabled={updatingId === model.id}
                        className="text-[11px] text-[#a1a1aa] hover:text-[#ffffff] font-mono underline"
                      >
                        Make default
                      </button>
                    )}
                  </td>

                  {/* Latency */}
                  <td className="py-3.5 px-3 font-mono text-[11px] text-[#a1a1aa]">
                    {model.avgLatencyMs}ms
                  </td>

                  {/* Plan Access Pills */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {(['Free', 'Pro', 'Enterprise'] as const).map((tier) => {
                        const hasAccess = model.allowedPlans.includes(tier);
                        return (
                          <button
                            key={tier}
                            onClick={() => {
                              const newPlans = hasAccess
                                ? model.allowedPlans.filter((p) => p !== tier)
                                : [...model.allowedPlans, tier];
                              if (newPlans.length > 0) {
                                updateModel(model.id, { allowedPlans: newPlans });
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${
                              hasAccess
                                ? 'bg-[#18181b] text-[#ffffff] border border-[#3f3f46]'
                                : 'bg-[#09090b] text-[#71717a] border border-[#27272a] opacity-40 line-through'
                            }`}
                          >
                            {tier}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() =>
                        updateModel(model.id, {
                          status: model.status === 'active' ? 'disabled' : 'active',
                        })
                      }
                      className="text-[11px] font-mono text-[#a1a1aa] hover:text-[#ffffff] transition-colors"
                    >
                      {model.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
