import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { TrustedBy } from './TrustedBy';
import { FeaturesSection } from './FeaturesSection';
import { LiveChatPreview } from './LiveChatPreview';
import { WhyChooseUs } from './WhyChooseUs';
import { Testimonials } from './Testimonials';
import { PricingSection } from './PricingSection';
import { FaqSection } from './FaqSection';
import { Footer } from './Footer';
import { RazorpayPaymentModal } from './modals/RazorpayPaymentModal';
import { useAuth } from '../hooks/useAuth';

export interface LandingPageContentProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const LandingPageContent: React.FC<LandingPageContentProps> = ({ isDarkMode, onToggleTheme }) => {
  const navigate = useNavigate();
  const { updateUserPlan } = useAuth();
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayPlanInfo, setRazorpayPlanInfo] = useState<{ planName: string; amount: string }>({
    planName: 'AVO Pro',
    amount: '₹999',
  });

  const handleStartChat = () => {
    navigate(`/chat?new=${Date.now()}`);
  };

  const handleOpenRazorpay = (planName: string, amount: string) => {
    setRazorpayPlanInfo({ planName, amount });
    setIsRazorpayModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-200">
      <Navbar
        onStartChat={handleStartChat}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
      <main>
        <Hero onStartChat={handleStartChat} />
        <TrustedBy />
        <FeaturesSection />
        <LiveChatPreview onOpenFullChat={handleStartChat} />
        <WhyChooseUs />
        <Testimonials />
        <PricingSection
          onStartChat={handleStartChat}
          onOpenRazorpay={handleOpenRazorpay}
        />
        <FaqSection />
      </main>
      <Footer onStartChat={handleStartChat} />

      {/* Razorpay Payment Modal on Landing Page */}
      <RazorpayPaymentModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        planName={razorpayPlanInfo.planName}
        amount={razorpayPlanInfo.amount}
        onPaymentSuccess={() => {
          const upper = razorpayPlanInfo.planName.toUpperCase();
          const targetPlan = upper.includes('MAX') ? 'Max' : upper.includes('BUSINESS') ? 'Business' : 'Pro';
          updateUserPlan(targetPlan);
          setIsRazorpayModalOpen(false);
          handleStartChat();
        }}
      />
    </div>
  );
};

export default LandingPageContent;
