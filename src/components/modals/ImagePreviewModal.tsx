import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  Wand2,
  Sliders,
  Image as ImageIcon,
  Send,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { generateImage, upscaleImage, replaceBackground } from '../../lib/aiService';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  prompt: string;
  aspectRatio?: string;
  style?: string;
  onSendMessage?: (message: string) => void;
  showToast?: (msg: string) => void;
  onImageUpdated?: (newUrl: string) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  aspectRatio = '1:1',
  style = 'cinematic',
  onSendMessage,
  showToast,
  onImageUpdated
}) => {
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl);
  const [currentPrompt, setCurrentPrompt] = useState<string>(prompt);
  const [currentStyle, setCurrentStyle] = useState<string>(style);
  const [currentAspectRatio, setCurrentAspectRatio] = useState<string>(aspectRatio);
  const [isUpscaled, setIsUpscaled] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [showVariationsPanel, setShowVariationsPanel] = useState<boolean>(false);
  const [showBgPanel, setShowBgPanel] = useState<boolean>(false);
  const [customVariation, setCustomVariation] = useState<string>('');
  const [customBg, setCustomBg] = useState<string>('');
  const [isChangingBg, setIsChangingBg] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // Sync state when props change
  React.useEffect(() => {
    if (imageUrl) {
      setCurrentImage(imageUrl);
      setCurrentPrompt(prompt || 'Visual Art');
      setCurrentStyle(style || 'cinematic');
      setCurrentAspectRatio(aspectRatio || '1:1');
      setIsUpscaled(false);
      setShowVariationsPanel(false);
      setShowBgPanel(false);
      setCustomVariation('');
      setCustomBg('');
    }
  }, [imageUrl, prompt, style, aspectRatio]);

  if (!isOpen || !currentImage) return null;

  const VARIATION_PRESETS = [
    { label: '🎬 Cinematic Lighting', promptModifier: 'dramatic cinematic volumetric lighting, film grain, anamorphic flare' },
    { label: '🌃 Cyberpunk Neon', promptModifier: 'cyberpunk aesthetic, vibrant neon blue and magenta reflections, futuristic cityscape' },
    { label: '🌅 Golden Hour', promptModifier: 'warm golden hour sunlight, soft natural lens flare, glowing atmospheric haze' },
    { label: '🎨 Expressive Painting', promptModifier: 'rich impasto oil painting style, expressive brush strokes, vibrant color palette' },
    { label: '✨ Dreamy Fantasy', promptModifier: 'ethereal fantasy style, magical glowing embers, whimsical atmospheric depth' },
    { label: '📷 Studio Portrait', promptModifier: 'professional 85mm studio portrait lighting, sharp eye focus, elegant bokeh' }
  ];

  const BACKGROUND_PRESETS = [
    { label: '🌃 Cyberpunk Neon City', bgPrompt: 'bustling cyberpunk alleyway at night with glowing cyan and magenta holographic signs and rain reflections' },
    { label: '📸 Minimal Dark Studio', bgPrompt: 'high-end minimalist photography studio with dramatic dual-tone edge lighting and moody shadows' },
    { label: '🏖️ Sunset Tropical Beach', bgPrompt: 'peaceful tropical beach during a vibrant golden-orange sunset with gentle crystal waves' },
    { label: '🌲 Misty Pine Forest', bgPrompt: 'majestic alpine pine forest at dawn shrouded in soft morning fog and sunbeams' },
    { label: '🏢 Luxury Penthouse', bgPrompt: 'ultra-modern luxury glass penthouse overlooking a luminous metropolitan skyline at dusk' },
    { label: '🏛️ Monumental Brutalist', bgPrompt: 'dramatic dystopian brutalist concrete architectural pavilion under a stormy overcast sky' }
  ];

  const handleRegenerateVariation = async (variationText?: string) => {
    const modifier = variationText || customVariation;
    if (isGenerating) return;

    setIsGenerating(true);
    if (showToast) showToast('Generating visual variation...');

    try {
      const result = await generateImage(currentPrompt, {
        aspectRatio: currentAspectRatio,
        style: currentStyle,
        variation: modifier
      });

      if (result.imageUrl) {
        setCurrentImage(result.imageUrl);
        setIsUpscaled(false);
        onImageUpdated?.(result.imageUrl);
        if (showToast) showToast('✨ Generated new image variation!');
      }
    } catch (err) {
      if (showToast) showToast('Failed to generate variation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChangeBackground = async (bgText?: string) => {
    const targetBg = (bgText || customBg).trim();
    if (!targetBg || isChangingBg || !currentImage) return;

    setIsChangingBg(true);
    if (showToast) showToast('Transforming background with AI...');

    try {
      let base64Data = '';
      let mimeType = 'image/jpeg';

      if (currentImage.startsWith('data:')) {
        const parts = currentImage.split(',');
        base64Data = parts[1];
        const match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
      } else {
        const fetchUrl = currentImage.startsWith('/') ? currentImage : `/api/image-proxy?url=${encodeURIComponent(currentImage)}`;
        const res = await fetch(fetchUrl);
        const blob = await res.blob();
        mimeType = blob.type || 'image/jpeg';
        const reader = new FileReader();
        base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const dataUri = reader.result as string;
            resolve(dataUri.split(',')[1] || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const result = await replaceBackground(
        { data: base64Data, mimeType },
        targetBg,
        currentStyle
      );

      if (result.imageUrl) {
        setCurrentImage(result.imageUrl);
        setIsUpscaled(false);
        onImageUpdated?.(result.imageUrl);
        if (showToast) showToast(`✨ Background transformed to ${targetBg}!`);
      }
    } catch (err) {
      if (showToast) showToast('Failed to transform background. Please try again.');
    } finally {
      setIsChangingBg(false);
    }
  };

  const handleUpscale = async () => {
    if (isUpscaling || isUpscaled) return;

    setIsUpscaling(true);
    if (showToast) showToast('Enhancing image resolution & detail...');

    try {
      const result = await upscaleImage(currentPrompt, {
        aspectRatio: currentAspectRatio,
        style: currentStyle
      });

      if (result.imageUrl) {
        setCurrentImage(result.imageUrl);
        setIsUpscaled(true);
        onImageUpdated?.(result.imageUrl);
        if (showToast) showToast('⚡ Image successfully upscaled to 2K High-Res!');
      }
    } catch (err) {
      if (showToast) showToast('Upscaling failed. Using enhanced renderer.');
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const a = document.createElement('a');
    a.href = currentImage;
    a.download = `avo-ai-generated-${Date.now()}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (showToast) showToast('Image download started');
  };

  const handleCopyUrl = () => {
    if (!currentImage) return;
    navigator.clipboard.writeText(currentImage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (showToast) showToast('Image URL copied to clipboard');
  };

  const handleSendToChat = () => {
    if (onSendMessage) {
      onSendMessage(`Create an image variation of "${currentPrompt}" with ${currentStyle} style and ${currentAspectRatio} ratio`);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between animate-in fade-in duration-200 select-none overflow-hidden"
      onClick={onClose}
    >
      {/* Top Header Controls */}
      <div
        className="w-full px-6 py-4 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 max-w-xl truncate">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-extrabold text-white truncate">{currentPrompt}</h3>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 font-medium">
              <span className="capitalize px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                Style: {currentStyle}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                Ratio: {currentAspectRatio}
              </span>
              {isUpscaled ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-400" /> 2K HD Upscaled
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-emerald-500/30 text-blue-400 font-medium">
                  1024x1024 High-Res
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={isZoomed ? 'Fit to Screen' : 'Full Zoom'}
          >
            {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Lightbox Area */}
      <div
        className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative transition-all duration-300 flex items-center justify-center ${
            isZoomed ? 'w-full h-full max-w-none max-h-none' : 'max-w-4xl max-h-[70vh]'
          }`}
        >
          {isGenerating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-20 gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm font-bold text-white tracking-wide">Rendering variation...</p>
            </div>
          )}

          {isUpscaling && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-20 gap-3">
              <Zap className="w-8 h-8 text-emerald-400 animate-bounce" />
              <p className="text-sm font-bold text-white tracking-wide">Enhancing resolution to 2K High-Res...</p>
            </div>
          )}

          {isChangingBg && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-20 gap-3">
              <Layers className="w-8 h-8 text-purple-400 animate-bounce" />
              <p className="text-sm font-bold text-white tracking-wide">Transforming background with AI...</p>
            </div>
          )}

          <img
            src={currentImage}
            alt={currentPrompt}
            referrerPolicy="no-referrer"
            className={`rounded-2xl border border-zinc-800 shadow-2xl object-contain transition-all ${
              isZoomed ? 'w-full h-full max-h-[85vh]' : 'max-h-[70vh] w-auto'
            }`}
          />
        </div>
      </div>

      {/* Bottom Interactive Controls Panel */}
      <div
        className="w-full px-6 py-4 bg-zinc-950/90 border-t border-zinc-800/80 flex flex-col gap-3 shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Change Drawer Toggle */}
        {showBgPanel && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  AI Background Replacement
                </span>
              </div>
              <button
                onClick={() => setShowBgPanel(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Hide
              </button>
            </div>

            {/* Background Preset Chips */}
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChangeBackground(preset.bgPrompt)}
                  disabled={isChangingBg}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-200 font-medium transition-all cursor-pointer disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Background Input Form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                placeholder="Type custom background e.g. 'Standing on top of snowy Everest mountain peak at sunrise'"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleChangeBackground();
                  }
                }}
              />
              <button
                onClick={() => handleChangeBackground()}
                disabled={isChangingBg || !customBg.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                {isChangingBg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Change Background</span>
              </button>
            </div>
          </div>
        )}

        {/* Variations Drawer Toggle */}
        {showVariationsPanel && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Regenerate with Variations
                </span>
              </div>
              <button
                onClick={() => setShowVariationsPanel(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Hide
              </button>
            </div>

            {/* Variation Preset Chips */}
            <div className="flex flex-wrap gap-2">
              {VARIATION_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRegenerateVariation(preset.promptModifier)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-200 font-medium transition-all cursor-pointer disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Variation Tweak Form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customVariation}
                onChange={(e) => setCustomVariation(e.target.value)}
                placeholder="Type custom tweak e.g. 'Add glowing sunset reflections and neon rain'"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRegenerateVariation();
                  }
                }}
              />
              <button
                onClick={() => handleRegenerateVariation()}
                disabled={isGenerating || !customVariation.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Apply Variation</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Button Strip */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Change Background Button */}
            <button
              onClick={() => {
                setShowBgPanel(!showBgPanel);
                if (showVariationsPanel) setShowVariationsPanel(false);
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                showBgPanel
                  ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/20'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Change Background</span>
            </button>

            {/* Regenerate with Variations Toggle Button */}
            <button
              onClick={() => {
                setShowVariationsPanel(!showVariationsPanel);
                if (showBgPanel) setShowBgPanel(false);
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                showVariationsPanel
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/20'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white'
              }`}
            >
              <Wand2 className="w-4 h-4 text-emerald-400" />
              <span>Variations</span>
            </button>

            {/* Upscale High-Res Button */}
            <button
              onClick={handleUpscale}
              disabled={isUpscaled || isUpscaling}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isUpscaled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
              }`}
            >
              <Zap className={`w-4 h-4 ${isUpscaled ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400'}`} />
              <span>{isUpscaled ? '2K Upscaled' : 'Upscale to 2K HD'}</span>
            </button>

            {/* Send to Chat */}
            {onSendMessage && (
              <button
                onClick={handleSendToChat}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span>Send to Chat</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Copy URL */}
            <button
              onClick={handleCopyUrl}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              title="Copy Direct Image URL"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-black font-extrabold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
