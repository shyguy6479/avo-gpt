import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { UserProfile } from './types';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { PWAOfflineIndicator } from './components/PWAOfflineIndicator';

// Lazy-loaded primary route components to eliminate huge upfront bundle overhead
const LandingPageContent = lazy(() => import('./components/LandingPageContent'));
const ChatApp = lazy(() => import('./components/ChatApp').then((m) => ({ default: m.ChatApp })));
const SignInPage = lazy(() => import('./components/SignInPage').then((m) => ({ default: m.SignInPage })));
const PricingPage = lazy(() => import('./components/pricing/PricingPage').then((m) => ({ default: m.PricingPage })));

// Lazy-loaded Admin Application Components (isolated from main chat bundle)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminRouteGuard = lazy(() => import('./components/admin/AdminRouteGuard').then((m) => ({ default: m.AdminRouteGuard })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./components/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminAiUsage = lazy(() => import('./components/admin/AdminAiUsage').then((m) => ({ default: m.AdminAiUsage })));
const AdminAiModels = lazy(() => import('./components/admin/AdminAiModels').then((m) => ({ default: m.AdminAiModels })));
const AdminProviders = lazy(() => import('./components/admin/AdminProviders').then((m) => ({ default: m.AdminProviders })));
const AdminAiRouting = lazy(() => import('./components/admin/AdminAiRouting').then((m) => ({ default: m.AdminAiRouting })));
const AdminConversations = lazy(() => import('./components/admin/AdminConversations').then((m) => ({ default: m.AdminConversations })));
const AdminFeedback = lazy(() => import('./components/admin/AdminFeedback').then((m) => ({ default: m.AdminFeedback })));
const AdminFeatureSettings = lazy(() => import('./components/admin/AdminFeatureSettings').then((m) => ({ default: m.AdminFeatureSettings })));
const AdminSystemHealth = lazy(() => import('./components/admin/AdminSystemHealth').then((m) => ({ default: m.AdminSystemHealth })));
const AdminAuditLogs = lazy(() => import('./components/admin/AdminAuditLogs').then((m) => ({ default: m.AdminAuditLogs })));
const AdminSubscriptions = lazy(() => import('./components/admin/AdminSubscriptions').then((m) => ({ default: m.AdminSubscriptions })));
const AdminReports = lazy(() => import('./components/admin/AdminReports').then((m) => ({ default: m.AdminReports })));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Loading...</p>
      </div>
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
    <Suspense fallback={<RouteLoadingFallback />}>
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
    </Suspense>
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
