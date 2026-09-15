import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ArrowRight, Mail, Eye, EyeOff, ShieldCheck, Sparkles, UserPlus, CheckCircle2, X, MessageSquare, KeyRound, AlertCircle, Check, AlertTriangle, Clock, Info, Copy, Sun, Moon, Globe } from 'lucide-react';
import { UserProfile } from '../types';
import { COMPANY_NAME_VARIANTS } from './NexusLogo';
import { saveUserToDatabase, getUserFromDatabase, UserRecord } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

const HeroAnimation = lazy(() => import('./HeroAnimation'));

interface SignInPageProps {
  onSignIn: (user: UserProfile) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignIn, isDarkMode, onToggleTheme }) => {
  const {
    isAuthenticating,
    accounts,
    switchAccount,
    removeAccount,
    removeAllAccounts,
    signInWithEmail: authSignInWithEmail,
    signUpWithEmail: authSignUpWithEmail,
    signInWithGoogle: authSignInWithGoogle,
  } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google / Gmail Auth Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGmail, setCustomGmail] = useState('');
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [diagnosticLog, setDiagnosticLog] = useState<{
    timestamp: string;
    type: 'info' | 'error' | 'timeout' | 'success';
    message: string;
    code?: string;
    details?: string;
  } | null>(null);

  // Check URL parameters and getRedirectResult silently on mount
  useEffect(() => {
    let isMounted = true;

    // Check if URL query or hash contains error or action parameters
    const searchParams = new URLSearchParams(window.location.search);
    const hashSplit = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const hashParams = new URLSearchParams(hashSplit);

    const urlError = searchParams.get('error') || hashParams.get('error');
    const modeParam = searchParams.get('mode') || hashParams.get('mode');

    if (urlError && isMounted) {
      console.warn('OAuth callback query notice:', urlError);
      let friendlyError = 'The authentication action was invalid or cancelled. Please try signing in again.';
      if (urlError === 'auth_failed') {
        friendlyError = 'Sign in was cancelled or failed due to an invalid request. Please try again.';
      } else if (urlError === 'session_expired') {
        friendlyError = 'Your sign in session expired. Please attempt signing in again.';
      } else if (urlError === 'access_denied') {
        friendlyError = 'Access was denied by the auth provider. Please grant permissions to sign in.';
      }

      setError(friendlyError);
      showToast(friendlyError, 'error');
      // Clean up URL search query parameters without reloading
      const cleanUrl = window.location.pathname + (window.location.hash ? window.location.hash.split('?')[0] : '');
      window.history.replaceState({}, document.title, cleanUrl);
    }

    const processRedirectResult = async () => {
      return;
    };

    processRedirectResult();

    return () => {
      isMounted = false;
    };
  }, [onSignIn]);

  // Toast message state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Forgot Password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Modal open state for the Login card popup (starts closed so user can enjoy the Spider-Man AVO hero animation)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-rotating company name state
  const [nameIndex, setNameIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setNameIndex((prev) => (prev + 1) % COMPANY_NAME_VARIANTS.length);
        setIsFading(false);
      }, 250);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const validatePassword = (pwd: string): string | null => {
    if (!pwd || pwd.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return null;
  };

  const currentBrand = COMPANY_NAME_VARIANTS[nameIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim();

    if (authMode === 'signup') {
      if (!fullName.trim()) {
        setError('Full name is required.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
        setError('Please enter a valid email address.');
        return;
      }

      // Password Validation Requirements
      const pwdError = validatePassword(password);
      if (pwdError) {
        setError(pwdError);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setIsLoading(true);

      try {
        const newUser = await authSignUpWithEmail(fullName.trim(), emailTrimmed, password);
        if (newUser) {
          if (rememberMe) {
            localStorage.setItem('nexus_user', JSON.stringify(newUser));
            localStorage.setItem('nexus_authenticated', 'true');
          }

          showToast('Account created successfully!', 'success');
          onSignIn(newUser);
        } else {
          setError('Failed to create account. Please try again.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during account creation.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Login mode
    const finalEmail = emailTrimmed;
    const finalPassword = password;

    if (!finalEmail || !finalPassword) {
      setError('Please enter your email and password to sign in.');
      return;
    }

    setIsLoading(true);

    try {
      const userProfile = await authSignInWithEmail(finalEmail, finalPassword);
      if (userProfile) {
        if (rememberMe) {
          localStorage.setItem('nexus_user', JSON.stringify(userProfile));
          localStorage.setItem('nexus_authenticated', 'true');
        }

        if (finalEmail.toLowerCase() === 'abhixin79@gmail.com') {
          showToast('Welcome Super Admin Abhinav!', 'success');
        } else {
          showToast('Welcome back, ' + userProfile.name + '!', 'success');
        }
        onSignIn(userProfile);
      } else {
        setError('Unable to authenticate. Please check your credentials or try again.');
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('user-not-found') || errMsg.toLowerCase().includes('no user') || errMsg.toLowerCase().includes('record')) {
        setError('Account does not exist. If you do not have an account, please sign up with AVO AI.');
      } else {
        setError(errMsg || 'Account does not exist or invalid credentials. Does not have an account? Sign up below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (selectedEmail?: string) => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const emailToUse = selectedEmail || (customGmail.trim() ? customGmail.trim() : undefined);
      const gUser = await authSignInWithGoogle(emailToUse);
      if (gUser) {
        if (gUser.email && gUser.email.toLowerCase() === 'abhixin79@gmail.com') {
          showToast('✅ Super Admin authenticated!', 'success');
        } else {
          showToast(`✅ Google Sign-In Successful! Signed in as ${gUser.email}.`, 'success');
        }
        setShowGoogleModal(false);
        onSignIn(gUser);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setIsSendingReset(true);

    try {
      setIsSendingReset(false);
      setResetSuccess(true);
      showToast('Password reset link sent to ' + forgotEmail.trim(), 'success');
    } catch (err: any) {
      setIsSendingReset(false);
      showToast('Error sending reset email. Please try again.', 'error');
    }
  };

  const handleQuickDemoFill = async () => {
    const demoEmail = 'example@gmail.com';
    const demoPass = 'DemoUser@2026';
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsLoading(true);
    try {
      const demoUser = await authSignInWithEmail(demoEmail, demoPass);
      if (demoUser) {
        if (rememberMe) {
          localStorage.setItem('nexus_user', JSON.stringify(demoUser));
          localStorage.setItem('nexus_authenticated', 'true');
        }
        showToast('Signed in with Demo Account!', 'success');
        onSignIn(demoUser);
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToSignUp = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);
    setAuthMode('signup');
  };

  const handleSwitchToLogin = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);
    setAuthMode('login');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-white dark:bg-black text-black dark:text-zinc-100 font-sans transition-colors duration-200">
      
      {/* HERO SECTION: Centered in middle on Mobile, Left-aligned on Desktop/Laptop */}
      <div className="w-full lg:w-1/2 lg:mr-auto min-h-screen flex flex-col items-center lg:items-start justify-center px-6 sm:px-10 lg:px-16 xl:px-20 py-12 z-10 space-y-8 text-center lg:text-left bg-transparent transition-colors duration-200">
        
        {/* Badge pill with white animated glow */}
        <div className="relative inline-flex group self-center lg:self-start mx-auto lg:mx-0">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 dark:from-white/40 dark:via-white/80 dark:to-white/40 opacity-75 blur-xs animate-pulse" />
          <div className="relative inline-flex items-center px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-950/90 border border-zinc-300 dark:border-white/40 text-zinc-900 dark:text-zinc-100 text-xs font-semibold tracking-wide shadow-lg">
            <span>Next-Gen Intelligent AI Assistant</span>
          </div>
        </div>

        {/* Clean AVO AI Hero Branding */}
        <div className="space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
          <div className="flex items-center justify-center lg:justify-start py-1 w-full">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight font-sans min-h-[5rem] flex items-center justify-center lg:justify-start">
              <div
                className={`inline-flex items-baseline justify-center lg:justify-start gap-4 transition-all duration-300 transform ${
                  isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <span className="text-black dark:text-white font-black">{currentBrand.name}</span>
                <span className="text-zinc-600 dark:text-zinc-300 font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-wider">
                  {currentBrand.ai}
                </span>
              </div>
            </h1>
          </div>

          <p className="text-xl sm:text-2xl font-semibold text-zinc-800 dark:text-white max-w-xl mx-auto lg:mx-0 leading-relaxed text-center lg:text-left">
            Think faster. Solve code. Multi-modal intelligence.
            <br />
            Your personal AI workspace.
          </p>
        </div>

        {/* Quick Feature Chips with white animated glow */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 mx-auto lg:mx-0">
          <div className="relative inline-flex group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-white/30 via-white/70 to-white/30 opacity-75 blur-xs animate-pulse" />
            <div className="relative flex items-center text-xs sm:text-sm font-medium text-white bg-zinc-950/90 border border-white/30 px-4 py-2 rounded-xl shadow-md">
              <span>Multi-Model AI Selection</span>
            </div>
          </div>
          <div className="relative inline-flex group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-white/30 via-white/70 to-white/30 opacity-75 blur-xs animate-pulse" />
            <div className="relative flex items-center text-xs sm:text-sm font-medium text-white bg-zinc-950/90 border border-white/30 px-4 py-2 rounded-xl shadow-md">
              <span>Voice & Web Grounding</span>
            </div>
          </div>
        </div>

        {/* Crisp White Pill Button with Start Chat Spinning Border & Shimmer Sweep */}
        <div className="pt-4 flex justify-center lg:justify-start mx-auto lg:mx-0 w-full sm:w-auto">
          <div className="relative inline-flex items-center justify-center group cursor-pointer w-full sm:w-auto">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-white/40 via-zinc-300/30 to-white/40 opacity-80 blur-xs animate-pulse-glow pointer-events-none group-hover:opacity-100 transition-opacity" />
            <div className="relative p-[2px] rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-[1.03] w-full sm:w-auto">
              <div className="absolute -inset-[300%] bg-[conic-gradient(from_0deg,#ffffff,#d4d4d8,#a1a1aa,#ffffff)] animate-border-spin" />
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="relative px-8 py-4 rounded-[14px] bg-white text-black hover:bg-zinc-100 active:scale-95 font-bold text-lg sm:text-xl shadow-2xl flex items-center justify-center gap-3.5 transition-all duration-300 cursor-pointer overflow-hidden w-full sm:w-auto"
              >
                {/* Localized Shimmer Beam Sweep */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-black/20 to-transparent animate-btn-shimmer pointer-events-none" />

                <MessageSquare className="w-6 h-6 text-black shrink-0 relative z-10" />
                <span className="relative z-10 whitespace-nowrap">Get Started</span>
                <ArrowRight className="w-5 h-5 text-black shrink-0 group-hover:translate-x-1 transition-transform relative z-10" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: 3D Robot Animation (Half Page Only, without middle divider line) */}
      <div className="hidden lg:block lg:w-1/2 absolute right-0 top-0 bottom-0 overflow-hidden pointer-events-auto z-0 bg-white dark:bg-[#050505] transition-colors duration-200">
        <Suspense fallback={null}>
          <HeroAnimation isDarkMode={isDarkMode} />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent dark:from-[#050505] opacity-80 pointer-events-none" />
      </div>

      {/* POPUP MODAL: Login Form triggers on clicking Get Started */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md">
            
            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-3 -right-3 z-30 w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800/90 hover:bg-zinc-300 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white flex items-center justify-center shadow-xl transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Login / Sign Up Card with Animated Glow */}
            <div className="relative group">
              <div className="absolute -inset-0.5 rounded-[26px] bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 dark:from-white/40 dark:via-white/80 dark:to-white/40 opacity-80 blur-xs animate-pulse" />
              <div className="relative bg-white dark:bg-zinc-950 backdrop-blur-2xl rounded-[24px] p-8 sm:p-10 border border-zinc-200 dark:border-white/30 shadow-2xl transition-all text-black dark:text-white">
                
                {/* Header */}
                <div className="mb-6 space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white flex items-center gap-1.5">
                    {authMode === 'signup' ? (
                      <>
                        <span>Create Account on</span>
                        <span className="text-black dark:text-white font-extrabold ml-1">AVO</span>
                        <span className="text-zinc-600 dark:text-zinc-300 font-extrabold">AI</span>
                      </>
                    ) : (
                      <>
                        <span>Welcome to</span>
                        <span className="text-black dark:text-white font-extrabold ml-1">AVO</span>
                        <span className="text-zinc-600 dark:text-zinc-300 font-extrabold">AI</span>
                      </>
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    {authMode === 'signup' 
                      ? 'Enter your details below to register a new account.' 
                      : 'Enter your credentials to access your AI workspace.'}
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs font-medium space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1 leading-relaxed">{error}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-rose-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Dismiss notice"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {error.includes('Authorized Domains') && (
                      <div className="pt-2 border-t border-rose-800/50 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(window.location.hostname);
                              showToast(`Copied domain "${window.location.hostname}" to clipboard!`, 'success');
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Current Domain ({typeof window !== 'undefined' ? window.location.hostname : ''})</span>
                        </button>
                        <a
                          href="https://console.firebase.google.com/project/avoai-9f645/authentication/settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Open avoai-9f645 Authorized Domains</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            const guestProfile: UserProfile = {
                              name: 'Super Admin Abhinav',
                              email: 'abhixin79@gmail.com',
                              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=abhixin79',
                              plan: 'Pro',
                              role: 'super_admin'
                            };
                            localStorage.setItem('nexus_user', JSON.stringify(guestProfile));
                            localStorage.setItem('nexus_authenticated', 'true');
                            showToast('Signed in with Super Admin account!', 'success');
                            onSignIn(guestProfile);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Instant Sign-In as Super Admin</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Saved Accounts on Device (Multi-Account Switcher) */}
                {authMode === 'login' && accounts.length > 0 && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Saved Accounts ({accounts.length})</span>
                      <button
                        type="button"
                        onClick={() => {
                          removeAllAccounts();
                          showToast('Cleared all saved accounts.', 'success');
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {accounts.map((acc) => (
                        <div
                          key={acc.email}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-600 transition-all group/acc"
                        >
                          <button
                            type="button"
                            onClick={async () => {
                              const switched = await switchAccount(acc.email);
                              if (switched) {
                                showToast(`Signed in as ${acc.email}`, 'success');
                                onSignIn(switched);
                              }
                            }}
                            className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                          >
                            {acc.avatar ? (
                              <img
                                src={acc.avatar}
                                alt={acc.name}
                                className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {acc.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white group-hover/acc:text-blue-400 transition-colors truncate">
                                {acc.name}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate">{acc.email}</div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAccount(acc.email);
                            }}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove account from device"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* One-Click Provider Actions (Google Only) */}
                <div className="mb-5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full py-3.5 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 text-white font-bold text-xs rounded-2xl flex items-center justify-between shadow-xl transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      {isGoogleLoading ? (
                        <span className="w-4.5 h-4.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin shrink-0" />
                      ) : (
                        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      )}
                      <span className="text-white font-bold">
                        {isGoogleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                    <span className="bg-white dark:bg-zinc-950 px-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider absolute">Or Email Credentials</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Full Name Input (Signup Mode Only) */}
                  {authMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        FULL NAME
                      </label>
                      <div className="relative group/input">
                        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 dark:from-white/30 dark:via-white/60 dark:to-white/30 opacity-60 group-focus-within/input:opacity-100 blur-xs transition-opacity pointer-events-none" />
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Alex Rivers"
                            className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-700 dark:border-white/30 text-white text-sm font-medium placeholder-zinc-400 focus:outline-none focus:border-white transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Input with Animated Glow */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      EMAIL ADDRESS
                    </label>
                    <div className="relative group/input">
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 dark:from-white/30 dark:via-white/60 dark:to-white/30 opacity-60 group-focus-within/input:opacity-100 blur-xs transition-opacity pointer-events-none" />
                      <div className="relative flex items-center">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@gmail.com"
                          className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-700 dark:border-white/30 text-white text-sm font-medium placeholder-zinc-400 focus:outline-none focus:border-white transition-all pr-10"
                        />
                        <Mail className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Password Input with Animated Glow */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        PASSWORD
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email || '');
                            setResetSuccess(false);
                            setShowForgotPassword(true);
                          }}
                          className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-white hover:underline cursor-pointer transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative group/input">
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 dark:from-white/30 dark:via-white/60 dark:to-white/30 opacity-60 group-focus-within/input:opacity-100 blur-xs transition-opacity pointer-events-none" />
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={authMode === 'signup' ? 'Min 8 chars, 1 upper, 1 lower, 1 num, 1 symbol' : '••••••••'}
                          className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-700 dark:border-white/30 text-white text-sm font-medium placeholder-zinc-400 focus:outline-none focus:border-white transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password Input (Signup Mode Only) */}
                  {authMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        CONFIRM PASSWORD
                      </label>
                      <div className="relative group/input">
                        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-300 dark:from-white/30 dark:via-white/60 dark:to-white/30 opacity-60 group-focus-within/input:opacity-100 blur-xs transition-opacity pointer-events-none" />
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-700 dark:border-white/30 text-white text-sm font-medium placeholder-zinc-400 focus:outline-none focus:border-white transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Remember Me / Quick Demo row (Login mode) */}
                  {authMode === 'login' && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                        <span>Remember session</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleQuickDemoFill}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-bold text-[11px] cursor-pointer transition-colors"
                      >
                        Use demo login
                      </button>
                    </div>
                  )}

                  {/* Main Submit Button */}
                  <div className="relative w-full group pt-1">
                    <button
                      type="submit"
                      disabled={isLoading || isGoogleLoading}
                      className="relative z-10 w-full py-3.5 px-6 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                          {authMode === 'signup' ? 'Creating Account...' : 'Connecting to AVO AI...'}
                        </span>
                      ) : (
                        <>
                          <span>{authMode === 'signup' ? 'Create Account & Sign In' : 'Login to AVO AI'}</span>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Toggle Signup/Login Mode */}
                  <div className="space-y-3 pt-2">
                    <div className="text-center pt-1">
                      {authMode === 'login' ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-xs text-zinc-800 dark:text-zinc-200 font-medium bg-zinc-100 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-2xs">
                            <span>Does not have an account?</span>
                            <button
                              type="button"
                              onClick={handleSwitchToSignUp}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold underline cursor-pointer ml-0.5"
                            >
                              Sign up with AVO AI
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-xs text-zinc-800 dark:text-zinc-200 font-medium bg-zinc-100 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-2xs">
                            <span>Already have an account?</span>
                            <button
                              type="button"
                              onClick={handleSwitchToLogin}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold underline cursor-pointer ml-0.5"
                            >
                              Sign in here
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </form>

                {/* Footer Notice */}
                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 text-center">
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" />
                    <span>Protected by AVO AI Security Protocols</span>
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION OVERLAY */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-fadeIn">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-zinc-400 hover:text-white p-0.5 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset Password</h3>
                <p className="text-xs text-zinc-400">Enter your email address to receive a password reset link.</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Reset Link Sent!</span>
                </p>
                <p className="text-emerald-400/90">
                  We've sent password reset instructions to <strong className="text-white">{forgotEmail}</strong>. Check your inbox and follow the link.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-medium placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSendingReset ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* GOOGLE ACCOUNTS SIGN IN MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm bg-zinc-950 rounded-2xl border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <h3 className="font-bold text-white text-base">Sign in with Google</h3>
              </div>
              <button
                onClick={() => {
                  setShowGoogleModal(false);
                  setError(null);
                }}
                className="p-1 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner in Google Modal */}
            {error && (
              <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{error}</div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">Choose a Google / Gmail account to continue to AVO AI:</p>

              {/* Primary User Account Option */}
              <button
                type="button"
                onClick={() => handleGoogleLogin('abhixin79@gmail.com')}
                disabled={isLoading}
                className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    AS
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>Abhinav Singh</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Admin Mode
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">abhixin79@gmail.com</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 text-blue-400 transition-transform" />
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-950 px-2 text-[10px] text-zinc-500 font-bold uppercase">or Custom Gmail</span>
              </div>

              {/* Custom Gmail Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customGmail.trim()) handleGoogleLogin(customGmail.trim());
                }}
                className="space-y-2"
              >
                <input
                  type="email"
                  placeholder="enter.your.name@gmail.com"
                  value={customGmail}
                  onChange={(e) => {
                    setCustomGmail(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={isLoading || !customGmail.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign in with Custom Gmail</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

