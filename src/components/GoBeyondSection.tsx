import React from 'react';
import { ArrowRight, Sparkles, HelpCircle, ShieldCheck, Zap, Code, Globe, AlertTriangle, FileText, Sliders, BarChart3, CheckCircle, BookOpen } from 'lucide-react';
import { GoBeyondSuggestion } from '../types';

interface GoBeyondSectionProps {
  suggestions: GoBeyondSuggestion[];
  onSelectSuggestion: (prompt: string) => void;
}

export const GoBeyondSection: React.FC<GoBeyondSectionProps> = ({
  suggestions,
  onSelectSuggestion
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'HelpCircle': return <HelpCircle className="w-3.5 h-3.5 text-blue-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Zap': return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'Code': return <Code className="w-3.5 h-3.5 text-purple-400" />;
      case 'Globe': return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'AlertTriangle': return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'FileText': return <FileText className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Sliders': return <Sliders className="w-3.5 h-3.5 text-violet-400" />;
      case 'BarChart3': return <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'BookOpen': return <BookOpen className="w-3.5 h-3.5 text-sky-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-zinc-800/80">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>Go Beyond →</span>
        <span className="text-[10px] text-zinc-500 font-normal ml-1">Contextual Next Steps</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSuggestion(item.prompt)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-150 cursor-pointer shadow-sm text-left"
          >
            {renderIcon(item.icon)}
            <span className="font-medium">{item.label}</span>
            <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
};
