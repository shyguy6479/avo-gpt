import { FeatureItem, TestimonialItem, PricingPlan, FaqItem } from '../types';

export const TRUSTED_COMPANIES = [
  { name: 'Linear', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { name: 'Vercel', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { name: 'Stripe', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { name: 'Notion', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { name: 'Figma', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { name: 'Raycast', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' }
];

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: 'ai-conversations',
    title: 'AI Conversations',
    description: 'Context-aware intelligent dialogues powered by advanced LLM reasoning and real-time streaming.',
    icon: 'MessageSquareText',
    badge: 'Popular'
  },
  {
    id: 'image-understanding',
    title: 'Image Understanding',
    description: 'Upload screenshots, mockups, or diagrams to extract insights, generate code, or convert designs.',
    icon: 'Image',
    badge: 'Multimodal'
  },
  {
    id: 'voice-chat',
    title: 'Voice Chat',
    description: 'Seamless hands-free voice dictation and high-fidelity text-to-speech audio synthesis.',
    icon: 'Mic'
  },
  {
    id: 'document-analysis',
    title: 'Document Analysis',
    description: 'Parse lengthy PDFs, spreadsheets, and markdown docs into key executive summaries instantly.',
    icon: 'FileText'
  },
  {
    id: 'fast-responses',
    title: 'Fast Responses',
    description: 'Sub-second initial token delivery with ultra-low latency serverless infrastructure.',
    icon: 'Zap',
    badge: 'Ultra Fast'
  },
  {
    id: 'multi-language',
    title: 'Multi-language Support',
    description: 'Flawlessly translate and converse across 50+ international languages with natural nuance.',
    icon: 'Globe'
  },
  {
    id: 'secure-private',
    title: 'Secure & Private',
    description: 'SOC2 Type II compliant with end-to-end encryption. Your data is never used for training.',
    icon: 'ShieldCheck'
  },
  {
    id: '247-availability',
    title: '24/7 Availability',
    description: 'Guaranteed 99.99% uptime with global edge node distribution for zero downtime.',
    icon: 'Clock'
  }
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Principal Product Designer',
    company: 'Linear',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    content: 'AVO AI has completely redefined our internal design review workflow. The UI is so refined, fast, and thoughtful that it feels like a native Apple application.'
  },
  {
    id: '2',
    name: 'Marcus Vance',
    role: 'VP of Engineering',
    company: 'Vercel Labs',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    content: 'The low-latency streaming and code block handling are unmatched. We integrated AVO AI into our developer docs and user support satisfaction jumped by 40%.'
  },
  {
    id: '3',
    name: 'Elena Rostova',
    role: 'Founder & CEO',
    company: 'Craft Studio',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    content: 'Finally an AI tool that respects craftsmanship! No tacky gradient clutter, just pure typographic precision, instant document summarization, and silky smooth micro-interactions.'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    description: 'Essential AI assistance for everyday questions and experimentation.',
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      '500 messages per month',
      'AVO Flash & AVO 4o models',
      'Standard response speed',
      'Basic web search grounding',
      'Community support'
    ],
    cta: 'Get Started Free'
  },
  {
    id: 'pro',
    name: 'AVO Pro',
    description: 'Supercharged intelligence for developers, creators, and daily power users.',
    priceMonthly: 999,
    priceAnnual: 799,
    isPopular: true,
    features: [
      '2,000 messages per month',
      'AVO 4o, AVO 4o Pro, AVO Flash & AVO Omni models',
      'Document & PDF OCR Analysis',
      'Custom Instructions & Memory',
      'Priority Sub-100ms Speed',
      'Code Studio & Sandboxing'
    ],
    cta: 'Subscribe to Pro'
  },
  {
    id: 'max',
    name: 'AVO Max',
    description: 'Deep reasoning, codebase indexing, and maximum context length.',
    priceMonthly: 2499,
    priceAnnual: 1999,
    features: [
      '10,000 messages per month',
      'AVO Deep Thinker (Formal Logic)',
      'All 5 AVO AI Models Included',
      'Codebase & Repo Analysis',
      'GitHub / Workspace Integration',
      '2M Token Context Window',
      'API Key Access & Export'
    ],
    cta: 'Get Max Plan'
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Collaborative AI workspace with team seats and centralized admin.',
    priceMonthly: 5999,
    priceAnnual: 4799,
    features: [
      '25,000 messages per month',
      '5 Included Team Seats',
      'Admin Billing & Analytics',
      'Shared Team Prompts & Docs',
      'Dedicated Support SLA'
    ],
    cta: 'Get Business Plan'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom security, dedicated infrastructure, and team management.',
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      'Custom message volumes',
      'Unlimited Team Seats',
      'Dedicated Private Cloud Run',
      'Zero Data Retention SLA',
      'SAML / SSO Authentication',
      '24/7 Dedicated Account Manager'
    ],
    cta: 'Contact Enterprise Sales'
  }
];

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How is AVO AI different from standard AI chatbots?',
    answer: 'AVO AI focuses on design elegance, sub-second latency, and multi-modal versatility. Built with Apple and Linear-inspired aesthetics, it offers clean typography, instant markdown parsing, and zero clutter so you can focus on work.'
  },
  {
    id: 'faq-2',
    question: 'Is my data used to train AI models?',
    answer: 'No. AVO AI adheres to strict SOC2 Type II compliance and zero data retention standards. Your conversations and uploaded documents are strictly private and never used to train public models.'
  },
  {
    id: 'faq-3',
    question: 'Can I upload files, images, and code repositories?',
    answer: 'Yes! AVO AI natively supports image analysis (screenshots, UI designs), PDF document summarization, and full syntax highlighting for over 30 programming languages.'
  },
  {
    id: 'faq-4',
    question: 'How does voice input and audio synthesis work?',
    answer: 'You can dictate prompts naturally via your device microphone. AVO AI transcribes audio with high fidelity and can generate spoken audio responses in real-time.'
  },
  {
    id: 'faq-5',
    question: 'Can I cancel or change my subscription plan at any time?',
    answer: 'Absolutely. You can upgrade, downgrade, or cancel your subscription from your account dashboard with a single click at any time without hidden fees.'
  }
];

export const SUGGESTED_PROMPTS = [
  {
    title: 'Summarize Document',
    subtitle: 'Extract key takeaways from a long PDF or paper',
    icon: 'FileText',
    prompt: 'Can you summarize the main findings and action points from a standard quarterly tech report?'
  },
  {
    title: 'Code Refactoring',
    subtitle: 'Optimize React TypeScript hooks for performance',
    icon: 'Code',
    prompt: 'Show me how to refactor a custom React hook to prevent unnecessary re-renders using useMemo and useCallback.'
  },
  {
    title: 'Analyze UI Design',
    subtitle: 'Review design heuristics and typography scale',
    icon: 'Palette',
    prompt: 'What are the key principles of a minimal 8px grid system with high typographic hierarchy?'
  },
  {
    title: 'Draft Product Brief',
    subtitle: 'Create a product spec for a new feature',
    icon: 'Sparkles',
    prompt: 'Draft a crisp product requirement document (PRD) for adding dark mode toggle to a web app.'
  }
];
