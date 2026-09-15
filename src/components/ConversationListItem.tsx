import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  MoreVertical,
  Archive,
  Copy,
  Edit2,
  Tag as TagIcon,
  Check,
  Folder,
  Sparkles,
  Layers,
  Clock,
  GitMerge
} from 'lucide-react';
import { Conversation, Tag, Folder as FolderType } from '../types';

interface ConversationListItemProps {
  conv: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onPin: (e?: React.MouseEvent) => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onRename: (newTitle: string) => void;
  onToggleTag: (tagId: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOverTarget: boolean;
  availableTags: Tag[];
  folders: FolderType[];
  onMoveToFolder: (folderId: string | null) => void;
  isBulkMode?: boolean;
  isSelectedForBulk?: boolean;
  onToggleBulkSelect?: () => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conv,
  isActive,
  onSelect,
  onDelete,
  onPin,
  onArchive,
  onDuplicate,
  onRename,
  onToggleTag,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOverTarget,
  availableTags,
  folders,
  onMoveToFolder,
  isBulkMode = false,
  isSelectedForBulk = false,
  onToggleBulkSelect
}) => {
  const [showHoverPopover, setShowHoverPopover] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowHoverPopover(true);
    }, 280);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowHoverPopover(false);
  };

  const handleSaveRename = () => {
    if (editTitle.trim() && editTitle.trim() !== conv.title) {
      onRename(editTitle.trim());
    } else {
      setEditTitle(conv.title);
    }
    setIsEditing(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  // Get snippet for popover
  const lastAssistantMsg = [...conv.messages].reverse().find((m) => m.role === 'assistant') || conv.messages[conv.messages.length - 1];
  const lastSnippet = lastAssistantMsg
    ? lastAssistantMsg.content.replace(/[#*`\n]/g, ' ').slice(0, 110) + (lastAssistantMsg.content.length > 110 ? '...' : '')
    : 'No messages in conversation yet.';

  const activeTagObjs = availableTags.filter((t) => conv.tags?.includes(t.id));

  return (
    <div
      className="relative group my-0.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Conversation Row */}
      <div
        draggable={!isEditing && !isBulkMode}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => {
          if (isBulkMode) {
            onToggleBulkSelect?.();
          } else if (!isEditing) {
            onSelect();
          }
        }}
        onContextMenu={handleContextMenu}
        className={`relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
          isSelectedForBulk
            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-700 shadow-xs'
            : isDragOverTarget
            ? 'border-zinc-500 bg-zinc-200/90 dark:bg-zinc-800/90 scale-[1.01] shadow-md ring-2 ring-zinc-400/50'
            : isActive
            ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-bold border-zinc-300 dark:border-zinc-700 shadow-2xs'
            : 'bg-white/60 dark:bg-black/60 border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
        }`}
      >
        {/* Drop Merge Overlay Indicator */}
        {isDragOverTarget && (
          <div className="absolute inset-0 z-20 rounded-xl bg-zinc-800/20 border-2 border-dashed border-zinc-500 flex items-center justify-center gap-1.5 text-[11px] font-bold text-zinc-800 dark:text-zinc-200 backdrop-blur-[1px]">
            <GitMerge className="w-3.5 h-3.5 animate-bounce" />
            <span>Drop to Merge Threads</span>
          </div>
        )}

        {/* Title & Icons */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
          {isBulkMode ? (
            <input
              type="checkbox"
              checked={isSelectedForBulk}
              onChange={() => onToggleBulkSelect?.()}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-800 focus:ring-zinc-500 cursor-pointer accent-zinc-600 shrink-0"
            />
          ) : (
            <div className="shrink-0 flex items-center justify-center">
              <MessageSquare
                className={`w-4 h-4 transition-colors ${
                  conv.isPinned
                    ? 'text-amber-500'
                    : isActive
                    ? 'text-zinc-800 dark:text-zinc-200'
                    : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                }`}
              />
            </div>
          )}

          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
                if (e.key === 'Escape') {
                  setEditTitle(conv.title);
                  setIsEditing(false);
                }
              }}
              onBlur={handleSaveRename}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-500 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
            />
          ) : (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs leading-snug font-medium flex items-center gap-1">
                {conv.title}
                {conv.isPinned && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold px-1 rounded shadow-2xs"
                  >
                    PINNED
                  </motion.span>
                )}
              </span>
              {/* 1-Sentence Summary Subtitle */}
              <span className="truncate text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">
                {conv.summary || lastSnippet}
              </span>
              {/* Tags inline pills */}
              {activeTagObjs.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  {activeTagObjs.map((tag) => (
                    <span
                      key={tag.id}
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${tag.color} ${tag.textColor}`}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls: Dedicated Pin Toggle & More Options */}
        {!isEditing && !isBulkMode && (
          <div className="flex items-center space-x-1 shrink-0 ml-1">
            {/* Dedicated Pin Toggle Button */}
            <motion.button
              type="button"
              id={`pin-toggle-${conv.id}`}
              data-testid="pin-toggle"
              aria-label={conv.isPinned ? 'Unpin conversation' : 'Pin conversation to top'}
              aria-pressed={Boolean(conv.isPinned)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85, rotate: conv.isPinned ? -15 : 15 }}
              animate={conv.isPinned ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 15 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPin(e);
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                conv.isPinned
                  ? 'opacity-100 text-amber-500 bg-amber-100/80 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/70 shadow-2xs hover:bg-amber-200/80 dark:hover:bg-amber-900/70'
                  : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-400 hover:text-amber-500 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60'
              }`}
              title={conv.isPinned ? 'Unpin chat' : 'Pin chat to top'}
            >
              <Pin
                className={`w-3.5 h-3.5 transition-colors ${
                  conv.isPinned ? 'fill-amber-500 text-amber-500' : ''
                }`}
              />
            </motion.button>

            {/* Context Menu Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsMenuOpen((prev) => !prev);
              }}
              className="p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 rounded-lg transition-colors cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Custom Context Menu Popover */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-1 top-8 z-40 w-48 bg-black dark:bg-black border border-zinc-800 rounded-xl shadow-2xl p-1.5 text-xs text-white dark:text-white animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase border-b border-zinc-800/80 mb-1 flex items-center justify-between">
              <span className="text-zinc-300">CHAT ACTIONS</span>
              <span className="font-mono text-[9px] text-zinc-500">ID: {conv.id.slice(-4)}</span>
            </div>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsEditing(true);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-900 rounded-lg flex items-center gap-2 text-white font-medium transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Rename</span>
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                onPin();
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-900 rounded-lg flex items-center gap-2 text-white font-medium transition-colors"
            >
              {conv.isPinned ? (
                <>
                  <PinOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unpin Chat</span>
                </>
              ) : (
                <>
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pin to Top</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                onDuplicate();
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-900 rounded-lg flex items-center gap-2 text-white font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              <span>Duplicate</span>
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                onArchive();
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-900 rounded-lg flex items-center gap-2 text-white font-medium transition-colors"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-400" />
              <span>{conv.isArchived ? 'Unarchive' : 'Archive'}</span>
            </button>

            {/* Folder Move Submenu */}
            {folders.length > 0 && (
              <div className="border-t border-zinc-800/80 my-1 pt-1">
                <div className="px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-400 uppercase">Move to Folder</div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onMoveToFolder(null);
                  }}
                  className={`w-full text-left px-2.5 py-1 hover:bg-zinc-900 rounded text-[11px] truncate flex items-center gap-1.5 ${
                    !conv.folderId ? 'font-bold text-white' : 'text-zinc-300'
                  }`}
                >
                  <Folder className="w-3 h-3 text-zinc-400" /> Uncategorized
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setIsMenuOpen(false);
                      onMoveToFolder(f.id);
                    }}
                    className={`w-full text-left px-2.5 py-1 hover:bg-zinc-900 rounded text-[11px] truncate flex items-center gap-1.5 ${
                      conv.folderId === f.id ? 'font-bold text-white' : 'text-zinc-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${f.color || 'bg-zinc-500'}`} />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tag Selection Submenu */}
            <div className="border-t border-zinc-800/80 my-1 pt-1">
              <div className="px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-400 uppercase flex items-center justify-between">
                <span>Assign Tags</span>
                <TagIcon className="w-3 h-3 text-zinc-400" />
              </div>
              <div className="flex flex-wrap gap-1 p-1">
                {availableTags.map((tag) => {
                  const hasTag = conv.tags?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => onToggleTag(tag.id)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 transition-all ${tag.color} ${tag.textColor} ${
                        hasTag ? 'ring-1 ring-white font-bold' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {hasTag && <Check className="w-2.5 h-2.5" />}
                      <span>{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-1 mt-1">
              <button
                onClick={(e) => {
                  setIsMenuOpen(false);
                  onDelete(e);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-rose-950/60 text-rose-400 rounded-lg flex items-center gap-2 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Chat</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Hover Context Snippet Popover */}
      <AnimatePresence>
        {showHoverPopover && !isMenuOpen && !isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-0 ml-2 z-50 w-64 p-3 bg-black text-white dark:bg-black border border-zinc-800 rounded-2xl shadow-2xl pointer-events-none text-xs space-y-2 backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <span className="font-bold text-white truncate max-w-[150px]">{conv.title}</span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" /> {conv.updatedAt}
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 italic leading-relaxed line-clamp-3">
              "{lastSnippet}"
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1 font-mono">
                <Layers className="w-3 h-3 text-zinc-500" /> {conv.messages.length} messages
              </span>
              {activeTagObjs.length > 0 && (
                <div className="flex gap-1">
                  {activeTagObjs.map((t) => (
                    <span key={t.id} className="px-1 py-0.2 rounded bg-zinc-800 text-white font-semibold border border-zinc-700">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
