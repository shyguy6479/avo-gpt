import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, ShieldCheck, Cpu, Layers } from 'lucide-react';
import { CouncilLog } from '../types';

interface CouncilLogViewProps {
  councilLogs: CouncilLog[];
  category?: string;
  isStreaming?: boolean;
}

export const CouncilLogView: React.FC<CouncilLogViewProps> = ({
  councilLogs,
  category,
  isStreaming = false
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (!councilLogs || councilLogs.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg border border-purple-900/40 bg-purple-950/20 text-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-purple-300 hover:bg-purple-900/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 font-medium">
          <Layers className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>AI Council Verification ({councilLogs.length} Models & Steps)</span>
          {category && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-200 uppercase tracking-wider">
              {category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-purple-400 text-[11px]">
          <span>{isOpen ? 'Hide details' : 'Show details'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-purple-900/40 space-y-2 bg-zinc-950/50">
          <div className="text-[11px] text-zinc-400 mb-2">
            Parallel multi-model analysis & synthesis judge execution log:
          </div>
          <div className="space-y-1.5">
            {councilLogs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded bg-zinc-900/60 border border-zinc-800/80"
              >
                <div className="mt-0.5">
                  {log.status === 'verified' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : log.status === 'compared' ? (
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-200">{log.model}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{log.provider}</span>
                  </div>
                  {log.summary && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">{log.summary}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
