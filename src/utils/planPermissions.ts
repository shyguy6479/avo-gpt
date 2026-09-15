export type PlanType = 'FREE' | 'PRO' | 'MAX' | 'BUSINESS' | 'ENTERPRISE';

export interface PlanLimits {
  name: string;
  monthlyMessages: number;
  allowedModels: string[]; // Model IDs or aliases
  description: string;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    name: 'Free Starter',
    monthlyMessages: 1000,
    allowedModels: [
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'avo-4o',
      'avo-flash',
    ],
    description: '1,000 messages/month • AVO 4o & AVO Flash • Standard response queue • Basic history • Community support'
  },
  PRO: {
    name: 'Pro Developer',
    monthlyMessages: 2000,
    allowedModels: [
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.6-pro',
      'gemini-3.8-flash',
      'avo-4o',
      'avo-flash',
      'avo-4o-pro',
      'avo-omni',
      'avo-omni-unified'
    ],
    description: '2,000 messages/month • AVO 4o, 4o Pro, Flash & Omni • Priority speed • Code generation & debugging • PDF/Doc OCR & Image vision • Custom instructions & Priority support'
  },
  MAX: {
    name: 'Max Reasoning & Logic',
    monthlyMessages: 10000,
    allowedModels: [
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.6-pro',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
      'avo-4o',
      'avo-flash',
      'avo-4o-pro',
      'avo-omni',
      'avo-deep-thinker',
      'avo-omni-unified'
    ],
    description: '10,000 messages/month • All 5 AVO Models including Deep Thinker • Deep AST codebase analysis • GitHub integration • API access'
  },
  BUSINESS: {
    name: 'Business Team',
    monthlyMessages: 25000,
    allowedModels: [
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.6-pro',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
      'avo-4o',
      'avo-flash',
      'avo-4o-pro',
      'avo-omni',
      'avo-deep-thinker',
      'avo-omni-unified'
    ],
    description: '25,000 messages/month • All Models • Multi-seat shared workspace • Admin dashboard & analytics'
  },
  ENTERPRISE: {
    name: 'Enterprise Dedicated',
    monthlyMessages: 100000,
    allowedModels: [
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.6-pro',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
      'avo-4o',
      'avo-flash',
      'avo-4o-pro',
      'avo-omni',
      'avo-deep-thinker',
      'avo-omni-unified'
    ],
    description: 'Dedicated cloud infrastructure & custom SLAs'
  }
};

/**
 * Normalizes a user plan string into a valid PlanType
 */
export function normalizeUserPlan(plan?: string | null): PlanType {
  if (!plan) return 'FREE';
  const clean = plan.trim().toUpperCase();
  if (clean === 'PRO') return 'PRO';
  if (clean === 'MAX' || clean === 'ULTRA') return 'MAX';
  if (clean === 'BUSINESS') return 'BUSINESS';
  if (clean === 'ENTERPRISE') return 'ENTERPRISE';
  return 'FREE';
}

/**
 * Checks if a model requires a paid plan or specific tier
 */
export function getRequiredPlanForModel(modelId?: string): 'FREE' | 'PRO' | 'MAX' {
  if (!modelId) return 'FREE';
  const m = modelId.toLowerCase().trim();
  if (m === 'gemini-3.1-pro-preview' || m === 'avo-deep-thinker') {
    return 'MAX';
  }
  if (m === 'gemini-3.6-pro' || m === 'avo-4o-pro' || m === 'gemini-3.5-pro' || m === 'gemini-3.8-flash' || m === 'avo-omni') {
    return 'PRO';
  }
  return 'FREE';
}

/**
 * Checks if a given model is allowed for the user's current plan
 */
export function isModelAllowedForUser(modelId: string | undefined, userPlan?: string | null): boolean {
  const plan = normalizeUserPlan(userPlan);
  const reqPlan = getRequiredPlanForModel(modelId);

  if (reqPlan === 'FREE') return true;
  if (reqPlan === 'PRO') {
    return plan === 'PRO' || plan === 'MAX' || plan === 'BUSINESS' || plan === 'ENTERPRISE';
  }
  if (reqPlan === 'MAX') {
    return plan === 'MAX' || plan === 'BUSINESS' || plan === 'ENTERPRISE';
  }
  return false;
}

/**
 * Custom event name dispatched when monthly message quota changes or resets
 */
export const QUOTA_UPDATE_EVENT = 'avo_monthly_quota_updated';

/**
 * Normalizes a user identifier (email or user ID) for consistent storage keys
 */
export function normalizeUserKey(userIdOrEmail?: string): string {
  if (!userIdOrEmail) return 'guest';
  const clean = userIdOrEmail.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  return clean || 'guest';
}

/**
 * Computes billing/calendar cycle reset information
 * The monthly cycle resets to 0 messages at 00:00:00 on the 1st of every month
 */
