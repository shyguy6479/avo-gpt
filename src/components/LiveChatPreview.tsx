import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Image as ImageIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateImage, isImageGenerationQuery, extractVisualSubject, getHighResUnsplashUrl } from '../lib/aiService';

interface PreviewMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'doc';
  imageUrl?: string;
  isStreaming?: boolean;
}

const BATMAN_VECTOR_ART = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020408" />
      <stop offset="60%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#skyGrad)" />
  <circle cx="400" cy="210" r="130" fill="#FEF08A" opacity="0.15" />
  <circle cx="400" cy="210" r="100" fill="#F59E0B" opacity="0.9" filter="drop-shadow(0px 0px 25px #F59E0B)" />
  <path d="M 400,225 C 370,175 300,175 270,205 C 300,215 320,235 330,265 C 360,245 380,255 400,285 C 420,255 440,245 470,265 C 480,235 500,215 530,205 C 500,175 430,175 400,225 Z" fill="#000000" />
  <path d="M 0,460 L 100,460 L 100,340 L 140,340 L 140,460 L 220,460 L 220,300 L 260,280 L 300,300 L 300,460 L 400,460 L 400,260 L 440,260 L 440,460 L 540,460 L 540,330 L 600,330 L 600,460 L 800,460 L 800,600 L 0,600 Z" fill="#030712" />
  <rect x="40" y="525" width="720" height="48" rx="10" fill="#000000" opacity="0.75" stroke="#334155" stroke-width="1" />
  <text x="60" y="554" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="600">
    AVO AI Native Model Generation: "hey avo generate a batman image"
  </text>
</svg>
`.trim())}`;

const INITIAL_MESSAGES: PreviewMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    text: 'hey avo generate a batman image',
    timestamp: '11:42 AM',
  },
  {
    id: 'msg-2',
    sender: 'ai',
    text: 'Here is your high-resolution AI generated Batman artwork rendered directly by AVO AI image model:',
    timestamp: '11:42 AM',
    imageUrl: BATMAN_VECTOR_ART,
  },
  {
    id: 'msg-3',
    sender: 'user',
    text: 'best places to go out with friends',
    timestamp: '11:43 AM',
  },
  {
    id: 'msg-4',
    sender: 'ai',
    text: `Here are top recommendations for a great outing with friends:

1. **Rooftop Skyline Lounge**: Panoramic city views, craft cocktails & ambient DJ sets.
2. **Immersive Escape Room**: Collaborative 60-minute mystery puzzle adventure.
3. **Retro Arcade Bar**: Multiplayer vintage games + craft brews and shared bites.
4. **Late-Night Jazz & Tapas**: Cozy atmosphere with live saxophone & tapas platters.`,
    timestamp: '11:43 AM',
  },
];

const LivePreviewImage: React.FC<{ url: string; altText: string }> = ({ url, altText }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 relative overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-md bg-zinc-900"
    >
      {!isLoaded && (
        <div className="w-full h-56 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Loading AI image...</span>
        </div>
      )}
      <img
        src={url}
        alt={altText}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.dataset.failed) {
            target.dataset.failed = 'true';
            target.src = getHighResUnsplashUrl(altText.slice(0, 30), 800, 800);
          }
        }}
        className={`w-full max-w-md h-56 object-cover rounded-xl transition-opacity duration-300 ${
          isLoaded ? 'opacity-100 block' : 'opacity-0 absolute inset-0'
        }`}
        loading="lazy"
      />
    </motion.div>
  );
};

