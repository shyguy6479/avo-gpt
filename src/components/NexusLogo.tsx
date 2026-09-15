import React, { useState, useEffect } from 'react';

export const NexusSparkle: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="avo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#a1a1aa" />
        <stop offset="100%" stopColor="#27272a" />
      </linearGradient>
      <linearGradient id="avo-star" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f4f4f5" />
        <stop offset="50%" stopColor="#71717a" />
        <stop offset="100%" stopColor="#18181b" />
      </linearGradient>
    </defs>
    <path
      d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
      fill="url(#avo-star)"
    />
  </svg>
);

export const GeminiSparkle = NexusSparkle;

export const COMPANY_NAME_VARIANTS = [
  { name: 'AVO', ai: 'AI', lang: 'English', code: 'en' },
  { name: 'एवो', ai: 'एआई', lang: 'हिंदी', code: 'hi' },
  { name: 'అవో', ai: 'ఏఐ', lang: 'తెలుగు', code: 'te' },
  { name: 'ಎವೋ', ai: 'ಎಐ', lang: 'ಕನ್ನಡ', code: 'kn' },
  { name: 'ஏவோ', ai: 'ஏஐ', lang: 'தமிழ்', code: 'ta' },
  { name: 'എവോ', ai: 'എഐ', lang: 'മലയാളം', code: 'ml' },
];

export const NexusLogoIcon: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}> = ({ size = 'sm', className = '', animate = false }) => {
  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4.5 h-4.5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${iconSizes[size]} text-zinc-800 dark:text-zinc-200 ${
          animate ? 'animate-spin' : 'animate-logo-float'
        }`}
      >
        <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
      </svg>
    </div>
  );
};

interface NexusLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  autoRotateLanguage?: boolean;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = 'md',
  className = '',
  onClick,
  autoRotateLanguage = false,
}) => {
  const [langIndex, setLangIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!autoRotateLanguage) return;
    let fadeTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setIsFading(true);
      fadeTimeout = setTimeout(() => {
        setLangIndex((prev) => (prev + 1) % COMPANY_NAME_VARIANTS.length);
        setIsFading(false);
      }, 250);
    }, 3500);
    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [autoRotateLanguage]);

  const current = COMPANY_NAME_VARIANTS[langIndex];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const aiTextSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
    >
      {/* AVO AI Clean Text with smooth auto language rotation in 100% sync */}
      <div
        className={`flex items-center gap-1.5 font-sans transition-all duration-300 transform ${
          isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <span className={`font-black font-space tracking-tight ${textSizes[size]} text-zinc-900 dark:text-white`}>
          {autoRotateLanguage ? current.name : 'AVO'}
        </span>
        <span className={`font-bold font-outfit tracking-wider ${aiTextSizes[size]} text-zinc-500 dark:text-zinc-400 animate-blink`}>
          {autoRotateLanguage ? current.ai : 'AI'}
        </span>
      </div>
    </div>
  );
};