export function getCycleResetDetails(referenceDate: Date = new Date()) {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth(); // 0-indexed (e.g. 8 for September)
  
  // 1st of the next month at 00:00:00 local time
  const nextReset = new Date(currentYear, currentMonth + 1, 1, 0, 0, 0, 0);
  
  const diffMs = nextReset.getTime() - referenceDate.getTime();
  const daysUntilReset = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  
  const cycleMonth = referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const nextResetDate = nextReset.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const nextResetShort = nextReset.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const currentCycleKey = `${currentYear}_${String(currentMonth + 1).padStart(2, '0')}`;

  return {
    currentCycleKey,
    cycleMonth,
    nextResetDate,
    nextResetShort,
    daysUntilReset,
    nextResetTimestamp: nextReset.getTime()
  };
}

/**
 * Gets storage key for monthly message counting
 */
export function getMonthlyUsageStorageKey(userIdOrEmail?: string, referenceDate: Date = new Date()): string {
  const { currentCycleKey } = getCycleResetDetails(referenceDate);
  const userKey = normalizeUserKey(userIdOrEmail);
  return `avo_monthly_msg_count_${userKey}_${currentCycleKey}`;
}

/**
 * Cleans up old monthly usage keys from prior months to keep storage clean
 */
function cleanupOldMonthlyRecords(userKey: string, currentCycleKey: string) {
  if (typeof window === 'undefined') return;
  try {
    const prefix = `avo_monthly_msg_count_${userKey}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.endsWith(currentCycleKey)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage inspection errors
  }
}

/**
 * Retrieves the count of messages used this month.
 * Automatically evaluates to 0 when a new month arrives!
 */
export function getMonthlyMessagesUsed(userIdOrEmail?: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const { currentCycleKey } = getCycleResetDetails();
    const userKey = normalizeUserKey(userIdOrEmail);
    const key = `avo_monthly_msg_count_${userKey}_${currentCycleKey}`;
    
    // Check current month record
    const stored = localStorage.getItem(key);
    
    // Purge outdated monthly records in background
    cleanupOldMonthlyRecords(userKey, currentCycleKey);

    if (stored === null) {
      // New month or fresh user: starts at 0!
      return 0;
    }
    const count = parseInt(stored, 10);
    return isNaN(count) || count < 0 ? 0 : count;
  } catch {
    return 0;
  }
}

/**
 * Explicitly resets the monthly message count to zero for a user
 */
export function resetMonthlyQuotaToZero(userIdOrEmail?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const { currentCycleKey } = getCycleResetDetails();
    const userKey = normalizeUserKey(userIdOrEmail);
    const key = `avo_monthly_msg_count_${userKey}_${currentCycleKey}`;
    localStorage.setItem(key, '0');
    cleanupOldMonthlyRecords(userKey, currentCycleKey);
    window.dispatchEvent(new CustomEvent(QUOTA_UPDATE_EVENT, { detail: { count: 0, reset: true } }));
  } catch {
    // Ignore local storage error
  }
}

/**
 * Increments the monthly message count
 */
export function incrementMonthlyMessages(userIdOrEmail?: string): number {
  if (typeof window === 'undefined') return 1;
  try {
    const key = getMonthlyUsageStorageKey(userIdOrEmail);
    const current = getMonthlyMessagesUsed(userIdOrEmail);
    const next = current + 1;
    localStorage.setItem(key, next.toString());
    
    // Dispatch event so all components update immediately
    window.dispatchEvent(new CustomEvent(QUOTA_UPDATE_EVENT, { detail: { count: next } }));
    return next;
  } catch {
    return 1;
  }
}

export interface MonthlyQuotaInfo {
  plan: PlanType;
  planName: string;
  limit: number;
  used: number;
  remaining: number;
  isExceeded: boolean;
  percentUsed: number;
  cycleMonth: string;
  nextResetDate: string;
  nextResetShort: string;
  daysUntilReset: number;
  resetNotice: string;
}

/**
 * Gets quota limit details for current user with full monthly reset lifecycle info
 */
export function getMonthlyQuotaInfo(userIdOrEmail?: string, userPlan?: string | null): MonthlyQuotaInfo {
  const plan = normalizeUserPlan(userPlan);
  const planDetails = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const limit = planDetails.monthlyMessages || 1000;
  const used = getMonthlyMessagesUsed(userIdOrEmail);
  const remaining = Math.max(0, limit - used);
  const isExceeded = used >= limit;
  const percentUsed = Math.min(100, Math.round((used / limit) * 100));

  const { cycleMonth, nextResetDate, nextResetShort, daysUntilReset } = getCycleResetDetails();

  return {
    plan,
    planName: planDetails.name,
    limit,
    used,
    remaining,
    isExceeded,
    percentUsed,
    cycleMonth,
    nextResetDate,
    nextResetShort,
    daysUntilReset,
    resetNotice: `Resets to 0 in ${daysUntilReset} days (${nextResetShort})`
  };
}