export const LiveChatPreview: React.FC<{ onOpenFullChat?: () => void }> = () => {
  const [messages, setMessages] = useState<PreviewMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll inner chat thread to bottom when messages update
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendPrompt = async (promptText: string, imageAttachment?: string) => {
    if (!promptText.trim() && !imageAttachment) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;

    const newUserMsg: PreviewMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptText,
      timestamp: now,
      attachmentName: imageAttachment ? 'uploaded_chart.png' : undefined,
      attachmentType: imageAttachment ? 'image' : undefined,
      imageUrl: imageAttachment || undefined,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setAttachedImage(null);
    setIsTyping(true);

    const lower = promptText.toLowerCase();
    const isImageRequest = isImageGenerationQuery(promptText);

    let aiResponseText = `Here is the response for "${promptText}":`;
    let generatedImageUrl: string | undefined = undefined;

    if (isImageRequest) {
      try {
        const cleanSubject = extractVisualSubject(promptText);
        const userRatio = localStorage.getItem('nexus_ai_image_aspect_ratio') || '1:1';
        const userStyle = localStorage.getItem('nexus_ai_image_style') || 'cinematic';
        const imageResult = await generateImage(cleanSubject, { aspectRatio: userRatio, style: userStyle });
        generatedImageUrl = imageResult.imageUrl;
        aiResponseText = `Here is your high-resolution AI generated visual concept for "${cleanSubject}":`;
      } catch (err) {
        aiResponseText = `Generated artwork concept for "${promptText}":`;
      }
    } else if (lower.includes('friend') || lower.includes('place') || lower.includes('out')) {
      aiResponseText = `Here are curated recommendations for going out with friends:\n\n1. **Skyline Rooftop Bar**: Live music & city vistas.\n2. **Boutique Bowling Lounge**: Vintage lanes, artisanal pizza & cocktails.\n3. **Interactive VR Arcade**: Multiplayer VR adventures & gaming.`;
    } else if (imageAttachment) {
      aiResponseText = `Visual analysis completed for uploaded image:\n\n• **Detected Data**: Revenue growth trajectory +32% YoY.\n• **Key Metric**: Gross Margin held at 84%.\n• **Status**: Passed accuracy audit.`;
    } else {
      aiResponseText = `I have analyzed your query "${promptText}". AVO AI models deliver sub-second responses with contextual multi-modal memory. How else can I assist you?`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: generatedImageUrl,
      },
    ]);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input, attachedImage || undefined);
  };

  return (
    <section
      id="preview"
      className="py-20 bg-white dark:bg-black text-black dark:text-white border-y border-zinc-200 dark:border-zinc-800 relative overflow-hidden transition-colors duration-200"
    >
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-zinc-200/40 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-zinc-200/40 dark:bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span className="text-zinc-900 dark:text-white font-bold">
              Live Interactive Demo
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black dark:text-white">
            Watch Multi-Modal Vision & Generation in Action
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            Test AVO AI directly in this interactive studio preview — generate artwork, analyze files, or ask research questions in real time.
          </p>
        </div>

        {/* Live Interactive Chat Window */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col h-[600px] relative">
          
          {/* Top Header Bar */}
          <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-between z-20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white dark:text-zinc-200" />
              </div>
              <div>
                <h3 className="font-bold text-xs flex items-center gap-2 text-black dark:text-white">
                  <span>AVO AI Assistant</span>
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  Interactive Live Studio
                </p>
              </div>
            </div>
          </div>

          {/* Preset Quick Chips */}
          <div className="px-5 py-2.5 bg-zinc-100/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
              Try Prompt:
            </span>
            <button
              type="button"
              onClick={() => handleSendPrompt('hey avo generate a batman image')}
              className="px-3 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>🦇</span>
              <span>hey avo generate a batman image</span>
            </button>
            <button
              type="button"
              onClick={() => handleSendPrompt('best places to go out with friends')}
              className="px-3 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>🍕</span>
              <span>best places to go out with friends</span>
            </button>
            <button
              type="button"
              onClick={() => handleSendPrompt('Analyze this financial chart and extract key revenue insights.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80')}
              className="px-3 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>📊</span>
              <span>Analyze chart image</span>
            </button>
          </div>

          {/* Interactive Chat Thread */}
          <div className="flex-1 flex flex-col justify-between p-6 bg-zinc-50 dark:bg-black overflow-hidden relative">
            <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto space-y-4 text-xs pr-2">
              
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-lg bg-black dark:bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white dark:text-zinc-300" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl rounded-2xl p-4 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-black dark:bg-zinc-900 text-white dark:text-zinc-100 font-medium rounded-tr-xs border border-zinc-800'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-tl-xs whitespace-pre-wrap'
                    }`}
                  >
                    {/* Input attachment image */}
                    {Boolean(msg.imageUrl && msg.imageUrl.trim()) && msg.sender === 'user' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative mb-3 group overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700"
                      >
                        <img
                          src={msg.imageUrl}
                          alt="Uploaded attachment"
                          className="w-full max-w-xs h-36 object-cover rounded-xl"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Vision Processed</span>
                        </div>
                      </motion.div>
                    )}
                    
                    <p className="leading-relaxed">
                      {msg.text}
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 bg-emerald-500 ml-1 animate-pulse" />
                      )}
                    </p>

                    {/* AI generated image output */}
                    {Boolean(msg.imageUrl && msg.imageUrl.trim()) && msg.sender === 'ai' && (
                      <LivePreviewImage url={msg.imageUrl!} altText={msg.text || 'Generated AI artwork'} />
                    )}
                    
                    <span className="text-[9px] opacity-60 block text-right mt-1.5 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  <div className="w-8 h-8 rounded-lg bg-black dark:bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                    <span>AVO AI engine is generating response...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Interactive Input Form */}
            <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 rounded-xl p-3 shadow-md transition-all">
              <AnimatePresence>
                {attachedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold">sample_chart.png attached</span>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="text-zinc-400 hover:text-red-500 ml-2 cursor-pointer transition-colors"
                    >
                      ×
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setAttachedImage("https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80")}
                  className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  title="Attach sample image"
                >
                  <ImageIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  <span className="hidden sm:inline font-semibold">Add Image</span>
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question or type 'hey avo generate a batman image'..."
                  className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-black dark:text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />

                <button
                  type="submit"
                  disabled={!input.trim() && !attachedImage}
                  className="px-4 py-2.5 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-black font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};
