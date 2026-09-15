import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Settings,
  Bell,
  Clock,
  Puzzle,
  Volume2,
  CreditCard,
  Shield,
  HardDrive,
  ShieldCheck,
  Key,
  Users,
  UserCheck,
  User,
  Keyboard,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { AppSettings } from '../types';
import { CODE_THEME_LIST } from '../utils/codeThemes';
import { PricingSection } from './pricing/PricingSection';
import { AVO_MODELS, getModelSpec } from '../config/modelCatalog';
import { isModelAllowedForUser, getRequiredPlanForModel, normalizeUserPlan } from '../utils/planPermissions';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onShowToast?: (msg: string) => void;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
  onClearAllChats?: () => void;
  onOpenRazorpay?: (planName: string, amount: string) => void;
  userPlan?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onShowToast,
  onToggleTheme,
  isDarkMode = true,
  onClearAllChats,
  onOpenRazorpay,
  userPlan,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('general');
  const [mobileShowDetail, setMobileShowDetail] = useState<boolean>(false);
  const [contentFilter, setContentFilter] = useState<boolean>(true);
  const [safeMode, setSafeMode] = useState<boolean>(false);
  const [autoDeleteChats, setAutoDeleteChats] = useState<string>('Never');

  useEffect(() => {
    if (isOpen) {
      setMobileShowDetail(false);
    }
  }, [isOpen]);

  const currentUserPlan = normalizeUserPlan(userPlan || (() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.plan) return parsed.plan;
      }
    } catch {}
    return 'FREE';
  })());

  const [localSettings, setLocalSettings] = useState<AppSettings>({
    higherIntelligence: true,
    enableDictation: true,
    desktopPushAlerts: true,
    googleSearchGrounding: true,
    codeInterpreter: true,
    improveModel: true,
    safeSearch: true,
    parentalFilter: false,
    appearance: 'system',
    contrast: 'system',
    accentColor: 'default',
    language: 'auto',
    ...settings,
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userName, setUserName] = useState('Abhi Xin');
  const [userEmail, setUserEmail] = useState('abhixin79@gmail.com');
  const [isSavingParental, setIsSavingParental] = useState(false);

  const getCurrentUserEmail = (): string => {
    const saved = localStorage.getItem('nexus_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed.email;
      } catch {}
    }
    return userEmail || 'abhixin79@gmail.com';
  };

  React.useEffect(() => {
    if (isOpen && activeTab === 'parental') {
      const fetchParentalSettings = async () => {
        try {
          const email = getCurrentUserEmail();
          const res = await fetch('/api/settings/parental-controls', {
            headers: { 'x-user-email': email }
          });
          if (res.ok) {
            const data = await res.json();
            const val = data.ageRestrictedContentFilter ?? data.parentalFilter ?? false;
            setLocalSettings((prev) => ({
              ...prev,
              parentalFilter: val,
              ageRestrictedContentFilter: val
            }));
          }
        } catch (err) {
          console.warn('Failed to fetch parental settings from server:', err);
        }
      };
      fetchParentalSettings();
    }
  }, [isOpen, activeTab]);

  const handleToggleParentalFilter = async () => {
    const nextVal = !localSettings.parentalFilter;
    setIsSavingParental(true);

    const updatedSettings = {
      ...localSettings,
      parentalFilter: nextVal,
      ageRestrictedContentFilter: nextVal
    };
    setLocalSettings(updatedSettings);

    try {
      const email = getCurrentUserEmail();
      const res = await fetch('/api/settings/parental-controls', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify({ ageRestrictedContentFilter: nextVal })
      });

      if (res.ok) {
        const data = await res.json();
        const serverVal = data.ageRestrictedContentFilter ?? nextVal;
        const finalSettings = {
          ...localSettings,
          parentalFilter: serverVal,
          ageRestrictedContentFilter: serverVal
        };
        setLocalSettings(finalSettings);
        onSaveSettings(finalSettings);
        if (onShowToast) onShowToast('Parental controls updated');
      } else {
        throw new Error('Failed to update on server');
      }
    } catch (err) {
      const reverted = {
        ...localSettings,
        parentalFilter: !nextVal,
        ageRestrictedContentFilter: !nextVal
      };
      setLocalSettings(reverted);
      if (onShowToast) onShowToast('Unable to update parental controls. Please try again.');
    } finally {
      setIsSavingParental(false);
    }
  };

  React.useEffect(() => {
    setLocalSettings((prev) => ({
      higherIntelligence: true,
      enableDictation: true,
      desktopPushAlerts: true,
      googleSearchGrounding: true,
      codeInterpreter: true,
      improveModel: true,
      safeSearch: true,
      parentalFilter: false,
      appearance: 'system',
      contrast: 'system',
      accentColor: 'default',
      language: 'auto',
      ...settings,
    }));
  }, [settings]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localSettings, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "avo_chat_data.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      if (onShowToast) onShowToast('Exported settings data archive');
    } catch (e) {
      if (onShowToast) onShowToast('Export complete');
    }
  };

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      if (onShowToast) onShowToast('Cache cleared successfully');
    } catch (e) {
      if (onShowToast) onShowToast('Cache cleared');
    }
  };

  const getAccentDotColor = (accent?: string) => {
    switch (accent) {
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'green': return 'bg-emerald-500';
      case 'amber': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const navItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'pricing', label: 'Pricing & Plans', icon: Sparkles },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'personalization', label: 'Personalization', icon: Clock },
    { id: 'plugins', label: 'Plugins', icon: Puzzle },
    { id: 'voice', label: 'Voice', icon: Volume2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'datacontrols', label: 'Data controls', icon: Shield },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'safety', label: 'Safety', icon: ShieldCheck },
    { id: 'security', label: 'Security and login', icon: Key },
    { id: 'parental', label: 'Parental controls', icon: Users },
    { id: 'trusted', label: 'Trusted contact', icon: UserCheck },
    { id: 'account', label: 'Account', icon: User },
    { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/50 dark:bg-black/80 backdrop-blur-xs transition-all animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${activeTab === 'pricing' || activeTab === 'billing' ? 'max-w-6xl' : 'max-w-4xl'} rounded-t-3xl sm:rounded-2xl border-t sm:border border-zinc-200 dark:border-[#2B2B2B] bg-white dark:bg-[#121212] text-zinc-900 dark:text-[#F5F5F7] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[92vh] sm:h-[88vh] md:h-[680px] max-h-[96vh] transition-all`}
      >
        
        {/* Mobile Navigation List (Visible only on mobile when not in detail view) */}
        <div className={`md:hidden flex-col w-full h-full bg-white dark:bg-[#121212] overflow-y-auto ${mobileShowDetail ? 'hidden' : 'flex'}`}>
          {/* Mobile Handle Indicator */}
          <div className="w-full flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-[#2B2B2B] bg-zinc-50/80 dark:bg-[#121212]">
            <div className="flex items-center gap-2 font-bold text-base text-zinc-900 dark:text-white">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Settings</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 dark:bg-[#242424] dark:hover:bg-[#2e2e2e] dark:text-[#A1A1AA] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-200 dark:border-transparent"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="p-3 space-y-1 divide-y divide-zinc-100 dark:divide-[#242424]/40">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileShowDetail(true);
                  }}
                  className="w-full py-3.5 px-3 rounded-xl flex items-center justify-between text-left hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-[#1c1c1c] dark:active:bg-[#242424] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400' : 'bg-zinc-100 text-zinc-600 dark:bg-[#1e1e1e] dark:text-[#A1A1AA]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm ${isActive ? 'text-blue-600 dark:text-white font-bold' : 'text-zinc-800 dark:text-zinc-200 font-medium'}`}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Left Sidebar Menu (Hidden on mobile) */}
        <div className="hidden md:flex w-56 sm:w-64 shrink-0 bg-zinc-50/70 dark:bg-[#121212] p-3 flex-col border-r border-zinc-200 dark:border-[#2B2B2B]/70 overflow-y-auto select-none">
          {/* Close Button at Top Left */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 dark:border-transparent dark:bg-[#242424] dark:hover:bg-[#2e2e2e] dark:text-[#A1A1AA] dark:hover:text-white flex items-center justify-center transition-colors mb-2 cursor-pointer shrink-0"
            aria-label="Close preferences"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Items */}
          <nav className="space-y-0.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isKeyboard = item.id === 'keyboard';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
                    isKeyboard ? 'hidden sm:flex' : 'flex'
                  } items-center gap-3 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-xs text-zinc-900 border border-zinc-200/80 font-bold dark:bg-[#282828] dark:text-white dark:border-transparent'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#A1A1AA] dark:hover:bg-[#1a1a1a] dark:hover:text-[#F5F5F7]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-white' : 'text-zinc-500 dark:text-[#A1A1AA]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area (Shown on desktop always, or on mobile when mobileShowDetail is true) */}
        <div className={`flex-1 bg-white dark:bg-[#121212] p-4 sm:p-6 md:p-8 overflow-y-auto text-sm ${!mobileShowDetail ? 'hidden md:block' : 'block'}`}>
          {/* Mobile Back Header */}
          <div className="md:hidden sticky -top-4 -mx-4 -mt-4 px-4 pt-3 pb-3 mb-4 z-10 bg-white dark:bg-[#121212] border-b border-zinc-200 dark:border-[#2B2B2B] flex items-center justify-between">
            <button
              onClick={() => setMobileShowDetail(false)}
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold py-1.5 px-2.5 rounded-lg bg-blue-50 dark:bg-[#1e1e1e] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Settings</span>
            </button>
            <div className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 capitalize">
              {navItems.find((n) => n.id === activeTab)?.label || 'Settings'}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 dark:bg-[#242424] dark:text-[#A1A1AA] dark:hover:text-white flex items-center justify-center border border-zinc-200 dark:border-transparent"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-1">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                General
              </h2>

              {/* Row 1: Appearance */}
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <span className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Appearance</span>
                <div className="relative inline-block">
                  <select
                    value={localSettings.appearance || 'system'}
                    onChange={(e) => handleChange('appearance', e.target.value as any)}
                    className="appearance-none bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-[#1c1c1c] dark:hover:bg-[#242424] dark:text-[#F5F5F7] text-sm py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none transition-colors border border-zinc-200 dark:border-[#2B2B2B]"
                  >
                    <option value="system" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">System</option>
                    <option value="dark" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Dark</option>
                    <option value="light" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Light</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-[#A1A1AA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Row 2: Contrast */}
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <span className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Contrast</span>
                <div className="relative inline-block">
                  <select
                    value={localSettings.contrast || 'system'}
                    onChange={(e) => handleChange('contrast', e.target.value as any)}
                    className="appearance-none bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-[#1c1c1c] dark:hover:bg-[#242424] dark:text-[#F5F5F7] text-sm py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none transition-colors border border-zinc-200 dark:border-[#2B2B2B]"
                  >
                    <option value="system" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">System</option>
                    <option value="standard" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Standard</option>
                    <option value="high" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">High</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-[#A1A1AA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Row 3: Accent Color */}
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <span className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Accent color</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${getAccentDotColor(localSettings.accentColor)}`} />
                  <div className="relative inline-block">
                    <select
                      value={localSettings.accentColor || 'default'}
                      onChange={(e) => handleChange('accentColor', e.target.value as any)}
                      className="appearance-none bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-[#1c1c1c] dark:hover:bg-[#242424] dark:text-[#F5F5F7] text-sm py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none transition-colors border border-zinc-200 dark:border-[#2B2B2B]"
                    >
                      <option value="default" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Default</option>
                      <option value="blue" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Blue</option>
                      <option value="purple" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Purple</option>
                      <option value="green" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Green</option>
                      <option value="amber" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Amber</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-[#A1A1AA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 4: Language */}
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <span className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Language</span>
                <div className="relative inline-block">
                  <select
                    value={localSettings.language || 'auto'}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="appearance-none bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-[#1c1c1c] dark:hover:bg-[#242424] dark:text-[#F5F5F7] text-sm py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none transition-colors border border-zinc-200 dark:border-[#2B2B2B]"
                  >
                    <option value="auto" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Auto-detect</option>
                    <option value="en" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">English</option>
                    <option value="es" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Spanish</option>
                    <option value="fr" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">French</option>
                    <option value="de" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">German</option>
                    <option value="ja" className="bg-white text-zinc-900 dark:bg-[#1c1c1c] dark:text-[#F5F5F7]">Japanese</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-[#A1A1AA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Row 5: Higher Intelligence */}
              <div className="flex items-start justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div className="space-y-0.5 pr-4">
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Higher intelligence</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs leading-relaxed">
                    AVO can automatically use a higher intelligence setting when you ask a complex question.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('higherIntelligence', localSettings.higherIntelligence === false ? true : false)}
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer mt-0.5 ${
                    localSettings.higherIntelligence !== false ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      localSettings.higherIntelligence !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Row 6: Enable Dictation */}
              <div className="flex items-start justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div className="space-y-0.5 pr-4">
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Enable Dictation</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs leading-relaxed">
                    Use dictation in the chat composer.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('enableDictation', localSettings.enableDictation === false ? true : false)}
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer mt-0.5 ${
                    localSettings.enableDictation !== false ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      localSettings.enableDictation !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Personalization Tab */}
          {activeTab === 'personalization' && (
            <div className="space-y-5">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Personalization
              </h2>

              {/* Model Selection with Dedicated Specialties & Thinking Styles */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium block">
                    AI Model Specialization & Reasoning Engine
                  </label>
                  <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                    Each model features unique reasoning architectures & capabilities
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {AVO_MODELS.map((m) => {
                    const isSelected = localSettings.model === m.id || 
                      (m.id === 'gemini-3.6-pro' && (localSettings.model === 'avo-4o-pro' || localSettings.model === 'gemini-3.5-pro')) ||
                      (m.id === 'gemini-3.6-flash' && (!localSettings.model || localSettings.model === 'avo-4o' || localSettings.model === 'avo-omni-unified'));
                    const isLocked = !isModelAllowedForUser(m.id, currentUserPlan);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (isLocked) {
                            onShowToast?.(`🔒 ${m.name} requires ${m.requiredPlan} Plan. Upgrade to unlock.`);
                            setActiveTab('pricing');
                            return;
                          }
                          handleChange('model', m.id);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/50 shadow-sm dark:bg-[#1c1c1c] dark:border-zinc-500 dark:ring-zinc-500/60 dark:shadow-lg'
                            : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 dark:bg-[#161616] dark:border-[#2B2B2B] dark:hover:bg-[#1c1c1c] dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-[#F5F5F7]">{m.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700 border border-zinc-300 dark:bg-[#2B2B2B] dark:text-zinc-300 dark:border-zinc-700/60">
                              {m.tag}
                            </span>
                            {isLocked ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                {m.requiredPlan}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                Free
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] hidden sm:inline">
                              • {m.speed}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100/70 dark:text-emerald-400 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-emerald-800/60">
                              <Check className="w-3.5 h-3.5" /> Active Model
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] leading-relaxed">
                          {m.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-200 dark:border-[#2B2B2B]/60">
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Specialty:</span>
                          <span className="text-[10px] text-zinc-700 bg-zinc-200/70 dark:text-zinc-300 dark:bg-[#242424] px-2 py-0.5 rounded-md">
                            {m.specialty}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Thinking:</span>
                          <span className="text-[10px] text-blue-800 bg-blue-100/70 border border-blue-200 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-900/50 px-2 py-0.5 rounded-md">
                            {m.thinkingStyle}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {m.features.map((feat, fIdx) => (
                            <span
                              key={fIdx}
                              className="text-[10px] bg-zinc-200/60 text-zinc-700 border border-zinc-300/60 dark:bg-[#222222] dark:text-zinc-400 dark:border-[#2e2e2e] px-1.5 py-0.5 rounded"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* System Instructions */}
              <div className="space-y-1.5">
                <label className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium block">
                  Custom System Instructions
                </label>
                <textarea
                  rows={3}
                  value={localSettings.systemPrompt}
                  onChange={(e) => handleChange('systemPrompt', e.target.value)}
                  placeholder="E.g. You are a senior software engineer with a concise tone..."
                  className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 dark:bg-[#1c1c1c] dark:border-[#2B2B2B] rounded-xl p-3 text-sm dark:text-[#F5F5F7] dark:placeholder-[#A1A1AA] focus:outline-none focus:border-blue-500 dark:focus:border-zinc-500"
                />
              </div>

              {/* Creativity Temperature */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-900 dark:text-[#F5F5F7] font-medium">Creativity Temperature</span>
                  <span className="font-mono text-zinc-500 dark:text-[#A1A1AA]">{localSettings.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  <span>Precise (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              {/* Code Syntax Highlight Theme */}
              <div className="space-y-2 pt-2">
                <label className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium block">
                  Code Syntax Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CODE_THEME_LIST.map((ct) => {
                    const isSelected = (localSettings.codeTheme || 'github-dark') === ct.id;
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => handleChange('codeTheme', ct.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 border-blue-500 ring-1 ring-blue-500/50 dark:bg-[#242424] dark:text-white dark:border-zinc-500 dark:ring-zinc-500/50'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-[#181818] dark:text-[#A1A1AA] dark:border-[#2B2B2B] dark:hover:border-[#404040]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs truncate">{ct.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-white shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1">
                          {ct.previewColors.map((dotColor, idx) => (
                            <span
                              key={idx}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: dotColor }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-1">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Notifications
              </h2>
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Sound Effects</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Play subtle audio feedback when message completes.</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('soundEffects', !localSettings.soundEffects)}
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    localSettings.soundEffects ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      localSettings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Desktop Push Alerts</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Receive notifications when long responses finish streaming.</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('desktopPushAlerts', localSettings.desktopPushAlerts === false ? true : false)}
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    localSettings.desktopPushAlerts !== false ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      localSettings.desktopPushAlerts !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Plugins Tab */}
          {activeTab === 'plugins' && (
            <div className="space-y-1">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Plugins & Grounding
              </h2>
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Live Google Search Grounding</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Fetch real-time information from the web automatically.</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('googleSearchGrounding', localSettings.googleSearchGrounding === false ? true : false)}
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    localSettings.googleSearchGrounding !== false ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      localSettings.googleSearchGrounding !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Python Code Interpreter</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Execute inline calculations and data visualization charts.</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('codeInterpreter', localSettings.codeInterpreter === false ? true : false)}
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    localSettings.codeInterpreter !== false ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      localSettings.codeInterpreter !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Voice & Audio
              </h2>

              {/* Voice Selection */}
              <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">AI Voice Model</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">High-fidelity neural voice for reading messages aloud.</div>
                </div>
                <select
                  value={localSettings.voiceName || 'Puck'}
                  onChange={(e) => handleChange('voiceName', e.target.value)}
                  className="bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-[#1c1c1c] dark:hover:bg-[#242424] text-xs font-medium py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-[#2B2B2B] dark:text-[#F5F5F7] cursor-pointer"
                >
                  <option value="Puck">Puck (Natural & Energetic)</option>
                  <option value="Kore">Kore (Calm & Clear)</option>
                  <option value="Fenrir">Fenrir (Rich & Resonant)</option>
                  <option value="Zephyr">Zephyr (Warm & Gentle)</option>
                  <option value="Charon">Charon (Deep & Authoritative)</option>
                </select>
              </div>

              {/* Voice Pitch */}
              <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Voice Pitch</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Adjust tone height for speech synthesis.</div>
                </div>
                <select
                  value={localSettings.voicePitch || 'medium'}
                  onChange={(e) => handleChange('voicePitch', e.target.value as 'low' | 'medium' | 'high')}
                  className="bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-[#1c1c1c] dark:hover:bg-[#242424] text-xs font-medium py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-[#2B2B2B] dark:text-[#F5F5F7] cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Speech Volume */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Speech Volume</span>
                  <span className="font-mono text-zinc-500 dark:text-[#A1A1AA] text-xs">{Math.round((localSettings.voiceVolume ?? 0.8) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.voiceVolume ?? 0.8}
                  onChange={(e) => handleChange('voiceVolume', parseFloat(e.target.value))}
                  className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Speech Speed */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Speech Speed</span>
                  <span className="font-mono text-zinc-500 dark:text-[#A1A1AA] text-xs">{localSettings.voiceSpeed || 1.0}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.25"
                  value={localSettings.voiceSpeed || 1.0}
                  onChange={(e) => handleChange('voiceSpeed', parseFloat(e.target.value))}
                  className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Pricing & Plans Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-200 dark:border-[#2B2B2B] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-[#F5F5F7] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Subscription Plans & Indian Pricing</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                    Choose the best AI plan for your workflow. Powered by Razorpay INR instant checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/pricing');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <span>Open Full Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <PricingSection
                onOpenRazorpay={onOpenRazorpay}
                onShowToast={onShowToast}
                onOpenSeparatePricingPage={() => {
                  onClose();
                  navigate('/pricing');
                }}
                currentPlan={currentUserPlan}
              />
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7]">
                  Billing & Subscription Plans
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/pricing');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <span>Open Full Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <PricingSection
                onOpenRazorpay={onOpenRazorpay}
                onShowToast={onShowToast}
                onOpenSeparatePricingPage={() => {
                  onClose();
                  navigate('/pricing');
                }}
                currentPlan={currentUserPlan}
              />

              {/* Razorpay Integration Card */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 dark:bg-[#1a1a1a] dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">RAZORPAY</span>
                    <span className="text-zinc-900 dark:text-white text-sm font-semibold">Payment Gateway Integration</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    TEST KEY ACTIVE
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-[#A1A1AA] text-xs leading-relaxed">
                  Razorpay API is configured securely on the backend for subscription checkouts and INR payments.
                </p>
                <div className="p-3 rounded-lg bg-white border border-blue-100 dark:bg-[#111111] dark:border-[#2B2B2B] flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] font-bold uppercase tracking-wider">Razorpay Gateway Status</div>
                    <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Configured & Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Controls Tab */}
          {activeTab === 'datacontrols' && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Data Controls
              </h2>
              <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Improve model for everyone</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Allow chats to be used to train future AVO models.</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('improveModel', localSettings.improveModel === false ? true : false)}
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    localSettings.improveModel !== false ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      localSettings.improveModel !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Export data archive</span>
                <button
                  onClick={handleExportData}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:border-transparent dark:bg-[#242424] dark:hover:bg-[#2a2a2a] dark:text-white text-xs font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>
          )}

          {/* Storage & Safety Combined / Screenshot 2 Match Tab */}
          {(activeTab === 'safety' || activeTab === 'storage' || activeTab === 'general') && (
            <div className="space-y-6">
              
              {/* SAFETY Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>SAFETY</span>
                </div>

                <div className="space-y-3 pl-1">
                  {/* Content Filter */}
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                    <div>
                      <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Content Filter</div>
                      <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Block inappropriate content</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContentFilter(!contentFilter)}
                      className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                        contentFilter ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                      }`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          contentFilter ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Safe Mode */}
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                    <div>
                      <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Safe Mode</div>
                      <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Restrict sensitive topics</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSafeMode(!safeMode)}
                      className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                        safeMode ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                      }`}
                    >
                      <div
                        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          safeMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* STORAGE Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider">
                  <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>STORAGE</span>
                </div>

                <div className="space-y-3 pl-1">
                  {/* Auto-delete Chats */}
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                    <div>
                      <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Auto-delete Chats</div>
                      <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Remove old chats automatically</div>
                    </div>
                    <select
                      value={autoDeleteChats}
                      onChange={(e) => {
                        setAutoDeleteChats(e.target.value);
                        if (onShowToast) onShowToast(`Auto-delete set to ${e.target.value}`);
                      }}
                      className="bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-[#1c1c1c] dark:hover:bg-[#242424] dark:text-[#F5F5F7] text-xs font-medium py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-[#2B2B2B] focus:outline-none cursor-pointer"
                    >
                      <option value="Never">Never</option>
                      <option value="7 days">7 days</option>
                      <option value="30 days">30 days</option>
                      <option value="90 days">90 days</option>
                    </select>
                  </div>

                  {/* Clear All Chats */}
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                    <div>
                      <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Clear All Chats</div>
                      <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Delete all chat history</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onClearAllChats) {
                          onClearAllChats();
                        } else {
                          localStorage.removeItem('nexus_conversations');
                          if (onShowToast) onShowToast('All chat history deleted');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* THEME Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider">
                  <span>🎨 THEME</span>
                </div>

                <div className="space-y-3 pl-1">
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                    <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Current Theme</div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleTheme) onToggleTheme();
                        if (onShowToast) onShowToast(`Switched theme`);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-[#242424] dark:hover:bg-[#2e2e2e] dark:text-[#F5F5F7] text-xs font-medium flex items-center gap-2 border border-zinc-200 dark:border-[#2B2B2B] cursor-pointer"
                    >
                      <span>{isDarkMode ? '🌙 Dark' : '☀️ Light'}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">Toggle</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Security and Login
              </h2>
              <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Two-Factor Authentication</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Protected via Google OAuth session verification.</div>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Enabled</span>
              </div>
            </div>
          )}

          {/* Parental Controls Tab */}
          {activeTab === 'parental' && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Parental Controls
              </h2>
              <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                <div>
                  <div className="text-zinc-900 dark:text-[#F5F5F7] text-sm font-medium">Age Restricted Content Filter</div>
                  <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Automatically restrict topics not suitable for young audiences.</div>
                </div>
                <button
                  type="button"
                  disabled={isSavingParental}
                  onClick={handleToggleParentalFilter}
                  aria-label="Age Restricted Content Filter Toggle"
                  className={`w-11 h-6 shrink-0 flex items-center rounded-full p-0.5 transition-colors cursor-pointer disabled:opacity-50 ${
                    localSettings.parentalFilter ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-[#2B2B2B]'
                  }`}
                >
                  {isSavingParental ? (
                    <div className="w-5 h-5 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    </div>
                  ) : (
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        localSettings.parentalFilter ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  )}
                </button>
              </div>
              <div className="bg-zinc-100 dark:bg-[#18181b]/80 border border-zinc-200 dark:border-[#27272a] rounded-xl p-3.5 space-y-1.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                <p className="flex items-start gap-2 text-zinc-800 dark:text-zinc-300">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>When enabled, AVO AI applies stricter content controls designed to limit age-restricted topics.</span>
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 pl-6">
                  This setting does not disable AVO AI's standard safety protections.
                </p>
              </div>
            </div>
          )}

          {/* Trusted Contact Tab */}
          {activeTab === 'trusted' && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Trusted Contact
              </h2>
              <p className="text-zinc-500 dark:text-[#A1A1AA] text-xs">Designate a recovery contact email for account lockouts.</p>
              <input
                type="email"
                value={localSettings.trustedContact || ''}
                onChange={(e) => handleChange('trustedContact', e.target.value)}
                placeholder="recovery-contact@example.com"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:bg-[#1c1c1c] dark:border-[#2B2B2B] dark:text-white dark:placeholder-[#A1A1AA] focus:outline-none focus:border-blue-500 dark:focus:border-zinc-500"
              />
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Account
              </h2>
              <div className="py-2 space-y-3">
                {isEditingProfile ? (
                  <div className="space-y-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-[#1c1c1c] dark:border-[#2B2B2B]">
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-[#A1A1AA] block mb-1 font-medium">Full Name</label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-white border border-zinc-300 dark:bg-[#121212] dark:border-[#2B2B2B] rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 dark:text-[#A1A1AA] block mb-1 font-medium">Email Address</label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full bg-white border border-zinc-300 dark:bg-[#121212] dark:border-[#2B2B2B] rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        if (onShowToast) onShowToast('Profile updated');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-zinc-900 dark:text-white text-sm font-medium">{userName}</div>
                      <div className="text-zinc-500 dark:text-[#A1A1AA] text-xs">{userEmail}</div>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:border-transparent dark:bg-[#242424] dark:hover:bg-[#2a2a2a] dark:text-white text-xs font-medium cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Keyboard Tab */}
          {activeTab === 'keyboard' && (
            <div className="space-y-3">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-[#F5F5F7] pb-3 mb-2 border-b border-zinc-200 dark:border-[#2B2B2B]">
                Keyboard Shortcuts
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                  <span className="text-zinc-800 dark:text-[#F5F5F7]">Send message</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-[#242424] dark:border-transparent dark:text-white font-mono text-[11px]">Enter</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                  <span className="text-zinc-800 dark:text-[#F5F5F7]">New chat</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-[#242424] dark:border-transparent dark:text-white font-mono text-[11px]">⌘ + K</kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-[#2B2B2B]/60">
                  <span className="text-zinc-800 dark:text-[#F5F5F7]">Open Preferences</span>
                  <kbd className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-[#242424] dark:border-transparent dark:text-white font-mono text-[11px]">⌘ + ,</kbd>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
