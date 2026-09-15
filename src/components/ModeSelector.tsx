import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type EffortLevel = 'low' | 'medium' | 'high' | 'ultra';
export type OrchestrationMode = EffortLevel;

export interface EffortTier {
  id: EffortLevel;
  label: string;
  badge: string;
  tagline: string;
  description: string;
  level: number; // 1 to 4
}

export const EFFORT_TIERS: EffortTier[] = [
  {
    id: 'low',
    label: 'Low',
    badge: 'Quick',
    tagline: 'Fast & concise',
    description: 'Direct response with essential takeaways and minimal elaboration.',
    level: 1
  },
  {
    id: 'medium',
    label: 'Medium',
    badge: 'Balanced',
    tagline: 'Balanced research',
    description: 'Structured research on a medium basis for the topic with core findings.',
    level: 2
  },
  {
    id: 'high',
    label: 'High',
    badge: 'In-Depth',
    tagline: 'Comprehensive analysis',
    description: 'Thorough investigation covering multi-angle analysis and edge cases.',
    level: 3
  },
  {
    id: 'ultra',
    label: 'Ultra',
    badge: 'Exhaustive',
    tagline: 'Deep-dive synthesis',
    description: 'Maximum research rigor with granular breakdown across all dimensions.',
    level: 4
  }
];

// Human-crafted 4-bar minimalist effort gauge icon with smooth height transitions
export const EffortGaugeIcon: React.FC<{ level: number; className?: string }> = ({ level, className = 'w-3.5 h-3.5' }) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="10"
        width="2.5"
        height="5"
        rx="1"
        className={`transition-colors duration-200 ${
          level >= 1 ? 'fill-zinc-900 dark:fill-zinc-100' : 'fill-zinc-300 dark:fill-zinc-700'
        }`}
      />
      <rect
        x="5"
        y="7.5"
        width="2.5"
        height="7.5"
        rx="1"
        className={`transition-colors duration-200 ${
          level >= 2 ? 'fill-zinc-900 dark:fill-zinc-100' : 'fill-zinc-300 dark:fill-zinc-700'
        }`}
      />
      <rect
        x="8.5"
        y="4.5"
        width="2.5"
        height="10.5"
        rx="1"
        className={`transition-colors duration-200 ${
          level >= 3 ? 'fill-zinc-900 dark:fill-zinc-100' : 'fill-zinc-300 dark:fill-zinc-700'
        }`}
      />
      <rect
        x="12"
        y="1.5"
        width="2.5"
        height="13.5"
        rx="1"
        className={`transition-colors duration-200 ${
          level >= 4 ? 'fill-zinc-900 dark:fill-zinc-100' : 'fill-zinc-300 dark:fill-zinc-700'
        }`}
      />
    </svg>
  );
};

interface EffortSelectorProps {
  selectedEffort?: EffortLevel;
  selectedMode?: any;
  onSelectEffort?: (effort: EffortLevel) => void;
  onSelectMode?: (mode: any) => void;
  disabled?: boolean;
}

