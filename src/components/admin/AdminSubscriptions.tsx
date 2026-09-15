import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Users,
  TrendingUp,
  Sparkles,
  Zap,
  Shield,
  ArrowUpRight
} from 'lucide-react';

export const AdminSubscriptions: React.FC = () => {
  const [plans] = useState([
    {
      name: 'Free Tier',
      price: '$0',
      period: 'forever',
      activeUsers: 1,
      models: 'Gemini 3.6 Flash',
      dailyLimit: '20 messages / day',
      features: ['Standard speed', 'Fast & Smart mode', 'Community support'],
    },
    {
      name: 'Pro Tier',
      price: '$20',
      period: 'per user / mo',
      activeUsers: 3,
      models: 'Gemini 3.6 Flash, OpenAI GPT-4o, NVIDIA Llama 3.3',
      dailyLimit: 'Unlimited messages',
      features: ['All primary models', 'Deep Council mode', 'Priority queue', 'Document analysis'],
      isPopular: true,
    },
    {
      name: 'Enterprise Tier',
      price: '$100',
      period: 'per seat / mo',
      activeUsers: 2,
      models: 'All models + OpenRouter DeepSeek-R1',
      dailyLimit: 'Unlimited + Dedicated throughput',
      features: ['Custom AI Routing', 'Dedicated SLA', 'Admin platform access', 'Direct API access'],
    },
  ]);

  const estimatedMRR = 3 * 20 + 2 * 100; // $260

  return (
    <div id="admin-subscriptions-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Subscriptions & Billing</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            User billing tiers, estimated revenue run-rate, and model entitlement matrix.
          </p>
        </div>
      </div>

      {/* Revenue & Tier Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a]">
          <div className="text-[10px] font-mono text-[#a1a1aa] uppercase">ESTIMATED MRR</div>
          <div className="text-2xl font-semibold text-white font-mono mt-1">${estimatedMRR}</div>
          <div className="text-[11px] text-[#ffffff] font-mono mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +25% active subscribers
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a]">
          <div className="text-[10px] font-mono text-[#a1a1aa] uppercase">PAID SUBSCRIBERS</div>
          <div className="text-2xl font-semibold text-[#ffffff] font-mono mt-1">5 users</div>
          <div className="text-[11px] text-[#71717a] font-mono mt-1">83.3% conversion rate</div>
        </div>

        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a]">
          <div className="text-[10px] font-mono text-[#a1a1aa] uppercase">PAYMENT GATEWAY</div>
          <div className="text-2xl font-semibold text-white font-mono mt-1">Stripe</div>
          <div className="text-[11px] text-[#ffffff] font-mono mt-1">Webhooks synchronized</div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-5 rounded-lg bg-[#09090b] border flex flex-col justify-between ${
              plan.isPopular ? 'border-[#3f3f46]' : 'border-[#27272a]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
                {plan.isPopular && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#18181b] text-[#ffffff] border border-[#3f3f46]">
                    MOST ACTIVE
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-white">{plan.price}</span>
                <span className="text-xs text-[#a1a1aa] font-mono">/{plan.period}</span>
              </div>

              <div className="mt-4 p-2.5 rounded bg-[#09090b] border border-[#27272a] text-xs font-mono flex items-center justify-between">
                <span className="text-[#a1a1aa]">Active accounts:</span>
                <span className="text-[#ffffff] font-semibold">{plan.activeUsers}</span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="text-[10px] font-mono text-[#71717a] uppercase">Features:</div>
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-[#a1a1aa]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#ffffff] shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#27272a] text-[11px] text-[#71717a] font-mono">
              Daily quota: <span className="text-[#a1a1aa]">{plan.dailyLimit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
