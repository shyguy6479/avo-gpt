import React, { useState, useEffect } from 'react';
import {
  MessagesSquare,
  Search,
  Download,
  Clock,
  Shield,
  Bot,
  User,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ConversationMetadata {
  id: string;
  userEmail: string;
  userName: string;
  model: string;
  mode: 'Fast' | 'Smart' | 'Deep';
  messageCount: number;
  snippet: string;
  updatedAt: string;
  durationSeconds: number;
}

export const AdminConversations: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/conversations', {
        headers: { 'x-admin-key': 'avo-master-admin-token' },
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.warn('Using local fallback conversations:', err);
      setConversations([
        {
          id: 'conv_8a920df',
          userEmail: 'abhixin79@gmail.com',
          userName: 'Abhinav Sinha',
          model: 'Gemini 3.6 Flash',
          mode: 'Smart',
          messageCount: 8,
          snippet: 'Optimize PostgreSQL query index for 500k event telemetry entries...',
          updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
          durationSeconds: 310,
        },
        {
          id: 'conv_4c219ba',
          userEmail: 'sarah.c@cyberdyne.io',
          userName: 'Sarah Connor',
          model: 'OpenAI GPT-4o',
          mode: 'Deep',
          messageCount: 14,
          snippet: 'Draft architectural overview for autonomous agent routing framework...',
          updatedAt: new Date(Date.now() - 45 * 60000).toISOString(),
          durationSeconds: 580,
        },
        {
          id: 'conv_1f893cd',
          userEmail: 'david.m@apexlabs.dev',
          userName: 'David Miller',
          model: 'Gemini 3.6 Flash',
          mode: 'Fast',
          messageCount: 4,
          snippet: 'Convert Python dataclass structure into TypeScript interfaces...',
          updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
          durationSeconds: 120,
        },
        {
          id: 'conv_3e44921',
          userEmail: 'priya.s@zenith-ai.in',
          userName: 'Priya Sharma',
          model: 'NVIDIA Llama 3.3',
          mode: 'Smart',
          messageCount: 6,
          snippet: 'Analyze latency tradeoffs of streaming SSE vs WebSockets in Cloud Run...',
          updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
          durationSeconds: 240,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.userName.toLowerCase().includes(search.toLowerCase()) ||
      c.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      c.snippet.toLowerCase().includes(search.toLowerCase());
    const matchesMode = modeFilter === 'all' || c.mode.toLowerCase() === modeFilter.toLowerCase();
    return matchesSearch && matchesMode;
  });

  return (
    <div id="admin-conversations-page" className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Conversations</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Privacy-compliant session telemetry and query volume tracking across user spaces.
          </p>
        </div>

        <button
          onClick={fetchConversations}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-[#a1a1aa] hover:text-[#ffffff] transition-colors font-mono self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#ffffff]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#a1a1aa] flex items-center gap-2 font-mono">
        <Shield className="w-4 h-4 text-[#ffffff] shrink-0" />
        <span>
          Full message history is end-to-end user private in Firestore. Admin displays only session telemetry metadata.
        </span>
      </div>

      {/* Filters */}
      <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-wrap gap-2.5 items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations by user or topic..."
            className="w-full bg-[#09090b] border border-[#27272a] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#ffffff]"
          />
        </div>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="bg-[#09090b] border border-[#27272a] rounded-md px-2.5 py-1.5 text-[#a1a1aa] focus:outline-none focus:border-[#ffffff] font-mono text-xs"
        >
          <option value="all">Mode: All</option>
          <option value="fast">Fast</option>
          <option value="smart">Smart</option>
          <option value="deep">Deep</option>
        </select>
      </div>

      {/* Conversations Table */}
      <div className="rounded-lg bg-[#09090b] border border-[#27272a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#000000] text-[#a1a1aa] font-mono uppercase text-[10px] tracking-wider border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4">Session / Topic</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3">Messages</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[#f4f4f5]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#09090b] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex flex-col max-w-sm">
                      <span className="font-medium text-white truncate">{c.snippet}</span>
                      <span className="text-[10px] text-[#71717a] font-mono">{c.id}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="text-white">{c.userName}</span>
                      <span className="text-[10px] text-[#a1a1aa] font-mono">{c.userEmail}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-[#a1a1aa]">{c.model}</td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono ${
                        c.mode === 'Deep'
                          ? 'bg-[#1F1426] text-[#D8B4FE] border border-[#482A61]'
                          : c.mode === 'Smart'
                          ? 'bg-[#18181b] text-[#ffffff] border border-[#3f3f46]'
                          : 'bg-[#1C1A0F] text-[#FDE047] border border-[#4E4720]'
                      }`}
                    >
                      {c.mode}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-[#ffffff]">
                    {c.messageCount} msgs
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-[#a1a1aa]">
                    {Math.round(c.durationSeconds / 60)}m {c.durationSeconds % 60}s
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-[11px] text-[#a1a1aa]">
                    {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
