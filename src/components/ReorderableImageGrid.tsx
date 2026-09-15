import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripHorizontal, Archive, Download, Sparkles, Maximize2, Move } from 'lucide-react';
import { GalleryImage, downloadImagesAsZip } from './ImageGalleryModal';

interface ReorderableImageGridProps {
  images: GalleryImage[];
  onOpenGallery: (imageIndex: number, currentList: GalleryImage[]) => void;
  showToast?: (msg: string) => void;
}

export const ReorderableImageGrid: React.FC<ReorderableImageGridProps> = ({
  images,
  onOpenGallery,
  showToast
}) => {
  const [items, setItems] = useState<GalleryImage[]>(images);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    setItems(images);
  }, [images]);

  if (!items || items.length === 0) return null;

  const handleDownloadZip = async () => {
    setIsZipping(true);
    await downloadImagesAsZip(items, `reordered-images-${Date.now()}.zip`, showToast);
    setIsZipping(false);
  };

  return (
    <div className="my-4 p-3.5 sm:p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
      {/* Multi-Image Collection Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Generated Visual Collection</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono">
                {items.length} images
              </span>
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Move className="w-3 h-3 text-purple-500" />
              <span>Drag cards to reorder visual sequence</span>
            </p>
          </div>
        </div>

        {/* Download All ZIP Button */}
        {items.length >= 2 && (
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Compress and download all images in a single ZIP file"
          >
            <Archive className="w-3.5 h-3.5 text-purple-200" />
            <span>Download All (.zip)</span>
          </button>
        )}
      </div>

      {/* Framer Motion Reorder Group */}
      <Reorder.Group
        axis="x"
        values={items}
        onReorder={setItems}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1"
      >
        {items.map((item, index) => (
          <Reorder.Item
            key={item.id || item.url || index}
            value={item}
            whileDrag={{ scale: 1.04, zIndex: 30, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}
            className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-xs cursor-grab active:cursor-grabbing select-none transition-all"
          >
            {/* Drag Handle Tag */}
            <div className="absolute top-2 left-2 z-10 opacity-80 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20">
              <GripHorizontal className="w-3 h-3 text-purple-400" />
              <span>Drag #{index + 1}</span>
            </div>

            {/* Quick Preview Button */}
            <button
              type="button"
              onClick={() => onOpenGallery(index, items)}
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/75 hover:bg-purple-600 text-white border border-white/20 cursor-pointer shadow-md"
              title="Expand into full-screen gallery carousel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Image Preview */}
            <div
              className="w-full aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center cursor-pointer"
              onClick={() => onOpenGallery(index, items)}
            >
              <img
                src={item.url}
                alt={item.prompt || item.alt || `Visual ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Prompt caption footer */}
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate font-medium">
                {item.prompt || item.alt || `Visual Art #${index + 1}`}
              </p>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};
