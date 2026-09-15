import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Sparkles, Check, Code, Cpu, Sliders, Palette, Zap, Image as ImageIcon, Ratio } from 'lucide-react';
import { safeLocalStorageSetItem } from '../../lib/safeStorage';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSaveSystemPrompt: (prompt: string) => void;
  codeTheme: string;
  onSaveCodeTheme: (theme: string) => void;
  showToast: (msg: string) => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  onSaveSystemPrompt,
  codeTheme,
  onSaveCodeTheme,
  showToast
}) => {
  const [promptInput, setPromptInput] = useState(systemPrompt || '');
  const [selectedPersona, setSelectedPersona] = useState<string>('architect');
  const [activeTheme, setActiveTheme] = useState(codeTheme || 'github-dark');
  const [reasoningEffort, setReasoningEffort] = useState<'fast' | 'balanced' | 'deep'>('balanced');
  const [imageAspectRatio, setImageAspectRatio] = useState<string>(() => localStorage.getItem('nexus_ai_image_aspect_ratio') || '1:1');
  const [imageStyle, setImageStyle] = useState<string>(() => localStorage.getItem('nexus_ai_image_style') || 'cinematic');

  useEffect(() => {
    setPromptInput(systemPrompt || '');
  }, [systemPrompt]);

  useEffect(() => {
    setActiveTheme(codeTheme || 'github-dark');
  }, [codeTheme]);

  if (!isOpen) return null;

  const PERSONA_PRESETS = [
    {
      id: 'architect',
      name: 'Senior Systems Architect',
      desc: 'Provides structured, production-grade typescript and clean system designs.',
      prompt: 'You are an expert Senior Systems Architect. Provide well-structured, production-ready code with clean typing, modular boundaries, and concise technical summaries.'
    },
    {
      id: 'code-specialist',
      name: 'Full-Stack Code Specialist',
      desc: 'Focuses heavily on React, Tailwind CSS, high 60fps performance, and error handling.',
      prompt: 'You are a Full-Stack Code Specialist. Return clean React JSX, Tailwind CSS utility classes, and optimized state management without conversational fluff.'
    },
    {
      id: 'creative',
      name: 'Creative UI/UX Designer',
      desc: 'Emphasizes visual craft, dark/light mode balance, and micro-interactions.',
      prompt: 'You are a Creative UI/UX Designer. Focus on elegant visual aesthetics, mathematical padding scales, dark mode balance, and sleek responsive design.'
    },
    {
      id: 'concise',
      name: 'Concise & Fast Assistant',
      desc: 'Delivers rapid, direct answers and code snippets without long introductions.',
      prompt: 'Be extremely concise. Give direct code solutions or short bullet points immediately.'
    }
  ];

  const CODE_THEMES = [
    { id: 'github-dark', name: 'Dark Syntax' },
    { id: 'monokai', name: 'Monokai Pro' },
    { id: 'one-dark-pro', name: 'One Dark Pro' },
    { id: 'dracula', name: 'Dracula Theme' },
    { id: 'synthwave', name: 'Synthwave 84' },
    { id: 'nord', name: 'Nord Frost' }
  ];

  const ASPECT_RATIOS = [
    { id: '1:1', label: '1:1 Square' },
    { id: '16:9', label: '16:9 Widescreen' },
    { id: '4:5', label: '4:5 Portrait' },
    { id: '9:16', label: '9:16 Story/Vertical' },
    { id: '4:3', label: '4:3 Standard' }
  ];

  const IMAGE_STYLES = [
    { id: 'cinematic', name: '🎬 Cinematic', desc: 'Filmic depth, dramatic 8k render' },
    { id: 'photorealistic', name: '📷 Photorealistic', desc: 'Ultra-realistic 8k camera shot' },
    { id: 'anime', name: '✨ Anime / Illustration', desc: 'Studio anime, clean artwork' },
    { id: '3d-render', name: '🧊 3D Octane Render', desc: 'Raytraced volumetric shadows' },
    { id: 'digital-art', name: '🎨 Digital Art', desc: 'Masterpiece painterly strokes' },
    { id: 'minimalist', name: '📐 Minimalist', desc: 'Clean vector balance' }
  ];

  const handleApply = () => {
    onSaveSystemPrompt(promptInput);
    onSaveCodeTheme(activeTheme);
    safeLocalStorageSetItem('nexus_ai_image_aspect_ratio', imageAspectRatio);
    safeLocalStorageSetItem('nexus_ai_image_style', imageStyle);
    showToast('Customization & image preferences updated!');
    onClose();
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
              <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Workspace Customization & System Prompt</h3>
              <p className="text-xs text-zinc-400">Tailor AI response persona, code formatting, and system parameters.</p>
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Preset Personas */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Persona Presets</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PERSONA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPersona(preset.id);
                    setPromptInput(preset.prompt);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPersona === preset.id
                      ? 'bg-zinc-900 border-emerald-500/80 text-white shadow-md'
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                      {selectedPersona === preset.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{preset.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* System Instructions TextArea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Custom System Instructions</label>
              <button
                type="button"
                onClick={() => setPromptInput('')}
                className="text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            </div>
            <textarea
              rows={4}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Always output code using TypeScript and Tailwind CSS. Prefer concise technical explanations."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Code Theme Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-400" /> Code Syntax Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CODE_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setActiveTheme(theme.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    activeTheme === theme.id
                      ? 'bg-zinc-900 border-emerald-500 text-emerald-400 shadow-sm'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{theme.name}</span>
                  {activeTheme === theme.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Image Generation Aspect Ratio */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Ratio className="w-4 h-4 text-emerald-400" /> Default Image Aspect Ratio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setImageAspectRatio(ratio.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                    imageAspectRatio === ratio.id
                      ? 'bg-zinc-900 border-emerald-500 text-emerald-400 shadow-sm'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div>{ratio.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Style Preference */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-400" /> Image Generation Style Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {IMAGE_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setImageStyle(style.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    imageStyle === style.id
                      ? 'bg-zinc-900 border-emerald-500 text-white shadow-sm'
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{style.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{style.desc}</div>
                  </div>
                  {imageStyle === style.id && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Reasoning Effort */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Reasoning Effort & Speed
            </label>
            <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-1 text-xs">
              {(['fast', 'balanced', 'deep'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setReasoningEffort(mode)}
                  className={`flex-1 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    reasoningEffort === mode
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {mode} Reasoning
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs cursor-pointer transition-all shadow-md"
            >
              Save Customizations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
