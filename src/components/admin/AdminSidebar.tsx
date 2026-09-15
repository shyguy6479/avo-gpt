import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CreditCard,
  Eye,
  Cpu,
  Boxes,
  Server,
  GitBranch,
  MessagesSquare,
  MessageSquareHeart,
  Sliders,
  Activity,
  ShieldCheck,
  FileText,
  Settings,
  Bot,
  ExternalLink
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    isExternalLink?: boolean;
  }[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
      { label: 'View as user', path: '/chat', icon: Eye, isExternalLink: true },
    ],
  },
  {
    title: 'AI PLATFORM',
    items: [
      { label: 'AI Usage', path: '/admin/ai-usage', icon: Cpu },
      { label: 'AI Models', path: '/admin/ai-models', icon: Boxes },
      { label: 'API Providers', path: '/admin/providers', icon: Server },
      { label: 'AI Routing', path: '/admin/ai-routing', icon: GitBranch },
    ],
  },
  {
    title: 'PRODUCT',
    items: [
      { label: 'Conversations', path: '/admin/conversations', icon: MessagesSquare },
      { label: 'Feedback', path: '/admin/feedback', icon: MessageSquareHeart },
      { label: 'Feature settings', path: '/admin/feature-settings', icon: Sliders },
    ],
  },
  {
    title: 'PLATFORM',
    items: [
      { label: 'System health', path: '/admin/system-health', icon: Activity },
      { label: 'Security log', path: '/admin/security', icon: ShieldCheck },
      { label: 'Audit log', path: '/admin/audit-logs', icon: FileText },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <aside
      id="admin-sidebar"
      className="w-60 h-full bg-black border-r border-zinc-800 flex flex-col select-none"
    >
      {/* Platform Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800">
        <div
          onClick={() => handleNavigate('/admin/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded bg-white border border-white flex items-center justify-center text-black shadow-xs transition-transform group-hover:scale-105">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold tracking-wider text-white font-mono">AVO AI</span>
              <span className="text-[10px] text-zinc-500 font-mono font-medium tracking-tight">· ADMIN</span>
            </div>
            <span className="text-[9px] text-zinc-400 flex items-center gap-1 font-mono leading-none mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              SHARED BACKEND
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groupings */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-zinc-500 font-mono uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.label}
                    id={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-150 text-left ${
                      active
                        ? 'bg-white text-black font-semibold shadow-xs'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-black' : 'text-zinc-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.isExternalLink && (
                      <ExternalLink className={`w-3 h-3 shrink-0 ${active ? 'text-black/70' : 'text-zinc-500'}`} />
                    )}

                    {item.badge && (
                      <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded ${
                        active
                          ? 'bg-black text-white'
                          : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Version */}
      <div className="p-3 border-t border-zinc-800 bg-black flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <span>v3.4.0-prod</span>
        <span className="text-zinc-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Healthy
        </span>
      </div>
    </aside>
  );
};
