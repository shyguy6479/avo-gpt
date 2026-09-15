import React, { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ArrowRight, ShieldCheck, Zap, Sparkles, CheckCircle2, Command, Terminal, Cpu } from 'lucide-react';
import { Fallback3DCanvas } from './ui/splite';

const HeroAnimation = lazy(() => import('./HeroAnimation'));

interface HeroProps {
  onStartChat: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartChat }) => {
  return (
    <section className="relative w-full min-h-[90vh] lg:min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center overflow-hidden pt-12 pb-20 lg:py-0">
      
      {/* 1. Procedural Film Grain Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 2. Soft Ambient Vignette & Glowing Radial Accent */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-zinc-200/50 dark:from-zinc-900/30 via-zinc-100/30 dark:via-zinc-950/20 to-transparent rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-radial-vignette opacity-80" />
      </div>

      {/* 3. Right Side Interactive 3D Canvas (occupies ~55% right on desktop) */}
      <div className="absolute inset-0 lg:left-[42%] w-full lg:w-[58%] h-full pointer-events-auto z-0 overflow-hidden flex items-center justify-center">
        <Suspense fallback={<Fallback3DCanvas />}>
          <HeroAnimation />
        </Suspense>
        
        {/* Soft edge gradients to seamlessly blend 3D canvas with the backdrop */}
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-white dark:from-black to-transparent pointer-events-none hidden lg:block z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white dark:from-black to-transparent pointer-events-none z-10" />
      </div>

      {/* 4. Left Side Hero Copy & Controls (Occupies left 45% on desktop, centered on mobile) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[75vh]">
          
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-7 py-6">

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-black dark:text-white font-sans"
            >
              Intelligence <br />
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
                Redefined for
              </span> <br />
              <span className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-400 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                Developers.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg lg:text-xl text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal pt-4 sm:pt-0"
            >
              An ultra-low latency AI platform powered by deep contextual synthesis, instant vision OCR, structured code execution, and high-fidelity speech reasoning.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3.5 w-full sm:w-auto pt-8 sm:pt-4"
            >
              {/* Primary Call To Action */}
              <div className="relative inline-flex items-center justify-center group cursor-pointer w-full sm:w-auto shrink-0">
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-white/30 via-zinc-400/20 to-white/30 opacity-75 blur-xs animate-pulse-glow pointer-events-none group-hover:opacity-100 transition-opacity" />
                <div className="relative p-[1.5px] rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-105 w-full sm:w-auto">
                  <div className="absolute -inset-[300%] bg-[conic-gradient(from_0deg,#ffffff,#d4d4d8,#a1a1aa,#ffffff)] animate-border-spin" />
                  <button
                    onClick={onStartChat}
                    className="relative w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-[10px] bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 font-bold text-sm sm:text-base shadow-2xl transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer overflow-hidden whitespace-nowrap"
                  >
                    {/* Localized Shimmer Beam Sweep */}
                    <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent animate-btn-shimmer pointer-events-none" />

                    <MessageSquare className="w-4 h-4 text-white dark:text-black relative z-10 shrink-0" />
                    <span className="tracking-tight text-white dark:text-black font-bold relative z-10 whitespace-nowrap">Start Building Now</span>
                    <ArrowRight className="w-4 h-4 text-white dark:text-black group-hover:translate-x-1 transition-transform relative z-10 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Secondary Button */}
              <button
                type="button"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-800/90 bg-zinc-100 dark:bg-zinc-950/80 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-900 font-semibold text-sm sm:text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-xl group cursor-pointer whitespace-nowrap shrink-0"
              >
                <Terminal className="w-4 h-4 text-zinc-600 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-zinc-200 transition-colors shrink-0" />
                <span className="whitespace-nowrap">Explore Platform</span>
              </button>
            </motion.div>

          </div>

          {/* Right column placeholder space on large screens (canvas renders behind) */}
          <div className="hidden lg:block lg:col-span-6 h-full min-h-[500px] pointer-events-none" />

        </div>
      </div>
    </section>
  );
};
