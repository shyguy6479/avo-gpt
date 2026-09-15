import React from 'react';
import { Star, Quote } from 'lucide-react';
import { TESTIMONIALS_DATA } from '../data/landingData';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-white dark:bg-black text-black dark:text-white relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold uppercase tracking-wider">
            User Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white tracking-tight">
            Loved by Designers & Engineers
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            See how innovative teams rely on AVO AI for daily workflow acceleration.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS_DATA.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 sm:p-8 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center space-x-1 mb-4 text-amber-500 dark:text-zinc-300">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 dark:fill-zinc-300 text-amber-500 dark:text-zinc-300" />
                  ))}
                </div>

                <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed italic mb-6">
                  "{t.content}"
                </p>
              </div>

              {/* User Profile Footer */}
              <div className="flex items-center space-x-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
                />
                <div>
                  <h4 className="font-bold text-sm text-black dark:text-white">{t.name}</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.role} • <span className="font-semibold text-zinc-800 dark:text-zinc-300">{t.company}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
