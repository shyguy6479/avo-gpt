import React from 'react';
import { ShieldCheck, Cpu, Sparkles, Layers, Lock, Gauge, CheckCircle2 } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  return (
    <section id="why-us" className="py-20 md:py-28 relative bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold uppercase tracking-wider">
            Built Different
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Why Teams Choose AVO AI
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            Engineered from the ground up for zero distraction, unmatched typographic rhythm, and enterprise privacy.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Feature Breakdown */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-800 shrink-0">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                  Sub-Second Token Delivery
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Our serverless edge infrastructure connects directly to high-throughput AVO AI models, eliminating waiting times and UI stutter during complex streaming tasks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-800 shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                  Contextual Memory & Multimodal Vision
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Upload screenshots, wireframes, codebases, or complex PDFs without losing chat history context. AVO AI retains deep thread memory.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-300 dark:border-zinc-800 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                  Zero Data Retention Assurance
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Your enterprise data, API secrets, and uploaded documents are encrypted in transit and never used to train third-party public models.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Feature Comparison Card */}
          <div className="rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 mb-6">
              <span className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> Architectural Comparison
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                99.99% Uptime
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Generic AI Chatbots</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Cluttered UI, high latency, generic templates</p>
                </div>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 rounded-md">Slow</span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider mb-0.5">AVO AI Engine</p>
                  <p className="text-sm font-semibold text-black dark:text-white">Handcrafted, Apple-inspired minimal precision</p>
                </div>
                <span className="text-xs font-bold text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-200" /> Optimal
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Client Render: 60 FPS</span>
              <span>Memory Overhead: &lt;12MB</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
