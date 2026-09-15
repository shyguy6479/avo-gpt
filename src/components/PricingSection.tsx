import React from 'react';
import { PricingSection as DetailedPricingSection } from './pricing/PricingSection';

interface PricingSectionProps {
  onStartChat: () => void;
  onOpenRazorpay?: (planName: string, amount: string) => void;
  onShowToast?: (msg: string) => void;
  currentPlan?: string;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onStartChat,
  onOpenRazorpay,
  onShowToast,
  currentPlan = 'FREE',
}) => {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-200 border-t border-b border-zinc-200/60 dark:border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DetailedPricingSection
          onStartChat={onStartChat}
          onOpenRazorpay={onOpenRazorpay}
          onShowToast={onShowToast}
          currentPlan={currentPlan}
        />
      </div>
    </section>
  );
};

