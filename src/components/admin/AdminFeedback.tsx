import React, { useState } from 'react';
import {
  MessageSquareHeart,
  ThumbsUp,
  ThumbsDown,
  Star,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const AdminFeedback: React.FC = () => {
  const [feedbackList] = useState([
    {
      id: 'fb_101',
      userName: 'Sarah Connor',
      userEmail: 'sarah.c@cyberdyne.io',
      rating: 5,
      type: 'positive',
      model: 'Gemini 3.6 Flash',
      comment: 'The multi-model consensus answer was incredibly accurate and nuanced for my system design review.',
      timestamp: '2 hours ago',
    },
    {
      id: 'fb_102',
      userName: 'David Miller',
      userEmail: 'david.m@apexlabs.dev',
      rating: 5,
      type: 'positive',
      model: 'NVIDIA Llama 3.3',
      comment: 'Instantaneous response speeds in Fast Mode. Perfect for rapid coding queries.',
      timestamp: '5 hours ago',
    },
    {
      id: 'fb_103',
      userName: 'Elena Rostova',
      userEmail: 'elena@matrixstudio.co',
      rating: 4,
      type: 'positive',
      model: 'OpenAI GPT-4o',
      comment: 'Image generation prompt took around 4 seconds, quality was very crisp.',
      timestamp: '1 day ago',
    },
    {
      id: 'fb_104',
      userName: 'Priya Sharma',
      userEmail: 'priya.s@zenith-ai.in',
      rating: 5,
      type: 'positive',
      model: 'Gemini 3.6 Flash',
      comment: 'Love the document analysis and clean markdown renderings.',
      timestamp: '2 days ago',
    },
  ]);

  return (
    <div id="admin-feedback-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">User Feedback</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Model answer ratings, qualitative comments, and user sentiment analysis.
          </p>
        </div>
      </div>

      {/* Satisfaction Score */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a]">
          <div className="text-[10px] font-mono text-[#a1a1aa] uppercase">POSITIVE SENTIMENT</div>
          <div className="text-2xl font-semibold text-[#ffffff] font-mono mt-1">96.8%</div>
          <div className="text-[11px] text-[#71717a] font-mono mt-1">From 182 user ratings</div>
        </div>

        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a]">
          <div className="text-[10px] font-mono text-[#a1a1aa] uppercase">AVG STAR RATING</div>
          <div className="text-2xl font-semibold text-white font-mono mt-1">4.8 / 5.0</div>
          <div className="text-[11px] text-[#ffffff] font-mono mt-1">★★★★★ Excellent</div>
        </div>

        <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a]">
          <div className="text-[10px] font-mono text-[#a1a1aa] uppercase">HALLUCINATION FLAGS</div>
          <div className="text-2xl font-semibold text-white font-mono mt-1">0 reported</div>
          <div className="text-[11px] text-[#ffffff] font-mono mt-1">Verification guard active</div>
        </div>
      </div>

      {/* Feedback Feed */}
      <div className="space-y-3">
        {feedbackList.map((fb) => (
          <div
            key={fb.id}
            className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{fb.userName}</span>
                <span className="text-xs text-[#a1a1aa] font-mono">({fb.userEmail})</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#18181b] text-[#ffffff] border border-[#27272a]">
                  {fb.model}
                </span>
              </div>
              <span className="text-xs text-[#71717a] font-mono">{fb.timestamp}</span>
            </div>

            <p className="text-xs text-[#e4e4e7] leading-relaxed italic">"{fb.comment}"</p>

            <div className="flex items-center gap-1 text-[#ffffff] text-xs">
              {Array.from({ length: fb.rating }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
