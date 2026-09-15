import React from 'react';
import { Keyboard, X, Command, CornerDownLeft, ArrowUp, ArrowDown, Copy, FileText, Sparkles, Search } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Navigation & Palette',
      shortcuts: [
        { key: '⌘ / Ctrl + K', description: 'Open Command Palette', icon: <Command className="w-3.5 h-3.5 text-zinc-300" /> },
        { key: 'Esc', description: 'Clear focus / Dismiss modals & palette', icon: <X className="w-3.5 h-3.5 text-zinc-400" /> },
        { key: '⌘ / Ctrl + /', description: 'Toggle Sidebar navigation', icon: <Search className="w-3.5 h-3.5 text-zinc-400" /> }
      ]
    },
    {
      title: 'Composer & Input Controls',
      shortcuts: [
        { key: '⌘ / Ctrl + Enter', description: 'Send message immediately', icon: <CornerDownLeft className="w-3.5 h-3.5 text-zinc-300" /> },
        { key: 'Enter', description: 'Send message (single line)', icon: <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400" /> },
        { key: 'Shift + Enter', description: 'Insert new line in prompt text', icon: <Sparkles className="w-3.5 h-3.5 text-zinc-300" /> },
        { key: 'Up Arrow (↑)', description: 'Recall & edit previous user message (when prompt is empty)', icon: <ArrowUp className="w-3.5 h-3.5 text-zinc-400" /> },
        { key: 'Down Arrow (↓)', description: 'Clear recalled prompt draft', icon: <ArrowDown className="w-3.5 h-3.5 text-zinc-400" /> }
      ]
    },
    {
      title: 'Chat Operations',
      shortcuts: [
        { key: '⌘ / Ctrl + Shift + C', description: 'Copy active message text', icon: <Copy className="w-3.5 h-3.5 text-zinc-300" /> },
        { key: '⌘ / Ctrl + Shift + E', description: 'Export conversation as PDF report', icon: <FileText className="w-3.5 h-3.5 text-zinc-300" /> }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-black dark:text-white">Keyboard Shortcuts Cheat Sheet</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Power-user key bindings for ultra-fast chat navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-5">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{group.title}</h4>
              <div className="grid grid-cols-1 gap-2">
                {group.shortcuts.map((sc, scIdx) => (
                  <div
                    key={scIdx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-100 dark:border-zinc-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                      {sc.icon}
                      <span>{sc.description}</span>
                    </div>
                    <kbd className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200 shadow-2xs">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/40 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Esc</kbd> anytime to exit</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
