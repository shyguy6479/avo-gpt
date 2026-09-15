import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Sun,
  Moon,
  CheckCircle,
  Home,
} from 'lucide-react';
import { NexusLogo } from '../NexusLogo';
import { PricingSection } from './PricingSection';
import { RazorpayPaymentModal } from '../modals/RazorpayPaymentModal';
import { Footer } from '../Footer';
import { useAuth } from '../../hooks/useAuth';

interface PricingPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  isDarkMode,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUserPlan } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [razorpayPlanInfo, setRazorpayPlanInfo] = useState<{ planName: string; amount: string }>({
    planName: 'AVO AI PRO (monthly)',
    amount: '₹999',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenRazorpay = (planName: string, amount: string) => {
    setRazorpayPlanInfo({ planName, amount });
    setIsRazorpayOpen(true);
  };

  const handlePaymentSuccess = () => {
    const upper = razorpayPlanInfo.planName.toUpperCase();
    const targetPlan = upper.includes('MAX') ? 'Max' : upper.includes('BUSINESS') ? 'Business' : 'Pro';
    updateUserPlan(targetPlan);
    setIsRazorpayOpen(false);
    showToast(`🎉 Upgraded successfully to ${razorpayPlanInfo.planName}! All premium features are now unlocked.`);
    setTimeout(() => {
      navigate('/chat');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 dark:border-zinc-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NexusLogo onClick={() => navigate('/')} />
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <span className="font-semibold text-zinc-900 dark:text-white">Pricing & Plans</span>
              <span>•</span>
              <span>Indian Rupee (₹) Checkout</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Toggle Appearance Theme"
            >
              {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-zinc-700" />}
            </button>

            {/* Back to Chat button */}
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300/80 dark:border-zinc-700 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <MessageSquare size={14} className="text-blue-500" />
              <span>Go to Chat</span>
            </button>

            {/* Back to Home */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Home size={14} />
              <span>Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Breadcrumb / Back Link */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-200 font-semibold">Pricing & Plan Features</span>
        </div>

        {/* Full Interactive Pricing Section */}
        <PricingSection
          onOpenRazorpay={handleOpenRazorpay}
          onShowToast={showToast}
          onStartChat={() => navigate('/chat')}
          currentPlan={user?.plan || 'FREE'}
          isStandalonePage={true}
        />
      </main>

      {/* Footer */}
      <Footer onStartChat={() => navigate('/chat')} />

      {/* Razorpay Payment Modal */}
      <RazorpayPaymentModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        planName={razorpayPlanInfo.planName}
        amount={razorpayPlanInfo.amount}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