export const EffortSelector: React.FC<EffortSelectorProps> = ({
  selectedEffort,
  selectedMode,
  onSelectEffort,
  onSelectMode,
  disabled = false
}) => {
  const currentEffort: EffortLevel = (selectedEffort || (selectedMode as EffortLevel) || 'medium');
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredTier, setHoveredTier] = useState<EffortLevel | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeTier = EFFORT_TIERS.find((t) => t.id === currentEffort) || EFFORT_TIERS[1];
  const previewTier = hoveredTier ? EFFORT_TIERS.find((t) => t.id === hoveredTier) || activeTier : activeTier;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const popoverWidth = isMobile ? Math.min(window.innerWidth - 24, 250) : 280;

    // Align right edge with button right edge, clamped inside window
    let left = rect.right - popoverWidth;
    if (left < 12) left = 12;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }

    // Position securely above the button (with 6px gap)
    const bottom = window.innerHeight - rect.top + 6;

    setPopoverStyle({
      position: 'fixed',
      bottom: `${Math.max(bottom, 12)}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      maxHeight: 'min(380px, 75vh)',
      zIndex: 99999
    });
  }, []);

  const openMenu = () => {
    if (disabled) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
  };

  const closeMenuWithDelay = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredTier(null);
    }, 200);
  };

  const handleSelect = (id: EffortLevel) => {
    if (onSelectEffort) onSelectEffort(id);
    if (onSelectMode) onSelectMode(id);
    setIsOpen(false);
    setHoveredTier(null);
  };

  // Recalculate position on scroll or resize while open
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const onReposition = () => updatePosition();
      window.addEventListener('resize', onReposition);
      window.addEventListener('scroll', onReposition, true);
      return () => {
        window.removeEventListener('resize', onReposition);
        window.removeEventListener('scroll', onReposition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Click outside to dismiss
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        setHoveredTier(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative inline-flex items-center">
      {/* Human-Designed Effort Pill Button with Tactile Press Motion */}
      <motion.button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            setHoveredTier(null);
          } else {
            openMenu();
          }
        }}
        onMouseEnter={openMenu}
        onMouseLeave={closeMenuWithDelay}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Thinking Effort: Hover to adjust (Low, Medium, High, Ultra)"
        className={`group relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none border ${
          isOpen
            ? 'bg-zinc-200/90 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 shadow-sm'
            : 'bg-zinc-100 text-zinc-700 border-zinc-200/80 hover:bg-zinc-200/70 hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60 dark:hover:bg-zinc-700/70 dark:hover:text-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <EffortGaugeIcon level={activeTier.level} className="w-3.5 h-3.5 shrink-0" />
        
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hidden md:inline">
          Effort
        </span>

        <span className="text-zinc-300 dark:text-zinc-600 font-normal hidden md:inline">·</span>

        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px] sm:text-xs">
          {activeTier.label}
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="flex items-center shrink-0"
        >
          <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
        </motion.div>
      </motion.button>

      {/* Fluid Portal Popover Menu with Spring Transitions */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              role="menu"
              aria-orientation="vertical"
              onMouseEnter={openMenu}
              onMouseLeave={closeMenuWithDelay}
              style={popoverStyle}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 30,
                mass: 0.75
              }}
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-[#18181b]/95 border border-zinc-200/90 dark:border-zinc-800 shadow-2xl backdrop-blur-xl select-none overflow-hidden"
            >
              {/* Refined Header with Dynamic Interactive Gauge Preview */}
              <div className="flex items-center justify-between px-2 py-1 mb-0.5 border-b border-zinc-100 dark:border-zinc-800/70">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
                    Research Effort
                  </span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60 tabular-nums transition-colors duration-150">
                    Level {previewTier.level}/4
                  </span>
                </div>

                {/* Visual 4-step progress bars that organically mirror previewed level */}
                <div className="flex items-end gap-1 h-3.5 px-1" title={`Level ${previewTier.level} of 4`}>
                  {[1, 2, 3, 4].map((lvl) => {
                    const isFilled = lvl <= previewTier.level;
                    return (
                      <div
                        key={lvl}
                        className={`w-1 rounded-full transition-all duration-200 ${
                          lvl === 1 ? 'h-2' : lvl === 2 ? 'h-2.5' : lvl === 3 ? 'h-3' : 'h-3.5'
                        } ${
                          isFilled
                            ? 'bg-zinc-900 dark:bg-zinc-100 scale-y-105'
                            : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Options List with Apple/Linear-style Fluid Sliding Hover Highlight */}
              <div
                className="space-y-0.5 sm:space-y-1 relative"
                onMouseLeave={() => setHoveredTier(null)}
              >
                {EFFORT_TIERS.map((tier) => {
                  const isSelected = tier.id === currentEffort;
                  const isHovered = hoveredTier === tier.id;

                  return (
                    <motion.button
                      key={tier.id}
                      type="button"
                      onClick={() => handleSelect(tier.id)}
                      onMouseEnter={() => setHoveredTier(tier.id)}
                      whileTap={{ scale: 0.985 }}
                      className="group relative w-full flex items-center sm:items-start gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-left cursor-pointer select-none transition-colors duration-150"
                    >
                      {/* Fluid Sliding Background Highlight Pill */}
                      {isHovered && (
                        <motion.div
                          layoutId="effort-hover-pill"
                          className="absolute inset-0 rounded-lg sm:rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 shadow-2xs border border-zinc-200/60 dark:border-zinc-700/60"
                          initial={false}
                          transition={{
                            type: 'spring',
                            stiffness: 480,
                            damping: 34,
                            mass: 0.6
                          }}
                        />
                      )}

                      {/* Quiet Active Ring if selected and not currently hovered */}
                      {isSelected && !isHovered && (
                        <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-zinc-100/60 dark:bg-zinc-800/40 ring-1 ring-zinc-200/80 dark:ring-zinc-700/70" />
                      )}

                      {/* Micro Visual Gauge */}
                      <div
                        className={`relative z-10 p-1 sm:p-1.5 rounded-md sm:rounded-lg shrink-0 transition-colors duration-200 ${
                          isSelected
                            ? 'bg-white dark:bg-zinc-900 shadow-2xs text-zinc-900 dark:text-white ring-1 ring-zinc-200/60 dark:ring-zinc-700/50'
                            : 'bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 group-hover:bg-white/80 dark:group-hover:bg-zinc-900/80'
                        }`}
                      >
                        <EffortGaugeIcon level={tier.level} className="w-3.5 h-3.5" />
                      </div>

                      {/* Content Typography */}
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-xs font-semibold transition-colors duration-150 ${
                                isSelected
                                  ? 'text-zinc-900 dark:text-white'
                                  : 'text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white'
                              }`}
                            >
                              {tier.label}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal truncate">
                              · {tier.tagline}
                            </span>
                          </div>

                          <span
                            className={`text-[8.5px] sm:text-[9px] px-1.5 py-0.5 rounded-md font-medium tracking-tight transition-colors duration-150 shrink-0 ${
                              isSelected
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 group-hover:bg-zinc-200/70 dark:group-hover:bg-zinc-700/60'
                            }`}
                          >
                            {tier.badge}
                          </span>
                        </div>

                        {/* Description: Shown on desktop/larger screens to keep mobile popover ultra-compact */}
                        <p
                          className={`hidden sm:block text-[11px] leading-snug mt-0.5 font-normal transition-colors duration-150 ${
                            isSelected
                              ? 'text-zinc-600 dark:text-zinc-300'
                              : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                          }`}
                        >
                          {tier.description}
                        </p>
                      </div>

                      {/* Active Check Indicator with Spring Pop */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="relative z-10 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Sub-footer detail (Desktop only) */}
              <div className="hidden sm:flex mt-1.5 pt-1.5 px-2 border-t border-zinc-100 dark:border-zinc-800/60 items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                <span>Select thinking depth</span>
                <span className="font-mono text-[9px] text-zinc-400 dark:text-zinc-500">
                  {currentEffort === 'medium' ? 'medium-basis' : `${currentEffort} effort`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export const ModeSelector = EffortSelector;
