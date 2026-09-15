export interface AvoModelSpec {
  id: string;
  name: string;
  tag: string;
  requiredPlan: 'FREE' | 'PRO' | 'MAX';
  specialty: string;
  thinkingStyle: string;
  thinkingStatus: string;
  features: string[];
  contextWindow: string;
  speed: string;
  intelligence: string;
  description: string;
}

export const AVO_MODELS: AvoModelSpec[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'AVO 4o',
    tag: 'Balanced',
    requiredPlan: 'FREE',
    specialty: 'Everyday Intelligence & High-Velocity Problem Solving',
    thinkingStyle: 'Adaptive Context Synthesis',
    thinkingStatus: 'AVO 4o is synthesizing multi-domain context & refining insights...',
    features: ['Context Synthesis', 'Broad Domain Knowledge', 'Fast Interactive Dialogue', 'Live Web Grounding'],
    contextWindow: '1M Tokens',
    speed: 'Ultra-Fast',
    intelligence: 'Everyday 4o Intelligence',
    description: 'Flagship agile intelligence balancing deep comprehension with rapid everyday execution.'
  },
  {
    id: 'gemini-3.6-pro',
    name: 'AVO 4o Pro',
    tag: 'Systems & Code',
    requiredPlan: 'PRO',
    specialty: 'Complex Systems Architecture, Deep Code Engineering & Diagnostics',
    thinkingStyle: 'Multi-Tier Architectural Deduction',
    thinkingStatus: 'AVO 4o Pro is auditing architectural systems & validating edge cases...',
    features: ['Systems Architecture', 'Production-Grade Refactoring', 'Strict Type Checking', 'Fault-Tolerant Design'],
    contextWindow: '2M Tokens',
    speed: 'High Precision',
    intelligence: 'Advanced Engineering Pro',
    description: 'Heavyweight engineering model designed for complex multi-module systems, codebases, and technical audits.'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'AVO Flash',
    tag: 'Sub-Second',
    requiredPlan: 'FREE',
    specialty: 'Ultra-Low Latency Execution & Rapid Direct Answers',
    thinkingStyle: 'Direct Zero-Overhead Stream',
    thinkingStatus: 'AVO Flash is computing instant sub-second response...',
    features: ['Sub-Second TTFT', 'Zero-Preamble Output', 'Actionable Bullet Summaries', 'High Throughput'],
    contextWindow: '1M Tokens',
    speed: 'Sub-Second (<200ms)',
    intelligence: 'Direct Flash Stream',
    description: 'Streamlined, lightning-fast engine delivering immediate answers and instant takeaways with zero delay.'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'AVO Deep Thinker',
    tag: 'Formal Logic',
    requiredPlan: 'MAX',
    specialty: 'Mathematical Proofs, STEM Derivations & First-Principles Deductions',
    thinkingStyle: 'Exhaustive Step-by-Step Chain-of-Thought & Lemma Verification',
    thinkingStatus: 'AVO Deep Thinker is deriving first-principles proofs & verifying boundary conditions...',
    features: ['Formal Mathematical Proofs', 'STEM Derivations', 'Deductive Chain-of-Thought', 'Counter-Example Analysis'],
    contextWindow: '2M Tokens',
    speed: 'Deep Reasoning',
    intelligence: 'Formal Logic Master',
    description: 'Dedicated deep-reasoning engine that systematically works through multi-step logic, proofs, and STEM problems.'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'AVO Omni',
    tag: 'Multimodal',
    requiredPlan: 'PRO',
    specialty: 'Multimodal Vision OCR, Spatial Layouts & Rich Interactive Artifacts',
    thinkingStyle: 'Multimodal Spatial Inspection & Cross-Asset Synthesis',
    thinkingStatus: 'AVO Omni is inspecting visual layers & structuring interactive artifacts...',
    features: ['Vision OCR Extraction', 'Spatial Diagram Interpretation', 'UI/UX Blueprinting', 'Cross-Modal Synthesis'],
    contextWindow: '1M Tokens',
    speed: 'Fast Multimodal',
    intelligence: 'Omni Vision & Design',
    description: 'Unified visual and language specialist adept at OCR, diagrams, visual assets, and rich UI artifacts.'
  }
];

export function getModelSpec(modelId?: string): AvoModelSpec {
  if (!modelId) return AVO_MODELS[0];
  const m = modelId.toLowerCase().trim();
  if (m === 'gemini-3.6-pro' || m === 'avo-4o-pro' || m === 'gemini-3.5-pro') return AVO_MODELS[1];
  if (m === 'gemini-3.1-flash-lite' || m === 'avo-flash' || m === 'gemini-3-flash') return AVO_MODELS[2];
  if (m === 'gemini-3.1-pro-preview' || m === 'avo-deep-thinker') return AVO_MODELS[3];
  if (m === 'gemini-3.8-flash' || m === 'avo-omni') return AVO_MODELS[4];
  return AVO_MODELS[0];
}
