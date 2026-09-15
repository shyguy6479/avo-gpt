import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Zap,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Users,
  Send,
  Crown,
  Flame,
  Lock,
  Sparkles,
  ExternalLink,
  Shield,
  Code2,
  FileText,
  Cpu,
  Layers,
  X
} from 'lucide-react';

export interface LockedFeatureDetail {
  title: string;
  category: string;
  requiredPlan: 'PRO' | 'MAX' | 'BUSINESS' | 'ENTERPRISE';
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  highlights: string[];
}

export const LOCKED_FEATURE_CATALOG: Record<string, LockedFeatureDetail> = {
  'AVO 4o, AVO 4o Pro, AVO Flash & AVO Omni models': {
    title: 'AVO Pro Model Suite (4o, Pro, Flash, Omni)',
    category: 'AI Models & Reasoning',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Access next-generation frontier intelligence including AVO 4o, AVO 4o Pro (Systems & Code), AVO Flash (Sub-Second), and AVO Omni (Multimodal).',
    highlights: ['Access to AVO 4o, AVO 4o Pro & AVO Omni', 'Sub-100ms inference execution', 'Deep architectural & code reasoning']
  },
  'Priority response speed': {
    title: 'Sub-100ms Priority Response Queue',
    category: 'Performance',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Bypass all free tier concurrency queues with dedicated sub-100ms high throughput inference servers.',
    highlights: ['Zero wait times during peak hours', 'Dedicated Indian cluster edge servers', 'Guaranteed 99.9% uptime SLA']
  },
  'Code generation and debugging': {
    title: 'Pro Code Sandbox & Live Preview',
    category: 'Development Tools',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Full-stack interactive coding environment with syntax linting, error diagnostics, and instant browser code execution.',
    highlights: ['Multi-file code workspace', 'Instant sandboxed execution', 'Automated bug fix & refactor engine']
  },
  'PDF and document analyzer': {
    title: 'Document & PDF Vision OCR',
    category: 'Multimodal Analysis',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Upload and parse multi-page PDFs, technical whitepapers, financial reports, and scanned documents with precision OCR.',
    highlights: ['Extract tables, formulas & charts', 'Multi-document cross-synthesis', 'Up to 100MB per file']
  },
  'PDF and document analysis': {
    title: 'Document & PDF Vision OCR',
    category: 'Multimodal Analysis',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Upload and parse multi-page PDFs, technical whitepapers, financial reports, and scanned documents with precision OCR.',
    highlights: ['Extract tables, formulas & charts', 'Multi-document cross-synthesis', 'Up to 100MB per file']
  },
  'Image understanding': {
    title: 'Multimodal Image & UI Vision',
    category: 'Multimodal Analysis',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Inspect UI mockups, architecture diagrams, charts, and photos to generate code, detect flaws, or summarize concepts.',
    highlights: ['UI screenshot to code conversion', 'Diagram & flow chart interpretation', 'High-resolution image reasoning']
  },
  'Longer conversations': {
    title: '1 Million Token Extended Context Window',
    category: 'Capacity',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Maintain deep context across hundreds of conversation turns and entire repository codebases without losing memory.',
    highlights: ['Massive memory retention', 'Full-codebase conversation memory', 'No context degradation']
  },
  'Longer conversation context': {
    title: '1 Million Token Extended Context Window',
    category: 'Capacity',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Maintain deep context across hundreds of conversation turns and entire repository codebases without losing memory.',
    highlights: ['Massive memory retention', 'Full-codebase conversation memory', 'No context degradation']
  },
  'Custom instructions': {
    title: 'Custom Instructions & Memory',
    category: 'Personalization',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Set custom persona instructions, domain constraints, formatting rules, and persistent cross-session memory.',
    highlights: ['Custom response tone & syntax', 'Persistent project guidelines', 'Domain-specific shortcuts']
  },
  'Custom instructions & memory': {
    title: 'Custom Instructions & Memory',
    category: 'Personalization',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Set custom persona instructions, domain constraints, formatting rules, and persistent cross-session memory.',
    highlights: ['Custom response tone & syntax', 'Persistent project guidelines', 'Domain-specific shortcuts']
  },
  'Priority support': {
    title: 'Priority 24/7 Developer Support',
    category: 'Support',
    requiredPlan: 'PRO',
    monthlyPrice: '₹999',
    annualPrice: '₹9,588',
    description: 'Direct priority ticketing and engineering support with guaranteed response times under 1 hour.',
    highlights: ['Direct ticketing queue', '<1hr response SLA', 'Dedicated assistance']
  },
  'Advanced reasoning model': {
    title: 'Deep Thinking & Formal Logic Engine (AVO Deep Thinker)',
    category: 'AI Models & Reasoning',
    requiredPlan: 'MAX',
    monthlyPrice: '₹2,499',
    annualPrice: '₹23,988',
    description: 'Exhaustive verification, mathematical deduction, and deep logic analysis for researchers and senior engineers.',
    highlights: ['Complex algorithm design', 'Formal mathematical proof verification', 'Multi-step architectural decomposition']
  },
  'Advanced codebase analysis': {
    title: 'Deep Repository & Codebase Analysis',
    category: 'Development Tools',
    requiredPlan: 'MAX',
    monthlyPrice: '₹2,499',
    annualPrice: '₹23,988',
    description: 'Scan whole Git repos, detect security vulnerabilities, map dependency trees, and generate full pull-request reviews.',
    highlights: ['Deep AST repository scanning', 'Automated security vulnerability audit', 'Full PR review generation']
  },
  'GitHub integration': {
    title: 'Native GitHub & CI/CD Integrations',
    category: 'Integrations',
    requiredPlan: 'MAX',
    monthlyPrice: '₹2,499',
    annualPrice: '₹23,988',
    description: 'Connect directly to private GitHub repositories, branches, and issue trackers for continuous AI code generation.',
    highlights: ['Direct commit & branch creation', 'Automated issue triage & solver', 'Webhook triggers & automated actions']
  },
  'API access': {
    title: 'Developer API & Webhooks Access',
    category: 'API & Developer',
    requiredPlan: 'MAX',
    monthlyPrice: '₹2,499',
    annualPrice: '₹23,988',
    description: 'Integrate AVO AI intelligence directly into your own applications, backend servers, and internal tools with programmatic REST APIs.',
    highlights: ['Custom API keys & rate limits', 'Real-time SSE streaming endpoints', 'SDKs for Node.js, Python, & Go']
  },
  'Shared team workspace': {
    title: 'Collaborative Multi-Seat Team Workspace',
    category: 'Team & Collaboration',
    requiredPlan: 'BUSINESS',
    monthlyPrice: '₹5,999',
    annualPrice: '₹57,588',
    description: 'Share conversations, prompt templates, knowledge bases, and custom agents across your entire team.',
    highlights: ['5 team seats included', 'Shared workspace libraries', 'Team prompt & agent templates']
  },
  'Admin dashboard': {
    title: 'Enterprise Admin Dashboard & Analytics',
    category: 'Management',
    requiredPlan: 'BUSINESS',
    monthlyPrice: '₹5,999',
    annualPrice: '₹57,588',
    description: 'Centralized administrator controls, role-based access management (RBAC), and real-time usage analytics.',
    highlights: ['Token & quota allocation per member', 'Audit logging & security reports', 'Centralized INR tax invoicing']
  },
  'Dedicated infrastructure': {
    title: 'Dedicated VPC & Isolated GPU Cluster',
    category: 'Enterprise Infrastructure',
    requiredPlan: 'ENTERPRISE',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    description: 'Single-tenant isolated cloud infrastructure, custom fine-tuned weights, and enterprise SAML/SSO authentication.',
    highlights: ['Zero data retention guarantee', 'Custom SAML SSO & SCIM directory sync', '24/7 dedicated solutions architect']
  }
};

