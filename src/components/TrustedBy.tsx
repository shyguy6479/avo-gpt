import React from 'react';

export const TrustedBy: React.FC = () => {
  const companies = [
    { name: 'LINEAR', font: 'font-mono font-bold text-lg tracking-tighter' },
    { name: 'VERCEL', font: 'font-sans font-black tracking-widest text-base' },
    { name: 'STRIPE', font: 'font-serif font-bold tracking-tight text-lg' },
    { name: 'NOTION', font: 'font-mono font-extrabold text-lg' },
    { name: 'RAYCAST', font: 'font-sans font-bold tracking-wider text-base' },
    { name: 'FIGMA', font: 'font-sans font-extrabold tracking-tight text-lg' },
  ];

  return (
    <section className="py-12 border-y border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-black text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold tracking-widest text-zinc-600 dark:text-zinc-400 uppercase mb-8">
          Trusted by product design & engineering teams worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16 opacity-90 hover:opacity-100 transition-opacity">
          {companies.map((company, idx) => (
            <div
              key={idx}
              className={`text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors duration-200 select-none cursor-default ${company.font}`}
            >
              {company.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

