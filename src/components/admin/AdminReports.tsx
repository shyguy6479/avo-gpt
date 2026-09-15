import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadJsonReport = async () => {
    setDownloading('json');
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { 'x-admin-key': 'avo-master-admin-token' },
      });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avo_ai_telemetry_report_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  const downloadCsvReport = async () => {
    setDownloading('csv');
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { 'x-admin-key': 'avo-master-admin-token' },
      });
      const data = await res.json();
      const history = data.aiRequestsHistory || [];
      const csv = 'Date,Label,Requests,Errors\n' + history.map((h: any) => `${h.date},${h.label},${h.requests},${h.errors}`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avo_ai_requests_history_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div id="admin-reports-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Reports & Exports</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Export structured metrics, system audit traces, and usage datasets for analysis.
          </p>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] text-[#ffffff] flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Daily Traffic CSV Export</h3>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Complete 30-day breakdown of AI requests, user signups, and error rates.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={downloadCsvReport}
            disabled={downloading === 'csv'}
            className="flex items-center justify-center gap-2 w-full py-2 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-xs font-mono text-[#ffffff] transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'csv' ? 'Preparing CSV...' : 'Download CSV Dataset'}</span>
          </button>
        </div>

        <div className="p-5 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] text-[#ffffff] flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Full Telemetry JSON Dump</h3>
                <p className="text-xs text-[#a1a1aa] mt-0.5">
                  Raw JSON snapshot containing models, routing rules, user stats, and audit records.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={downloadJsonReport}
            disabled={downloading === 'json'}
            className="flex items-center justify-center gap-2 w-full py-2 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-xs font-mono text-[#ffffff] transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'json' ? 'Generating JSON...' : 'Download Full JSON Snapshot'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
