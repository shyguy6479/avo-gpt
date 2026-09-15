import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ExternalLink,
  Menu,
  Shield,
  LogOut,
  ChevronDown,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AdminHeaderProps {
  onToggleMobileMenu: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/reports')) return 'Reports & Analytics';
    if (path.includes('/users')) return 'Users & Accounts';
    if (path.includes('/subscriptions')) return 'Subscriptions & Billing';
    if (path.includes('/ai-usage')) return 'AI Platform Usage';
    if (path.includes('/ai-models')) return 'AI Models Configuration';
    if (path.includes('/providers')) return 'API Providers';
    if (path.includes('/ai-routing')) return 'AI Routing & Consensus';
    if (path.includes('/conversations')) return 'Conversations Telemetry';
    if (path.includes('/feedback')) return 'User Ratings & Feedback';
    if (path.includes('/feature-settings')) return 'Feature Settings';
    if (path.includes('/system-health')) return 'System Health & Metrics';
    if (path.includes('/security')) return 'Security Policies';
    if (path.includes('/audit-logs')) return 'System Audit Logs';
    if (path.includes('/settings')) return 'Admin Settings';
    return 'Platform Overview';
  };

  const adminEmail = user?.email || 'abhixin79@gmail.com';
  const adminName = user?.name || (adminEmail.split('@')[0]);

  return (
    <header
      id="admin-header"
      className="h-14 bg-black border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between z-10 sticky top-0"
    >
      {/* Left: Mobile trigger & Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          id="admin-mobile-menu-btn"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800"
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500 hidden sm:inline">AVO AI</span>
          <span className="text-zinc-700 hidden sm:inline">/</span>
          <span className="text-white font-medium font-sans text-sm tracking-tight">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* System Health Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-white -ml-3" />
          <span>ALL SYSTEMS OPERATIONAL</span>
        </div>

        {/* Link to User Chat App */}
        <button
          id="admin-open-user-app-btn"
          onClick={() => navigate('/chat')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors"
          title="Switch to User Chat Application"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Open user app</span>
          <ExternalLink className="w-3 h-3 text-zinc-400" />
        </button>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            id="admin-profile-menu-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-white transition-colors"
          >
            <div className="w-5 h-5 rounded bg-white text-black flex items-center justify-center font-bold text-[10px] uppercase">
              {adminName.slice(0, 2)}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="font-medium text-[11px] text-white max-w-[110px] truncate">
                {adminName}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                SUPER ADMIN
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {dropdownOpen && (
            <div
              id="admin-profile-dropdown"
              className="absolute right-0 mt-1.5 w-56 rounded-lg bg-zinc-950 border border-zinc-800 shadow-2xl py-1 text-xs text-zinc-200 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="px-3 py-2 border-b border-zinc-800">
                <div className="font-medium text-white truncate">{adminName}</div>
                <div className="text-[11px] text-zinc-400 truncate font-mono">{adminEmail}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700">
                    ROLE: SUPER_ADMIN
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/admin/security');
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-zinc-300 hover:text-white hover:bg-zinc-900 text-left"
                >
                  <Shield className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Security & Permissions</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/chat');
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-zinc-300 hover:text-white hover:bg-zinc-900 text-left"
                >
                  <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>View as Regular User</span>
                </button>
              </div>

              <div className="pt-1 border-t border-zinc-800">
                <button
                  onClick={async () => {
                    setDropdownOpen(false);
                    await signOut();
                    navigate('/signin');
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-900 text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out of Admin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
