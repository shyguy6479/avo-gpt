import React, { useState } from 'react';
import {
  Settings,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Mail,
  Sliders
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dailyFreeQuota, setDailyFreeQuota] = useState(25);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div id="admin-settings-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Admin Platform Settings</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Global administrative configuration, security parameters, and maintenance controls.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-xs font-mono text-[#ffffff] transition-colors self-start"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Save Settings</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-[#18181b] border border-[#3f3f46] text-xs font-mono text-[#ffffff] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#ffffff]" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Maintenance Mode */}
      <div className="p-5 rounded-lg bg-[#09090b] border border-[#27272a] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">System Maintenance Mode</h3>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            When enabled, regular users will see a maintenance screen. Admin interface remains fully operational.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMaintenanceMode(!maintenanceMode)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            maintenanceMode ? 'bg-[#EF4444]' : 'bg-[#27272a]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              maintenanceMode ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Quotas & Limits */}
      <div className="p-5 rounded-lg bg-[#09090b] border border-[#27272a] space-y-4">
        <h3 className="text-xs font-mono font-semibold text-[#e4e4e7] uppercase tracking-wider">
          DEFAULT USER QUOTAS
        </h3>

        <div className="max-w-md space-y-3 text-xs">
          <div>
            <label className="text-white font-medium">Free Plan Daily Messages Limit</label>
            <input
              type="number"
              value={dailyFreeQuota}
              onChange={(e) => setDailyFreeQuota(Number(e.target.value))}
              className="w-full mt-1 bg-[#09090b] border border-[#27272a] rounded px-3 py-2 text-white font-mono"
            />
            <p className="text-[11px] text-[#71717a] mt-1">
              Limits unauthenticated or free tier users from overloading inference queues.
            </p>
          </div>
        </div>
      </div>

      {/* Super Admin Whitelist */}
      <div className="p-5 rounded-lg bg-[#09090b] border border-[#27272a] space-y-3">
        <h3 className="text-xs font-mono font-semibold text-[#e4e4e7] uppercase tracking-wider">
          SUPER ADMIN AUTHORIZATION
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded bg-[#09090b] border border-[#27272a] flex items-center justify-between font-mono">
            <div className="flex items-center gap-2 text-white">
              <Mail className="w-3.5 h-3.5 text-[#ffffff]" />
              <span>abhixin79@gmail.com</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-[#18181b] text-[#ffffff] border border-[#3f3f46]">
              PRIMARY SUPER ADMIN
            </span>
          </div>

          <div className="p-3 rounded bg-[#09090b] border border-[#27272a] flex items-center justify-between font-mono">
            <div className="flex items-center gap-2 text-white">
              <Mail className="w-3.5 h-3.5 text-[#ffffff]" />
              <span>m.vance@defense-grid.net</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              ADMIN DELEGATE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
