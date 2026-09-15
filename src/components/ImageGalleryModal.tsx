import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Archive,
  Maximize2,
  Minimize2,
  Wand2,
  Sparkles,
  Copy,
  Check,
  Grid,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import JSZip from 'jszip';

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  prompt?: string;
  messageId?: string;
}

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  initialIndex?: number;
  onSendMessage?: (msg: string) => void;
  showToast?: (msg: string) => void;
}

export const downloadImagesAsZip = async (
  images: Array<{ url: string; alt?: string; prompt?: string }>,
  zipName = `generated-images-${Date.now()}.zip`,
  showToast?: (msg: string) => void
) => {
  if (images.length === 0) return;
  if (showToast) showToast(`Zipping ${images.length} images for download...`);

  try {
    const zip = new JSZip();
    const folder = zip.folder('ai-generated-images') || zip;

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      const cleanAlt = (item.alt || item.prompt || 'artwork')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .substring(0, 24);
      const fileName = `image-${i + 1}-${cleanAlt || 'art'}.png`;

      if (item.url.startsWith('data:')) {
        const base64Parts = item.url.split(',');
        if (base64Parts.length > 1) {
          folder.file(fileName, base64Parts[1], { base64: true });
        }
      } else {
        try {
          const res = await fetch(item.url, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            folder.file(fileName, blob);
          }
        } catch (fetchErr) {
          console.warn(`[JSZip Download Warning]: Could not fetch ${item.url}`, fetchErr);
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (showToast) showToast(`Downloaded zip archive (${images.length} images)`);
  } catch (err) {
    console.error('[JSZip Zip Error]:', err);
    if (showToast) showToast('Failed to create ZIP archive. Downloading individual images...');
  }
};

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  onSendMessage,
  showToast
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < images.length) {
      setCurrentIndex(initialIndex);
    } else {
      setCurrentIndex(0);
    }
  }, [initialIndex, images]);

  const currentImage = images[currentIndex] || images[0];

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || images.length === 0 || !currentImage) return null;

  const handleSingleDownload = (url: string, promptText?: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-art-${Date.now()}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (showToast) showToast('Image download started');
  };

  const handleZipDownload = async () => {
    setIsDownloadingZip(true);
    await downloadImagesAsZip(images, `ai-gallery-${Date.now()}.zip`, showToast);
    setIsDownloadingZip(false);
  };

  const handleCopyPrompt = () => {
    const prompt = currentImage.prompt || currentImage.alt || 'AI generated art';
    navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (showToast) showToast('Prompt copied to clipboard');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl text-white select-none overflow-hidden"
        >
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between p-4 sm:px-6 bg-black/40 border-b border-white/10 z-20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>Image Gallery</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
                    {currentIndex + 1} / {images.length}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs sm:max-w-md truncate">
                  {currentImage.prompt || currentImage.alt || 'AI Visual Generation'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Download All ZIP Button if multiple images exist */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={handleZipDownload}
                  disabled={isDownloadingZip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/40 shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Download all gallery images as a ZIP archive"
                >
                  <Archive className="w-4 h-4 text-purple-200" />
                  <span className="hidden sm:inline">Download All (.zip)</span>
                  <span className="sm:hidden">ZIP ({images.length})</span>
                </button>
              )}

              {/* Download Single Image */}
              <button
                type="button"
                onClick={() => handleSingleDownload(currentImage.url, currentImage.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/20 transition-all active:scale-95 cursor-pointer"
                title="Download current image"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Download</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Close Gallery (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Carousel Display Area */}
          <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
            {/* Prev Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 sm:left-8 z-30 p-3 rounded-full bg-black/60 hover:bg-purple-600/90 text-white border border-white/20 hover:border-purple-400/50 shadow-2xl backdrop-blur-md transition-all transform active:scale-90 cursor-pointer"
                title="Previous Image (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Active Animated Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage.id || currentImage.url || currentIndex}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: isZoomed ? 1.35 : 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative max-w-full max-h-[75vh] flex items-center justify-center cursor-zoom-in"
                onClick={() => setIsZoomed((prev) => !prev)}
              >
                <img
                  src={currentImage.url}
                  alt={currentImage.prompt || currentImage.alt || 'AI Art'}
                  className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none transition-transform duration-300"
                />
              </motion.div>
            </AnimatePresence>

            {/* Next Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 sm:right-8 z-30 p-3 rounded-full bg-black/60 hover:bg-purple-600/90 text-white border border-white/20 hover:border-purple-400/50 shadow-2xl backdrop-blur-md transition-all transform active:scale-90 cursor-pointer"
                title="Next Image (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip & Action Toolbar */}
          <div className="bg-black/60 border-t border-white/10 p-3 sm:px-6 flex flex-col gap-3 z-20">
            {/* Prompt bar */}
            <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto w-full px-2 text-xs text-zinc-300">
              <p className="truncate font-medium text-zinc-200 max-w-[70%]">
                <span className="text-purple-400 font-semibold mr-1.5">Prompt:</span>
                {currentImage.prompt || currentImage.alt || 'Generated Art'}
              </p>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 text-[11px] font-medium transition-all active:scale-95 cursor-pointer shrink-0"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-300" />}
                <span>{isCopied ? 'Copied' : 'Copy Prompt'}</span>
              </button>
            </div>

            {/* Thumbnail Carousel Bar */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-full scrollbar-thin scrollbar-thumb-white/20">
                {images.map((img, idx) => (
                  <button
                    key={img.id || img.url || idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsZoomed(false);
                    }}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 shrink-0 cursor-pointer ${
                      idx === currentIndex
                        ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/30'
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
