import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustedBy } from './components/TrustedBy';
import { FeaturesSection } from './components/FeaturesSection';
import { LiveChatPreview } from './components/LiveChatPreview';
import { WhyChooseUs } from './components/WhyChooseUs';
import { Testimonials } from './components/Testimonials';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { ChatApp } from './components/ChatApp';
import { SignInPage } from './components/SignInPage';
import { PricingPage } from './components/pricing/PricingPage';
import { RazorpayPaymentModal } from './components/modals/RazorpayPaymentModal';
import { UserProfile } from './types';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { PWAOfflineIndicator } from './components/PWAOfflineIndicator';

// Admin Application Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminAiUsage } from './components/admin/AdminAiUsage';
import { AdminAiModels } from './components/admin/AdminAiModels';
import { AdminProviders } from './components/admin/AdminProviders';
import { AdminAiRouting } from './components/admin/AdminAiRouting';
import { AdminConversations } from './components/admin/AdminConversations';
import { AdminFeedback } from './components/admin/AdminFeedback';
import { AdminFeatureSettings } from './components/admin/AdminFeatureSettings';
import { AdminSystemHealth } from './components/admin/AdminSystemHealth';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';
import { AdminSubscriptions } from './components/admin/AdminSubscriptions';
import { AdminReports } from './components/admin/AdminReports';
import { AdminSettings } from './components/admin/AdminSettings';

function LandingPageContent({ isDarkMode, onToggleTheme }: { isDarkMode: boolean; onToggleTheme: () => void }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUserPlan } = useAuth();
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
}

function MainAppRoutes() {
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(user);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_theme');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (user) {
      setUserProfile(user);
    }
  }, [user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexus_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexus_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSignIn = (signedInUser: UserProfile) => {
    setUserProfile(signedInUser);
    navigate('/chat');
  };

  const handleSignOut = () => {
    signOut();
    setUserProfile(null);
    navigate('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium tracking-wide">Loading session...</p>
        </div>
      </div>
    );
  }

  const currentUser = userProfile || user;
  const isUserAuthenticated = isAuthenticated && Boolean(currentUser);

  return (
    <Routes>
      <Route
        path="/signin"
        element={
          isUserAuthenticated ? (
            <Navigate to="/chat" replace />
          ) : (
            <SignInPage
              onSignIn={handleSignIn}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          )
        }
      />
      <Route
        path="/chat"
        element={
          isUserAuthenticated && currentUser ? (
            <ChatApp
              onBackToWebsite={() => navigate('/')}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              userProfile={currentUser}
              onSignOut={handleSignOut}
            />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
      {/* Admin Application - Dark Minimalist SaaS Interface */}
      <Route path="/admin" element={<AdminRouteGuard />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="ai-usage" element={<AdminAiUsage />} />
          <Route path="ai-models" element={<AdminAiModels />} />
          <Route path="providers" element={<AdminProviders />} />
          <Route path="ai-routing" element={<AdminAiRouting />} />
          <Route path="conversations" element={<AdminConversations />} />
          <Route path="feedback" element={<AdminFeedback />} />
          <Route path="feature-settings" element={<AdminFeatureSettings />} />
          <Route path="system-health" element={<AdminSystemHealth />} />
          <Route path="security" element={<AdminSettings />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route
        path="/pricing"
        element={
          <PricingPage
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        }
      />

      <Route
        path="/"
        element={
          isUserAuthenticated ? (
            <LandingPageContent
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          ) : (
            <Navigate to="/signin" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={isUserAuthenticated ? "/" : "/signin"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <MainAppRoutes />
        <PWAOfflineIndicator />
      </HashRouter>
    </AuthProvider>
  );
}