interface PricingSectionProps {
  onOpenRazorpay?: (planName: string, amount: string) => void;
  onShowToast?: (msg: string) => void;
  onStartChat?: () => void;
  onOpenSeparatePricingPage?: () => void;
  currentPlan?: string;
  isStandalonePage?: boolean;
  isModal?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onOpenRazorpay,
  onShowToast,
  onStartChat,
  onOpenSeparatePricingPage,
  currentPlan = 'FREE',
  isStandalonePage = false,
  isModal = false,
}) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [selectedLockedFeature, setSelectedLockedFeature] = useState<LockedFeatureDetail | null>(null);

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '10-50 members',
    message: '',
  });

  const handleSelectPlan = (planName: string, monthlyAmount: string, annualAmount: string) => {
    if (planName === 'FREE') {
      if (onStartChat) {
        onStartChat();
      } else if (onShowToast) {
        onShowToast('You are currently on the Free plan.');
      }
      return;
    }

    if (planName === 'ENTERPRISE') {
      setIsContactModalOpen(true);
      return;
    }

    const targetAmount = billingCycle === 'monthly' ? monthlyAmount : annualAmount;
    if (onOpenRazorpay) {
      onOpenRazorpay(`AVO AI ${planName} (${billingCycle})`, targetAmount);
    } else if (onStartChat) {
      onStartChat();
    } else if (onShowToast) {
      onShowToast(`Selected ${planName} Plan (${targetAmount}). Opening checkout...`);
    }
  };

  const handleFeatureClick = (featureText: string, planName: 'PRO' | 'MAX' | 'BUSINESS' | 'ENTERPRISE' = 'PRO') => {
    // Look up in catalog or create dynamic feature
    const found = LOCKED_FEATURE_CATALOG[featureText];
    if (found) {
      setSelectedLockedFeature(found);
    } else {
      setSelectedLockedFeature({
        title: featureText,
        category: `${planName} Feature`,
        requiredPlan: planName,
        monthlyPrice: planName === 'PRO' ? '₹999' : planName === 'MAX' ? '₹2,499' : planName === 'BUSINESS' ? '₹5,999' : 'Custom',
        annualPrice: planName === 'PRO' ? '₹9,588' : planName === 'MAX' ? '₹23,988' : planName === 'BUSINESS' ? '₹57,588' : 'Custom',
        description: `This advanced capability is included in the AVO AI ${planName} plan. Upgrade your account to unlock full access.`,
        highlights: [
          `Unlocked with ${planName} subscription`,
          'Higher usage quota & priority queue',
          'Full-access AI toolchain & reasoning'
        ]
      });
    }
  };

  const handleOpenPricingPage = () => {
    setSelectedLockedFeature(null);
    if (onOpenSeparatePricingPage) {
      onOpenSeparatePricingPage();
    } else {
      try {
        navigate('/pricing');
      } catch {
        window.location.hash = '#/pricing';
      }
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setIsContactModalOpen(false);
      if (onShowToast) onShowToast('Thank you! Our Enterprise team will contact you within 2 hours.');
      setContactForm({ name: '', email: '', company: '', teamSize: '10-50 members', message: '' });
    }, 1500);
  };

  const faqList = [
    {
      q: 'Why are advanced features locked on the Free plan?',
      a: 'Free includes standard daily intelligence with 1,000 monthly messages. High-compute capabilities like sub-100ms reasoning, deep code sandbox execution, multi-page OCR document vision, and API endpoints require dedicated cloud GPU clusters, which are unlocked upon upgrading to Pro, Max, or Business.',
    },
    {
      q: 'What happens when I reach my monthly message limit?',
      a: 'Once you reach your monthly AI message quota, you can continue using standard speed fallback models or instantly upgrade your plan at any time. Your quota automatically resets on the 1st day of every billing cycle.',
    },
    {
      q: 'Can I upgrade or downgrade my plan?',
      a: 'Yes, you can switch between plans at any time. When upgrading, you get immediate access to all locked features and higher limits with pro-rated billing. Downgrades take effect at the start of the next billing cycle.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Absolutely. There are no lock-in contracts or hidden fees. If you cancel your subscription, you maintain full access to all paid features until the end of your prepaid billing period.',
    },
    {
      q: 'Which AI models are available?',
      a: 'Free includes AVO 4o (Balanced) and AVO Flash (Sub-Second). Pro unlocks AVO 4o Pro (Systems & Code) and AVO Omni (Multimodal). Max, Business, and Enterprise grant access to all 5 models including AVO Deep Thinker (Formal Logic reasoning engine), repository AST code analysis, and custom API endpoints.',
    },
    {
      q: 'Is my data secure and private?',
      a: 'Yes. All data in transit and at rest is secured using AES-256 bank-grade encryption. We strictly enforce privacy controls — your private codebases, prompts, and document uploads are NEVER used to train public AI models.',
    },
  ];

  return (
    <div className={`w-full ${isModal ? 'space-y-6' : 'space-y-10'} text-zinc-900 dark:text-zinc-100 select-none pb-6`}>
      
      {/* Top Banner: Active Subscription Status (Shown only on standalone page / non-modal) */}
      {!isModal && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white shrink-0">
              <Crown className="w-6 h-6 text-zinc-900 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Current Account Status</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mt-0.5">
                <span>{currentPlan} Plan</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                1,000 monthly AI messages included • Click any locked feature below or upgrade anytime to unlock full capability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800">
            {!isStandalonePage && (
              <button
                type="button"
                onClick={handleOpenPricingPage}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-blue-500/25 active:scale-95"
                title="Open Separate Dedicated Pricing Page"
              >
                <span>View Full Pricing Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="text-right hidden md:block">
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Accepted Payment Methods</div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-end gap-1.5 mt-0.5">
                <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700/60">UPI</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700/60">Cards</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700/60">NetBanking</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Monthly / Annual Pricing Toggle */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Flexible Plans for Every Developer & Team
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Locked features require an upgraded subscription. Click any locked feature to inspect and unlock. Instant activation via Razorpay.
          </p>
        </div>

        {/* PRICING TOGGLE */}
        <div className="inline-flex items-center justify-center p-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700 scale-100'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700 scale-100'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>Annual</span>
            <span className="bg-zinc-900 text-white dark:bg-white dark:text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* PRIMARY PRICING CARDS (FREE, PRO, MAX) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch pt-6">
        
        {/* CARD 1: FREE */}
        <div className="relative pt-4 flex flex-col h-full">
          <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 flex-1 flex flex-col justify-between hover:-translate-y-1.5 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 shadow-md dark:shadow-lg group h-full">
            <div className="flex-1 flex flex-col space-y-4">
              {/* 1. PLAN NAME */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-wider uppercase">FREE</h3>
                <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                  Starter
                </span>
              </div>

              {/* 2. DESCRIPTION */}
              <p className="text-xs text-zinc-600 dark:text-zinc-400 min-h-[36px] leading-relaxed">
                "Essential AI assistance for everyday questions and basic experimentation."
              </p>

              {/* 3. PRICE */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {billingCycle === 'monthly' ? '₹0' : '₹0'}
                  <span className="text-xs text-zinc-500 font-normal"> / {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
              </div>

              {/* 4. USAGE LIMIT */}
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-2">
                <Flame className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>1,000 messages per month (resets to 0 every month)</span>
              </div>

              {/* 5. INCLUDED FEATURES */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Included in Free:</div>
                {[
                  '1,000 messages per month (resets to 0 monthly)',
                  'AVO 4o & AVO Flash models',
                  'Standard response queue',
                  'Basic conversation history',
                  'Community forum support',
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-zinc-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{feat}</span>
                  </div>
                ))}
              </div>

              {/* 6. LOCKED FEATURES ON FREE TIER */}
              <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>Locked Features (Requires Upgrade):</span>
                </div>
                {[
                  { title: 'AVO 4o, AVO 4o Pro, AVO Flash & AVO Omni models', label: 'AVO 4o Pro & Deep Reasoning Models', plan: 'PRO' as const },
                  { title: 'Code generation and debugging', label: 'Code Sandbox & Live Preview', plan: 'PRO' as const },
                  { title: 'PDF and document analysis', label: 'PDF & Document Vision OCR (AVO Omni)', plan: 'PRO' as const },
                  { title: 'Priority response speed', label: 'Sub-100ms Priority Queue', plan: 'PRO' as const },
                  { title: 'Image understanding', label: 'Multimodal Image Vision (AVO Omni)', plan: 'PRO' as const },
                  { title: 'Longer conversation context', label: 'Extended 128k Context Memory', plan: 'PRO' as const },
                  { title: 'API access', label: 'Developer API & Webhooks Access', plan: 'MAX' as const },
                  { title: 'GitHub integration', label: 'Native GitHub & CI/CD Push', plan: 'MAX' as const },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleFeatureClick(item.title, item.plan)}
                    className="w-full text-left p-1.5 -mx-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60 flex items-center justify-between text-zinc-500 dark:text-zinc-400 group/item cursor-pointer transition-all"
                    title="Click to see upgrade options for this feature"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span className="truncate group-hover/item:text-zinc-900 dark:group-hover/item:text-zinc-200 font-medium">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded-md shrink-0 uppercase">
                      Upgrade
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA BUTTON */}
            <div className="pt-6 mt-auto shrink-0">
              <button
                type="button"
                onClick={() => handleSelectPlan('FREE', '₹0', '₹0')}
                className="w-full py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-bold text-xs cursor-pointer transition-colors text-center border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-1.5"
              >
                Current Starter Plan
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: PRO (MOST POPULAR) */}
        <div className="relative pt-4 flex flex-col h-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-zinc-900 dark:border-white shadow-md text-center whitespace-nowrap z-30 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400 dark:text-amber-500 fill-amber-400" />
            <span>MOST POPULAR</span>
          </div>

          <div className="relative rounded-2xl p-[2px] overflow-hidden shadow-xl dark:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 group flex-1 flex flex-col border border-zinc-200 dark:border-transparent h-full">
            <div className="absolute inset-[-100%] animate-spin-beam bg-[conic-gradient(from_0deg,transparent_0_300deg,#18181b_330deg,transparent_360deg)] dark:bg-[conic-gradient(from_0deg,transparent_0_300deg,#ffffff_330deg,transparent_360deg)] pointer-events-none" />

            <div className="relative rounded-[14px] bg-white dark:bg-zinc-900 p-5 sm:p-6 flex-1 flex flex-col justify-between h-full z-10">
              <div className="flex-1 flex flex-col space-y-4 pt-1">
                {/* 1. PLAN NAME */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-wider uppercase flex items-center gap-1.5">
                    <span>PRO</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                      Unlock All
                    </span>
                  </h3>
                  <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                    Power User
                  </span>
                </div>

                {/* 2. DESCRIPTION */}
                <p className="text-xs text-zinc-600 dark:text-zinc-300 min-h-[36px] leading-relaxed">
                  "Advanced AI intelligence for developers, creators, students, and power users."
                </p>

                {/* 3. PRICE */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {billingCycle === 'monthly' ? '₹999' : '₹9,588'}
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal"> / {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                      Equivalent to ₹799 / month (Billed annually • Save ₹2,400)
                    </div>
                  )}
                </div>

                {/* 4. USAGE LIMIT */}
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
                  <span>2,000 AI messages per month</span>
                </div>

                {/* 5. FEATURE LIST */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200">
                  <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Features Unlocked in Pro:</span>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-normal lowercase">click to preview</span>
                  </div>
                  {[
                    '2,000 AI messages per month',
                    'AVO 4o, AVO 4o Pro, AVO Flash & AVO Omni models',
                    'Priority response speed',
                    'Code generation and debugging',
                    'PDF and document analysis',
                    'Image understanding',
                    'Longer conversation context',
                    'Custom instructions & memory',
                    'Priority support',
                  ].map((feat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFeatureClick(feat, 'PRO')}
                      className="w-full text-left p-1.5 -mx-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between group/feat cursor-pointer transition-colors"
                      title="Click to view details & upgrade options"
                    >
                      <div className="flex items-start gap-2 font-medium truncate">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-white shrink-0 mt-0.5" />
                        <span className="leading-tight truncate group-hover/feat:text-blue-600 dark:group-hover/feat:text-blue-300">{feat}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover/feat:text-zinc-200 opacity-0 group-hover/feat:opacity-100 transition-opacity">
                        Details →
                      </span>
                    </button>
                  ))}
                </div>

                {/* LOCKED FEATURES ON PRO TIER (REQUIRES MAX) */}
                <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                  <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span>Locked Features (Requires Max):</span>
                  </div>
                  {[
                    { title: 'Advanced reasoning model', label: 'AVO Deep Thinker Formal Logic', plan: 'MAX' as const },
                    { title: 'Advanced codebase analysis', label: 'Full Git Repo AST Analysis', plan: 'MAX' as const },
                    { title: 'API access', label: 'Developer API & Webhooks Access', plan: 'MAX' as const },
                    { title: 'GitHub integration', label: 'Native GitHub & CI/CD Push', plan: 'MAX' as const },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFeatureClick(item.title, item.plan)}
                      className="w-full text-left p-1.5 -mx-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60 flex items-center justify-between text-zinc-500 dark:text-zinc-400 group/item cursor-pointer transition-all"
                      title="Click to see upgrade options for this feature"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                        <span className="truncate group-hover/item:text-zinc-900 dark:group-hover/item:text-zinc-200 font-medium">{item.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded-md shrink-0 uppercase">
                        Upgrade
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. CTA BUTTON */}
              <div className="pt-6 mt-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectPlan('PRO', '₹999', '₹9,588')}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-extrabold text-xs cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2 group/btn"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-4 h-4 text-white dark:text-black transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: MAX */}
        <div className="relative pt-4 flex flex-col h-full">
          <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 flex-1 flex flex-col justify-between hover:-translate-y-1.5 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 shadow-md dark:shadow-lg group h-full">
            <div className="flex-1 flex flex-col space-y-4">
              {/* 1. PLAN NAME */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-wider uppercase">MAX</h3>
                <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                  Dev & Reasoning
                </span>
              </div>

              {/* 2. DESCRIPTION */}
              <p className="text-xs text-zinc-600 dark:text-zinc-400 min-h-[36px] leading-relaxed">
                "Maximum AI capability for heavy users, senior developers, and deep research."
              </p>

              {/* 3. PRICE */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {billingCycle === 'monthly' ? '₹2,499' : '₹23,988'}
                  <span className="text-xs text-zinc-500 font-normal"> / {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                    Equivalent to ₹1,999 / month (Billed annually • Save ₹6,000)
                  </div>
                )}
              </div>

              {/* 4. USAGE LIMIT */}
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>10,000 AI messages per month</span>
              </div>

              {/* 5. FEATURE LIST */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Features Unlocked in Max:</span>
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 font-normal lowercase">click to preview</span>
                </div>
                {[
                  '10,000 AI messages per month',
                  'Everything in Pro',
                  'Advanced reasoning model',
                  'Advanced codebase analysis',
                  'GitHub integration',
                  'API access',
                  'Early access to new features',
                ].map((feat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleFeatureClick(feat, 'MAX')}
                    className="w-full text-left p-1.5 -mx-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between group/feat cursor-pointer transition-colors"
                    title="Click to view details & upgrade options"
                  >
                    <div className="flex items-start gap-2 font-medium truncate">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-zinc-300 shrink-0 mt-0.5" />
                      <span className="leading-tight truncate group-hover/feat:text-blue-600 dark:group-hover/feat:text-blue-300">{feat}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 group-hover/feat:text-zinc-200 opacity-0 group-hover/feat:opacity-100 transition-opacity">
                      Details →
                    </span>
                  </button>
                ))}
              </div>

              {/* LOCKED FEATURES ON MAX TIER (REQUIRES BUSINESS/ENTERPRISE) */}
              <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>Locked Features (Requires Business):</span>
                </div>
                {[
                  { title: 'Shared team workspace', label: '5 Team Seats & Shared Workspace', plan: 'BUSINESS' as const },
                  { title: 'Admin dashboard', label: 'Centralized Admin & RBAC Controls', plan: 'BUSINESS' as const },
                  { title: 'Dedicated infrastructure', label: 'Dedicated VPC & Custom SLA', plan: 'ENTERPRISE' as const },
                  { title: 'Custom enterprise security', label: 'SOC2 Type II & HIPAA Compliance', plan: 'ENTERPRISE' as const },
                  { title: 'Custom domain models', label: 'Custom Fine-Tuned Domain Models', plan: 'ENTERPRISE' as const },
                  { title: 'Dedicated account manager', label: 'Dedicated Customer Success Manager', plan: 'ENTERPRISE' as const },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleFeatureClick(item.title, item.plan)}
                    className="w-full text-left p-1.5 -mx-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60 flex items-center justify-between text-zinc-500 dark:text-zinc-400 group/item cursor-pointer transition-all"
                    title="Click to see upgrade options for this feature"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span className="truncate group-hover/item:text-zinc-900 dark:group-hover/item:text-zinc-200 font-medium">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded-md shrink-0 uppercase">
                      Upgrade
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. CTA BUTTON */}
            <div className="pt-6 mt-auto shrink-0">
              <button
                type="button"
                onClick={() => handleSelectPlan('MAX', '₹2,499', '₹23,988')}
                className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-colors text-center border border-zinc-900 dark:border-zinc-700 flex items-center justify-center gap-1.5 group/btn"
              >
                <span>Upgrade to Max</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-400 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ACTION BAR: EXPLORE ALL PLANS & DETAILED COMPARISON TABLE BUTTONS */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-6 pb-2">
        <button
          type="button"
          onClick={() => setShowAllPlans(!showAllPlans)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer hover:scale-105"
        >
          <span>{showAllPlans ? 'Hide Business & Enterprise' : 'Explore Business & Enterprise Plans'}</span>
          <ChevronDown className={`w-4 h-4 text-zinc-900 dark:text-white transition-transform duration-300 ${showAllPlans ? 'rotate-180' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => setShowComparisonTable(!showComparisonTable)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer hover:scale-105"
        >
          <Layers className="w-4 h-4" />
          <span>{showComparisonTable ? 'Hide Feature Comparison Table' : 'View Full Locked vs Unlocked Matrix'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showComparisonTable ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* DETAILED FEATURE COMPARISON TABLE (LOCKED VS UNLOCKED MATRIX) */}
      {showComparisonTable && (
        <div className="max-w-6xl mx-auto pt-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Feature Comparison Matrix (Locked vs Unlocked)</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Click any locked feature row below to see the upgrade options.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" /> Included
                </span>
                <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-medium ml-2">
                  <Lock className="w-3.5 h-3.5" /> Locked (Upgrade)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider min-w-[200px]">Capability</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-center">Free</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-center text-blue-600 dark:text-blue-400">Pro (₹999)</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-center">Max (₹2,499)</th>
                    <th className="py-3 px-3 font-bold uppercase tracking-wider text-center">Business (₹5,999)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                  {[
                    { feat: 'Monthly AI Message Limit', free: '1,000 msgs', pro: '2,000 msgs', max: '10,000 msgs', bus: '25,000 msgs', plan: 'PRO' as const },
                    { feat: 'AVO 4o, AVO 4o Pro, AVO Flash & AVO Omni models', label: 'AVO 4o, AVO 4o Pro, Flash & Omni Suite', free: false, pro: true, max: true, bus: true, plan: 'PRO' as const },
                    { feat: 'Code generation and debugging', label: 'Full Code Sandbox & Live Execution', free: false, pro: true, max: true, bus: true, plan: 'PRO' as const },
                    { feat: 'PDF and document analysis', label: 'PDF & Document Vision OCR (AVO Omni)', free: false, pro: true, max: true, bus: true, plan: 'PRO' as const },
                    { feat: 'Priority response speed', label: 'Sub-100ms Priority Queue', free: false, pro: true, max: true, bus: true, plan: 'PRO' as const },
                    { feat: 'Image understanding', label: 'Multimodal Image Vision (AVO Omni)', free: false, pro: true, max: true, bus: true, plan: 'PRO' as const },
                    { feat: 'Advanced reasoning model', label: 'AVO Deep Thinker (Formal Logic Engine)', free: false, pro: false, max: true, bus: true, plan: 'MAX' as const },
                    { feat: 'Advanced codebase analysis', label: 'Full Git Repo AST Code Analysis', free: false, pro: false, max: true, bus: true, plan: 'MAX' as const },
                    { feat: 'API access', label: 'REST API & Webhooks Access', free: false, pro: false, max: true, bus: true, plan: 'MAX' as const },
                    { feat: 'Shared team workspace', label: 'Multi-User Team Seats & RBAC', free: false, pro: false, max: false, bus: true, plan: 'BUSINESS' as const },
                    { feat: 'Admin dashboard', label: 'Centralized Admin Dashboard & Billing', free: false, pro: false, max: false, bus: true, plan: 'BUSINESS' as const },
                  ].map((row, idx) => (
                    <tr
                      key={idx}
                      onClick={() => handleFeatureClick(row.feat, row.plan)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                      title="Click row to see feature details & upgrade options"
                    >
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white flex items-center justify-between gap-2">
                        <span>{row.label || row.feat}</span>
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 underline font-normal hidden sm:inline">Upgrade →</span>
                      </td>

                      {/* FREE */}
                      <td className="py-3 px-3 text-center">
                        {typeof row.free === 'string' ? (
                          <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">{row.free}</span>
                        ) : row.free ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </td>

                      {/* PRO */}
                      <td className="py-3 px-3 text-center bg-blue-500/5 dark:bg-blue-500/10">
                        {typeof row.pro === 'string' ? (
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.pro}</span>
                        ) : row.pro ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </td>

                      {/* MAX */}
                      <td className="py-3 px-3 text-center">
                        {typeof row.max === 'string' ? (
                          <span className="font-mono font-bold">{row.max}</span>
                        ) : row.max ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </td>

                      {/* BUSINESS */}
                      <td className="py-3 px-3 text-center">
                        {typeof row.bus === 'string' ? (
                          <span className="font-mono font-bold">{row.bus}</span>
                        ) : row.bus ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-bold text-[10px] border border-zinc-200 dark:border-zinc-700">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECONDARY PLANS (BUSINESS & ENTERPRISE) */}
      {showAllPlans && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4 items-stretch animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* CARD 4: BUSINESS */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 flex-1 flex flex-col justify-between hover:-translate-y-1.5 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 shadow-md dark:shadow-lg group h-full">
            <div className="flex-1 flex flex-col space-y-4">
              {/* 1. PLAN NAME */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-wider uppercase">BUSINESS</h3>
                <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                  Teams
                </span>
              </div>

              {/* 2. DESCRIPTION */}
              <p className="text-xs text-zinc-600 dark:text-zinc-400 min-h-[36px] leading-relaxed">
                "Powerful AI workspace for engineering teams, startups, and growing organizations."
              </p>

              {/* 3. PRICE */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {billingCycle === 'monthly' ? '₹5,999' : '₹57,588'}
                  <span className="text-xs text-zinc-500 font-normal"> / {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                    Equivalent to ₹4,799 / month (Billed annually)
                  </div>
                )}
              </div>

              {/* 4. USAGE LIMIT */}
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>25,000 AI msgs • 5 seats</span>
              </div>

              {/* 5. FEATURE LIST (INTERACTIVE) */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300">
                {[
                  '25,000 AI messages per month',
                  '5 team members included',
                  'Everything in Max',
                  'Shared team workspace',
                  'Admin dashboard',
                  'Usage analytics',
                  'Role-based permissions',
                  'API access',
                ].map((feat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleFeatureClick(feat, 'BUSINESS')}
                    className="w-full text-left p-1.5 -mx-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between group/feat cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2 font-medium truncate">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-zinc-300 shrink-0 mt-0.5" />
                      <span className="leading-tight truncate group-hover/feat:text-blue-600 dark:group-hover/feat:text-blue-300">{feat}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 group-hover/feat:text-zinc-200 opacity-0 group-hover/feat:opacity-100 transition-opacity">
                      Details →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. CTA BUTTON */}
            <div className="pt-6 mt-auto shrink-0">
              <button
                type="button"
                onClick={() => handleSelectPlan('BUSINESS', '₹5,999', '₹57,588')}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-colors text-center border border-zinc-900 dark:border-zinc-700 flex items-center justify-center gap-1.5"
              >
                <span>Upgrade to Business</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-400" />
              </button>
            </div>
          </div>

          {/* CARD 5: ENTERPRISE */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 flex-1 flex flex-col justify-between hover:-translate-y-1.5 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 shadow-md dark:shadow-lg group h-full">
            <div className="flex-1 flex flex-col space-y-4">
              {/* 1. PLAN NAME */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-wider uppercase">ENTERPRISE</h3>
                <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                  Custom
                </span>
              </div>

              {/* 2. DESCRIPTION */}
              <p className="text-xs text-zinc-600 dark:text-zinc-400 min-h-[36px] leading-relaxed">
                "Enterprise-grade AI security, dedicated VPC clusters, and custom SLA for large organizations."
              </p>

              {/* 3. PRICE */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Custom
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Custom invoicing & SLA options</div>
              </div>

              {/* 4. USAGE LIMIT */}
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>Custom usage & unlimited seats</span>
              </div>

              {/* 5. FEATURE LIST */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300">
                {[
                  'Dedicated infrastructure',
                  'Unlimited team members',
                  'SSO / SAML authentication',
                  'Custom data retention & zero logging',
                  'Dedicated account manager',
                ].map((feat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleFeatureClick(feat, 'ENTERPRISE')}
                    className="w-full text-left p-1.5 -mx-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between group/feat cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2 font-medium truncate">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-zinc-300 shrink-0 mt-0.5" />
                      <span className="leading-tight truncate group-hover/feat:text-blue-600 dark:group-hover/feat:text-blue-300">{feat}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 group-hover/feat:text-zinc-200 opacity-0 group-hover/feat:opacity-100 transition-opacity">
                      Details →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. CTA BUTTON */}
            <div className="pt-6 mt-auto shrink-0">
              <button
                type="button"
                onClick={() => handleSelectPlan('ENTERPRISE', 'Custom', 'Custom')}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-colors text-center border border-zinc-900 dark:border-zinc-700 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-zinc-300" />
                <span>Contact Enterprise Sales</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Small Note Below Pricing Cards */}
      <div className="text-center pt-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
          <span>All plans include access to AVO AI's core engine and 256-bit encryption.</span>
        </p>
      </div>

      {/* FAQ SECTION */}
      <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-zinc-900 dark:text-white" />
            <span>Frequently Asked Questions</span>
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Everything you need to know about billing, limits, and Razorpay checkout.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
          {faqList.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-colors shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-4 py-3.5 text-left text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/50 pt-2 bg-zinc-50/70 dark:bg-zinc-950/40">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FEATURE LOCKED / UPGRADE MODAL POPUP */}
      {selectedLockedFeature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedLockedFeature(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                      {selectedLockedFeature.requiredPlan} Feature Locked
                    </span>
                    <span className="text-xs text-zinc-500">{selectedLockedFeature.category}</span>
                  </div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-white mt-1">
                    {selectedLockedFeature.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLockedFeature(null)}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {selectedLockedFeature.description}
              </p>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Key Highlights:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  {selectedLockedFeature.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Requires {selectedLockedFeature.requiredPlan} Subscription</span>
                  <div className="text-[11px] text-zinc-500">Instant activation with 30-day money back guarantee</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-sm text-zinc-900 dark:text-white font-mono">{selectedLockedFeature.monthlyPrice}/mo</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedLockedFeature(null);
                  handleSelectPlan(
                    selectedLockedFeature.requiredPlan,
                    selectedLockedFeature.monthlyPrice,
                    selectedLockedFeature.annualPrice
                  );
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to {selectedLockedFeature.requiredPlan} ({selectedLockedFeature.monthlyPrice})</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPricingPage}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5"
              >
                <span>Open Pricing Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT SALES MODAL */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-900 dark:text-zinc-100"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Contact Enterprise Sales</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Custom limits, SLA, and dedicated onboarding.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {contactSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-white mx-auto animate-bounce" />
                <h4 className="font-extrabold text-zinc-900 dark:text-white text-base">Request Submitted!</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
                  Our Indian Enterprise account representative will get in touch with you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="rahul@company.in"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">Company / Team</label>
                    <input
                      type="text"
                      required
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="Acme Tech"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">Team Size</label>
                    <select
                      value={contactForm.teamSize}
                      onChange={(e) => setContactForm({ ...contactForm, teamSize: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
                    >
                      <option value="5-15">5-15 seats</option>
                      <option value="15-50">15-50 seats</option>
                      <option value="50-200">50-200 seats</option>
                      <option value="200+">200+ seats</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">Requirements / Notes</label>
                  <textarea
                    rows={2}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us about your team's AI requirements..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
