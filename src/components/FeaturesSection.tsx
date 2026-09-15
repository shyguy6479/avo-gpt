import React from 'react';
import { motion } from 'motion/react';
import {
  MessageSquareText,
  Image as ImageIcon,
  Mic,
  FileText,
  Zap,
  Globe,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { FEATURES_DATA } from '../data/landingData';

const iconMap: Record<string, React.ReactNode> = {
  MessageSquareText: <MessageSquareText className="w-6 h-6 text-zinc-900 dark:text-white" />,
  Image: <ImageIcon className="w-6 h-6 text-zinc-900 dark:text-zinc-200" />,
  Mic: <Mic className="w-6 h-6 text-zinc-900 dark:text-zinc-200" />,
  FileText: <FileText className="w-6 h-6 text-zinc-900 dark:text-zinc-200" />,
  Zap: <Zap className="w-6 h-6 text-zinc-900 dark:text-white" />,
  Globe: <Globe className="w-6 h-6 text-zinc-900 dark:text-zinc-200" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-zinc-900 dark:text-zinc-200" />,
  Clock: <Clock className="w-6 h-6 text-zinc-900 dark:text-zinc-200" />
};

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 md:py-28 relative bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold tracking-wide uppercase">
            Powerful Intelligence
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Designed for Modern Workflows
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            Every feature is engineered to provide instant clarity, flawless context, and maximum productivity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES_DATA.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header with Icon and optional badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 group-hover:scale-110 transition-transform duration-200">
                    {iconMap[feature.icon] || <Zap className="w-6 h-6 text-zinc-900 dark:text-white" />}
                  </div>
                  {feature.badge && (
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                      {feature.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-black dark:text-white mb-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bottom Subtle Accent Bar on Hover */}
              <div className="mt-6 h-1 w-0 group-hover:w-full bg-gradient-to-r from-zinc-500 to-zinc-200 rounded-full transition-all duration-300" />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
