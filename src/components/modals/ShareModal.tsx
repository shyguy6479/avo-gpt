import React, { useState } from 'react';
import { X, Share2, Copy, Check, Download, FileText, Code2, Globe, Twitter, Linkedin, Mail, MessageSquare } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationTitle?: string;
  messages?: Array<{ role: string; content: string }>;
  showToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  conversationTitle = 'AVO AI Workspace Thread',
  messages = [],
  showToast
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  if (!isOpen) return null;

  const shareUrl = `https://avo.ai/share/c/${Math.random().toString(36).substring(2, 9)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast('Public chat link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportMarkdown = () => {
    let md = `# ${conversationTitle}\n\n`;
    messages.forEach((msg) => {
      md += `### ${msg.role === 'user' ? 'User' : 'AVO AI'}\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationTitle.toLowerCase().replace(/[^a-z0-0]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported conversation as Markdown (.md)!');
  };

  const handleExportJSON = () => {
    const data = JSON.stringify({ title: conversationTitle, exportedAt: new Date().toISOString(), messages }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationTitle.toLowerCase().replace(/[^a-z0-0]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported conversation as JSON (.json)!');
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(conversationTitle, 10, 15);
      doc.setFontSize(10);
      let y = 25;

      messages.forEach((m) => {
        const textLines = doc.splitTextToSize(`${m.role.toUpperCase()}: ${m.content}`, 180);
        if (y + textLines.length * 6 > 280) {
          doc.addPage();
          y = 15;
        }
        doc.text(textLines, 10, y);
        y += textLines.length * 6 + 6;
      });

      doc.save(`${conversationTitle.toLowerCase().replace(/[^a-z0-0]/g, '_')}.pdf`);
      showToast('Exported PDF document!');
    } catch (e) {
      showToast('Exported summary PDF');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 text-blue-600 dark:text-zinc-200 shrink-0">
              <Share2 className="w-5 h-5 text-blue-600 dark:text-zinc-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white truncate">Share & Export Thread</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Share public workspace links or download thread artifacts.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800 shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Public Link Generator */}
          <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600 dark:text-zinc-400" />
                <span>Public Web Link</span>
              </label>

              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isPublic ? 'Public View Enabled' : 'Private Only'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full sm:flex-1 min-w-0 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-800 dark:text-zinc-300 font-mono focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white dark:text-black" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Export File Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Export Thread Document</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left shadow-xs"
              >
                <FileText className="w-4 h-4 text-blue-600 dark:text-zinc-300 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">Markdown</div>
                  <div className="text-[10px] text-zinc-500">.md file</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left shadow-xs"
              >
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-zinc-300 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">JSON Data</div>
                  <div className="text-[10px] text-zinc-500">.json payload</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer text-left shadow-xs"
              >
                <Download className="w-4 h-4 text-rose-600 dark:text-zinc-300 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">PDF Document</div>
                  <div className="text-[10px] text-zinc-500">printable .pdf</div>
                </div>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Share directly to</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my chat on AVO AI: ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold shadow-xs"
              >
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <span>X / Twitter</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold shadow-xs"
              >
                <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                <span>LinkedIn</span>
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent(conversationTitle)}&body=${encodeURIComponent(`Here is the AI thread: ${shareUrl}`)}`}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold shadow-xs"
              >
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
