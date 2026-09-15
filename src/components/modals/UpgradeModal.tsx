import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Check,
  Lock,
  ArrowRight,
  Shield,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { PricingSection } from '../pricing/PricingSection';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: (planName: string) => void;
  onOpenRazorpay?: (planName: string, amount: string) => void;
  onOpenSeparatePricingPage?: () => void;
  targetPlan?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
  onOpenRazorpay,
  onOpenSeparatePricingPage,
  targetPlan
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState<'PRO' | 'MAX'>(
    targetPlan?.toUpperCase().includes('MAX') ? 'MAX' : 'PRO'
  );

  if (!isOpen) return null;

  const handleCheckout = (planName: string, amount: string) => {
    onClose();
    if (onOpenRazorpay) {
      onOpenRazorpay(planName, amount);
    } else {
      onUpgradeSuccess(planName);
    }
  };

  const isPro = activePlanTab === 'PRO';
  const planName = isPro ? 'AVO AI PRO Plan' : 'AVO AI MAX Plan';
  const monthlyAmount = isPro ? '999' : '2499';
  const annualAmount = isPro ? '9588' : '23988';
  const selectedAmount = billingCycle === 'monthly' ? monthlyAmount : annualAmount;
  const displayPrice = billingCycle === 'monthly' 
    ? (isPro ? '₹999' : '₹2,499') 
    : (isPro ? '₹799' : '₹1,999');

  const proFeatures = [
    'Unlock AVO 4o Pro, AVO Flash & AVO Omni Models',
    'Sub-100ms Priority Response Server Queue',
    'Interactive Code Sandbox & Browser Live Preview',
    'PDF, Scanned Docs & High-Resolution Image Vision OCR',
    '2,000 High-Capacity Messages per month',
    '1 Million Token Extended Conversation Context'
  ];

  const maxFeatures = [
    'Everything in Pro Plan included',
    'AVO Deep Thinker Formal Logic & Reasoning Engine',
    'Full Codebase & Repository AST Graph Analysis',
    'Developer API Access & Webhooks Integration',
    'Native GitHub & CI/CD Pipeline Push',
    '5,000 High-Capacity Messages per month'
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden text-zinc-100 max-h-[92vh] flex flex-col my-0 sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-700/80" />
        </div>

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Unlock Frontier Intelligence
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider">
                  Razorpay
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Instant activation with Indian Rupee (₹) • UPI, Cards & NetBanking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800 shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {!showFullCatalog ? (
            <>
              {/* Plan Switcher Tabs (PRO vs MAX) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActivePlanTab('PRO')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isPro
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>PRO Plan</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-md font-semibold">Popular</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePlanTab('MAX')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isPro
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>MAX Plan</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-semibold">Power</span>
                </button>
              </div>

              {/* Billing Cycle Selector */}
              <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-xs text-zinc-300 font-medium">Billing Period:</span>
                <div className="inline-flex p-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-zinc-800 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      billingCycle === 'annual'
                        ? 'bg-zinc-800 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Highlighted Plan Card */}
              <div className="relative rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-900/50 border border-zinc-800 p-5 space-y-4 shadow-lg">
                <div className="flex items-baseline justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      {isPro ? 'Pro Intelligence' : 'Maximum Frontier Power'}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                      {displayPrice}
                      <span className="text-xs text-zinc-400 font-normal"> / month</span>
                    </div>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Save 20% Billed Annually
                      </span>
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    What's Unlocked:
                  </div>
                  {(isPro ? proFeatures : maxFeatures).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-zinc-200">
                      <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleCheckout(planName, selectedAmount)}
                    className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm cursor-pointer transition-all shadow-xl hover:shadow-white/10 active:scale-[0.99] flex items-center justify-center gap-2 group"
                  >
                    <span>Upgrade to {isPro ? 'Pro' : 'Max'} with Razorpay</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-400 mt-2.5">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      Instant Activation
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-zinc-400" />
                      UPI / GPay / Cards
                    </span>
                    <span>•</span>
                    <span>Cancel Anytime</span>
                  </div>
                </div>
              </div>

              {/* Toggle to compare all plans */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowFullCatalog(true)}
                  className="text-xs text-zinc-400 hover:text-white font-semibold transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer p-1"
                >
                  <span>Compare Free, Pro, Max & Enterprise Plans</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowFullCatalog(false)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>← Back to Quick Upgrade</span>
                </button>
                {onOpenSeparatePricingPage && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSeparatePricingPage();
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in Full Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <PricingSection
                isModal={true}
                onOpenRazorpay={(plan, amt) => handleCheckout(plan, amt)}
                onShowToast={(msg) => onUpgradeSuccess(msg)}
                currentPlan="FREE"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
