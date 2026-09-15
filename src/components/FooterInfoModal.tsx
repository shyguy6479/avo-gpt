import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Briefcase,
  FileText,
  Mail,
  Download,
  ExternalLink,
  MessageSquare,
  Lock,
  Zap,
  Globe,
  Send,
  Layers,
  ArrowRight
} from 'lucide-react';

interface FooterInfoModalProps {
  activeItem: string | null;
  onClose: () => void;
  onStartChat: () => void;
}

export const FooterInfoModal: React.FC<FooterInfoModalProps> = ({
  activeItem,
  onClose,
  onStartChat
}) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  const [appliedJob, setAppliedJob] = useState<string | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');

  if (!activeItem) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) return;
    setContactSubmitted(true);
  };

  const handleJobApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.trim()) return;
    setAppliedJob('submitted');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">{activeItem}</h3>
            <p className="text-xs text-zinc-400 font-mono">AVO AI Official Information</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* PRODUCT: Conversations */}
          {activeItem === 'Conversations' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  AVO AI Conversations provides next-generation multi-turn chat threads powered by low-latency streaming models. Designed with contextual memory, thread branching, and custom system prompt overrides.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                    <Zap className="w-4 h-4" /> Sub-100ms Token Latency
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Optimized server-sent events (SSE) pipeline streams tokens in real-time without component flicker.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                    <Layers className="w-4 h-4" /> Side Thread Branching
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Fork any specific message into a dedicated side thread reply without polluting your primary chat history.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onStartChat();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Start a Conversation Now</span>
                </button>
              </div>
            </div>
          )}

          {/* PRODUCT: Chat Application */}
          {activeItem === 'Chat Application' && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-300 leading-relaxed">
                The AVO AI Chat Workspace is a full-featured desktop-class application designed following Apple & Linear UI aesthetics. It includes syntax highlighting, code folding, PDF export, voice dictation, and folder organization.
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Key Capabilities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Multi-Model Switching (AVO 4o, Pro, Flash)',
                    'Multi-Account Switcher & Session State',
                    'Code Syntax Themes (10+ High-Contrast Themes)',
                    'Markdown & Table Formatting Support',
                    'Export Chat to PDF / Markdown',
                    'Drag & Drop File & Image OCR Analysis'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-200">
                      <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onStartChat();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Launch Chat Workspace</span>
                </button>
              </div>
            </div>
          )}

          {/* PRODUCT: Vision OCR */}
          {activeItem === 'Vision OCR' && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-300 leading-relaxed">
                AVO AI Vision OCR allows you to upload screenshots, financial charts, architecture diagrams, and handwritten notes. Our vision models automatically extract text, parse code from images, and generate structured Markdown tables.
              </p>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-300">
                  Image Parsing Examples
                </div>
                <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
                  <li>Financial charts & YoY growth metrics extraction</li>
                  <li>UI mockup to React Tailwind JSX code conversion</li>
                  <li>Receipt & invoice line-item table parsing</li>
                  <li>Whiteboard schematic architecture summary</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onStartChat();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Try Vision OCR in Workspace</span>
                </button>
              </div>
            </div>
          )}

          {/* PRODUCT: Pricing Plans */}
          {activeItem === 'Pricing Plans' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Free</div>
                    <div className="text-2xl font-extrabold text-white mt-1">₹0 <span className="text-xs text-zinc-500 font-normal">/ forever</span></div>
                    <p className="text-xs text-zinc-400 mt-2">Standard access to AVO Flash model and basic chat features.</p>
                  </div>
                  <button
                    onClick={() => { onClose(); onStartChat(); }}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-colors border border-zinc-700"
                  >
                    Get Started Free
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-zinc-700 flex flex-col justify-between space-y-4 relative shadow-xl">
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-extrabold uppercase">Most Popular</div>
                  <div>
                    <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Pro</div>
                    <div className="text-2xl font-extrabold text-white mt-1">₹999 <span className="text-xs text-zinc-500 font-normal">/ month</span></div>
                    <p className="text-xs text-zinc-400 mt-2">Full access to AVO 4o & AVO 4.5 Pro with unlimited Vision OCR & PDF exports.</p>
                  </div>
                  <button
                    onClick={() => { onClose(); onStartChat(); }}
                    className="w-full py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs cursor-pointer transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Enterprise</div>
                    <div className="text-2xl font-extrabold text-white mt-1">Custom</div>
                    <p className="text-xs text-zinc-400 mt-2">Dedicated infrastructure, SOC2 compliance, custom SLA, and SSO.</p>
                  </div>
                  <button
                    onClick={() => { onClose(); onStartChat(); }}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-colors border border-zinc-700"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMPANY: About Us */}
          {activeItem === 'About Us' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-white">Engineering Next-Generation AI Collaboration</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  AVO AI was founded by artificial intelligence researchers and product engineers with a shared goal: building ultra-fast, visually pristine workspace software that enhances human intellect rather than replacing it.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-xl font-extrabold text-white">99.9%</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Uptime SLA</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-xl font-extrabold text-white">&lt;100ms</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">First Token Latency</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-xl font-extrabold text-white">100k+</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Daily Queries</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-xl font-extrabold text-white">256-bit</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">AES Encryption</div>
                </div>
              </div>
            </div>
          )}

          {/* COMPANY: Careers */}
          {activeItem === 'Careers' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-bold text-white">Build the Future of AI Software</h4>
                <p className="text-xs text-zinc-400 mt-1">We are hiring exceptional designers, frontend architects, and systems engineers.</p>
              </div>

              {appliedJob ? (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs space-y-2">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-zinc-300" /> Application Received!
                  </div>
                  <p>Thank you for applying. Our talent team will review your application and reach out within 48 hours.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { title: 'Senior AI Frontend Engineer', loc: 'Remote (Global)', type: 'Full-time' },
                    { title: 'Machine Learning Infrastructure Lead', loc: 'San Francisco / Remote', type: 'Full-time' },
                    { title: 'Product Designer (Design Systems)', loc: 'Remote (US/EU)', type: 'Full-time' }
                  ].map((job, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
                      <div>
                        <h5 className="text-xs font-bold text-white">{job.title}</h5>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-1">
                          <span>{job.loc}</span>
                          <span>•</span>
                          <span className="text-zinc-300 font-semibold">{job.type}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setAppliedJob(job.title)}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs cursor-pointer transition-colors shrink-0"
                      >
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMPANY: Brand Assets */}
          {activeItem === 'Brand Assets' && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Download official AVO AI logos, wordmarks, brand guidelines, and high-resolution dark/light mode icon assets.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black border border-zinc-700 flex items-center justify-center font-bold text-white">
                      AVO
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Vector Logo Kit (SVG/PNG)</div>
                      <div className="text-[10px] text-zinc-400">High-res dark & light assets</div>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Downloaded AVO_AI_Brand_Kit.zip')}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                    title="Download SVG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                      #HEX
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Color Palette & Typography</div>
                      <div className="text-[10px] text-zinc-400">Linear / Apple design spec</div>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Copied Brand Color Palette')}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                    title="Copy palette"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMPANY: Contact */}
          {activeItem === 'Contact' && (
            <div className="space-y-6">
              {contactSubmitted ? (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs space-y-2">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-zinc-300" /> Message Sent Successfully!
                  </div>
                  <p>Our team has received your message and will respond to <strong>{contactEmail}</strong> shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">How can we help?</label>
                    <textarea
                      rows={3}
                      required
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder="Ask about enterprise support, API integrations, or sales..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* LEGAL: Privacy Policy */}
          {activeItem === 'Privacy Policy' && (
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <h4 className="text-sm font-bold text-white">Privacy Policy & Data Security Guarantee</h4>
              <p>
                At AVO AI, we treat your privacy and personal data with the highest security standards. We adhere to GDPR and CCPA requirements.
              </p>
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-300" /> Key Privacy Commitments:
                </div>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  <li>Your private messages are never used to train global AI models.</li>
                  <li>Zero-data-retention options are available for Enterprise workspaces.</li>
                  <li>All database records are encrypted at rest using AES-256.</li>
                </ul>
              </div>
            </div>
          )}

          {/* LEGAL: Terms of Service */}
          {activeItem === 'Terms of Service' && (
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <h4 className="text-sm font-bold text-white">Terms of Service</h4>
              <p>
                By accessing AVO AI services, you agree to comply with our platform guidelines, API rate limits, and acceptable use policies.
              </p>
              <p>
                Our service guarantees 99.9% monthly uptime SLA for Pro and Enterprise subscribers. Users maintain full ownership rights over all generated text and code outputs.
              </p>
            </div>
          )}

          {/* LEGAL: Security Center */}
          {activeItem === 'Security Center' && (
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <h4 className="text-sm font-bold text-white">Security Center & Infrastructure Protections</h4>
              <p>
                We employ defense-in-depth infrastructure across Google Cloud Run edge regions, automated vulnerability scanning, and strict role-based access controls.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="font-bold text-white mb-1">TLS 1.3 Transport Encryption</div>
                  <p className="text-zinc-400">All browser and API communications are encrypted in transit.</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="font-bold text-white mb-1">Continuous Vulnerability Audits</div>
                  <p className="text-zinc-400">Automated pen-testing and dependency security scanners.</p>
                </div>
              </div>
            </div>
          )}

          {/* LEGAL: SOC2 Compliance */}
          {activeItem === 'SOC2 Compliance' && (
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <h4 className="text-sm font-bold text-white">SOC 2 Type II Compliance Certification</h4>
              <p>
                AVO AI has successfully completed independent SOC 2 Type II auditing, confirming our adherence to rigorous security, availability, and confidentiality trust principles.
              </p>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">SOC 2 Type II Audit Executive Summary</div>
                  <div className="text-[11px] text-zinc-400">PDF Report available for enterprise customers</div>
                </div>
                <button
                  onClick={() => alert('Downloading SOC2_Type_II_Compliance_Summary.pdf')}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
