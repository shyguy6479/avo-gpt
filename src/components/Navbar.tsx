import React from 'react';
import { Sun, Moon, ArrowRight, MessageSquare } from 'lucide-react';
import { NexusLogo } from './NexusLogo';

interface NavbarProps {
  onStartChat: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onStartChat,
  isDarkMode,
  onToggleTheme,
  activeSection,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-colors duration-200 text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <NexusLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
          {[
            { id: 'features', label: 'Features' },
            { id: 'preview', label: 'Live Demo' },
            { id: 'why-us', label: 'Why Us' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'faq', label: 'FAQ' },
          ].map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                title={`Navigate to ${item.label} section`}
                className={`relative px-3.5 py-1.5 rounded-xl transition-all duration-300 cursor-pointer shadow-2xs hover:shadow-md hover:shadow-zinc-950/20 hover:scale-[1.02] active:scale-95 ${
                  isActive
                    ? 'text-black dark:text-white bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/70 border border-transparent hover:border-zinc-300/60 dark:hover:border-zinc-700/60'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle light and dark theme"
            className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800/90 hover:border-zinc-400 dark:hover:border-zinc-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none cursor-pointer shadow-xs hover:shadow-md hover:shadow-zinc-950/40 group"
            title={isDarkMode ? 'Switch to Light Appearance Mode' : 'Switch to Dark Appearance Mode'}
          >
            {isDarkMode ? (
              <Sun size={18} strokeWidth={2} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
            ) : (
              <Moon size={18} strokeWidth={2} className="text-zinc-700 dark:text-zinc-300 group-hover:-rotate-12 transition-transform duration-300 shrink-0" />
            )}
          </button>

          {/* Primary CTA with animated perimeter and shimmer sweep */}
          <div className="relative inline-flex items-center justify-center group cursor-pointer" title="Launch AVO AI Chat Workspace">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-white/30 via-zinc-400/20 to-white/30 opacity-75 blur-xs animate-pulse-glow pointer-events-none group-hover:opacity-100 group-hover:blur-sm transition-all duration-300" />
            <div className="relative p-[2px] rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-[1.02] active:scale-95">
              <div className="absolute -inset-[300%] bg-[conic-gradient(from_0deg,#ffffff,#d4d4d8,#a1a1aa,#ffffff)] animate-border-spin" />
              <button
                onClick={onStartChat}
                className="relative px-4 py-2 rounded-[10px] bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 font-semibold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer overflow-hidden shadow-lg group-hover:shadow-xl group-hover:shadow-white/10 dark:group-hover:shadow-white/20"
              >
                {/* Localized Shimmer Beam Sweep */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent animate-btn-shimmer pointer-events-none" />

                <MessageSquare size={18} strokeWidth={2} className="text-white dark:text-black relative z-10 shrink-0" />
                <span className="text-white dark:text-black relative z-10 font-bold">Start Chat</span>
                <ArrowRight size={18} strokeWidth={2} className="text-white dark:text-black opacity-80 group-hover:translate-x-1 transition-transform duration-300 relative z-10 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
