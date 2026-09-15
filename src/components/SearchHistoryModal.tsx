import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Clock,
  Search,
  Copy,
  Trash2,
  X,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  User,
  Bot,
  ArrowUpDown,
  Filter,
  FileText,
  CornerDownRight,
  PenSquare
} from 'lucide-react';
import { Conversation, ChatMessage } from '../types';

interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversation?: Conversation | null;
  conversations?: Conversation[];
  onJumpToMessage: (messageId: string, convId?: string) => void;
  onUseAsPrompt: (content: string) => void;
  onDeleteMessage: (messageId: string, convId?: string) => void;
  onShowToast: (msg: string) => void;
}

export const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  isOpen,
  onClose,
  activeConversation,
  conversations = [],
  onJumpToMessage,
  onUseAsPrompt,
  onDeleteMessage,
  onShowToast
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [roleFilter, setRoleFilter] = useState<'user' | 'all' | 'liked'>('user');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // asc = chronological (#1 to #10), desc = newest first
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract all messages according to scope
  const rawItems = useMemo(() => {
    interface MessageEntry {
      message: ChatMessage;
      convId: string;
      convTitle: string;
      originalIndex: number;
      totalUserInConv: number;
    }

    const list: MessageEntry[] = [];

    if (scope === 'current') {
      if (activeConversation && activeConversation.messages) {
        const userMsgs = activeConversation.messages.filter((m) => m.role === 'user');
        let userIdx = 0;
        activeConversation.messages.forEach((m) => {
          if (m.role === 'user') {
            userIdx++;
          }
          list.push({
            message: m,
            convId: activeConversation.id,
            convTitle: activeConversation.title || 'Current Conversation',
            originalIndex: m.role === 'user' ? userIdx : 0,
            totalUserInConv: userMsgs.length
          });
        });
      }
    } else {
      conversations.forEach((conv) => {
        if (!conv.messages) return;
        const userMsgs = conv.messages.filter((m) => m.role === 'user');
        let userIdx = 0;
        conv.messages.forEach((m) => {
          if (m.role === 'user') {
            userIdx++;
          }
          list.push({
            message: m,
            convId: conv.id,
            convTitle: conv.title || 'Untitled Conversation',
            originalIndex: m.role === 'user' ? userIdx : 0,
            totalUserInConv: userMsgs.length
          });
        });
      });
    }

    return list;
  }, [scope, activeConversation, conversations]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return rawItems
      .filter((entry) => {
        const m = entry.message;
        // Role filter
        if (roleFilter === 'user' && m.role !== 'user') return false;
        if (roleFilter === 'liked' && !m.isLiked) return false;

        // Search text filter
        if (filterQuery.trim()) {
          const q = filterQuery.toLowerCase();
          const matchContent = (m.content || '').toLowerCase().includes(q);
          const matchTitle = (entry.convTitle || '').toLowerCase().includes(q);
          if (!matchContent && !matchTitle) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.message.timestamp || 0).getTime();
        const timeB = new Date(b.message.timestamp || 0).getTime();
        if (sortOrder === 'asc') {
          return timeA - timeB;
        } else {
          return timeB - timeA;
        }
      });
  }, [rawItems, roleFilter, filterQuery, sortOrder]);

  // Quick stats
  const currentChatUserCount = useMemo(() => {
    if (!activeConversation || !activeConversation.messages) return 0;
    return activeConversation.messages.filter((m) => m.role === 'user').length;
  }, [activeConversation]);

  const totalWordsInView = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const words = (item.message.content || '').trim().split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
  }, [filteredItems]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Message copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    if (filteredItems.length === 0) {
      onShowToast('No messages available to export.');
      return;
    }

    const lines = filteredItems.map((item, idx) => {
      const roleLabel = item.message.role === 'user' ? 'YOU (PROMPT)' : 'ASSISTANT';
      const timeStr = item.message.timestamp
        ? new Date(item.message.timestamp).toLocaleString()
        : '';
      return `--------------------------------------------------\n#${idx + 1} [${roleLabel}] ${timeStr} | Chat: ${item.convTitle}\n--------------------------------------------------\n${item.message.content}\n`;
    });

    const exportText = `AVO AI CHAT MESSAGE HISTORY\nExported on: ${new Date().toLocaleString()}\nScope: ${scope === 'current' ? activeConversation?.title || 'Current Chat' : 'All Chats'}\nTotal Messages: ${filteredItems.length}\n\n${lines.join('\n')}`;

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-messages-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Message history exported as text file');
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently';
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today at ${timeStr}`;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/80 dark:bg-black/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                  Message History
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700/50 text-[11px] font-mono font-bold">
                  {currentChatUserCount} {currentChatUserCount === 1 ? 'message typed' : 'messages typed'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate max-w-md">
                {scope === 'current'
                  ? `Viewing messages from "${activeConversation?.title || 'Current Chat'}"`
                  : 'Viewing messages across all conversations'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Close Message History"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3 shrink-0">
          {/* Top Row: Search Input + Export Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 focus-within:border-blue-500 dark:focus-within:border-zinc-600 rounded-2xl px-3.5 py-2 shadow-xs">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mr-2.5" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search typed messages in this chat..."
                className="w-full text-xs text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-sans"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort order toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-2 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
              title={sortOrder === 'asc' ? 'Sorted: Oldest first (#1 to #10)' : 'Sorted: Newest first'}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">
                {sortOrder === 'asc' ? 'Oldest First (#1 → #10)' : 'Newest First'}
              </span>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
              title="Export Messages"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

          {/* Bottom Row: Scope Switcher + Role Filters */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Scope: Current Chat vs All Chats */}
            <div className="flex items-center bg-zinc-100 dark:bg-black/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setScope('current')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  scope === 'current'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                This Chat ({currentChatUserCount})
              </button>
              <button
                onClick={() => setScope('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                All Chats ({conversations.reduce((acc, c) => acc + (c.messages?.filter((m) => m.role === 'user').length || 0), 0)})
              </button>
            </div>

            {/* Role Filter: Prompts vs All */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setRoleFilter('user')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                  roleFilter === 'user'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-black dark:border-zinc-100 font-bold'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300 dark:bg-black dark:text-zinc-400 dark:border-zinc-800 dark:hover:text-white dark:hover:border-zinc-700'
                }`}
              >
                <User className="w-3 h-3 text-blue-500" />
                <span>My Prompts ({rawItems.filter((i) => i.message.role === 'user').length})</span>
              </button>

              <button
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                  roleFilter === 'all'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-black dark:border-zinc-100 font-bold'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300 dark:bg-black dark:text-zinc-400 dark:border-zinc-800 dark:hover:text-white dark:hover:border-zinc-700'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                <span>All Messages ({rawItems.length})</span>
              </button>

              <button
                onClick={() => setRoleFilter('liked')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                  roleFilter === 'liked'
                    ? 'bg-amber-500 text-black border-amber-400 font-bold'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300 dark:bg-black dark:text-zinc-400 dark:border-zinc-800 dark:hover:text-white dark:hover:border-zinc-700'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                <span>Liked ({rawItems.filter((i) => i.message.isLiked).length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="py-14 px-4 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No Messages Found</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  {filterQuery
                    ? `No messages matched "${filterQuery}". Try clearing your search keyword.`
                    : 'No messages have been sent in this conversation yet. Send a message in the chat to see your message history here!'}
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((entry, idx) => {
              const msg = entry.message;
              const isUser = msg.role === 'user';
              const displayIndex = entry.originalIndex > 0 ? entry.originalIndex : idx + 1;
              const wordCount = (msg.content || '').trim().split(/\s+/).filter(Boolean).length;
              const charCount = (msg.content || '').length;

              return (
                <div
                  key={msg.id || idx}
                  className={`p-4 rounded-2xl border transition-all duration-200 group relative flex flex-col gap-3 ${
                    isUser
                      ? 'bg-zinc-50 hover:bg-zinc-100/80 border-zinc-200 hover:border-blue-300 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 dark:border-zinc-800/90 dark:hover:border-blue-700/60'
                      : 'bg-white hover:bg-zinc-50/70 border-zinc-200/90 hover:border-zinc-300 dark:bg-zinc-950/90 dark:hover:bg-zinc-900/60 dark:border-zinc-800/60'
                  }`}
                >
                  {/* Top Bar of Card: Message # Badge, Role, Time, Word Count */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-zinc-200/80 dark:border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      {/* Sequential Number badge */}
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-[11px] font-mono font-bold shadow-xs">
                        #{displayIndex}
                      </span>

                      {/* Role indicator */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isUser
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-600/20 dark:text-emerald-300 dark:border-emerald-500/30'
                        }`}
                      >
                        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        {isUser ? 'You' : 'Assistant'}
                      </span>

                      {/* Time */}
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                        {formatMessageTime(msg.timestamp)}
                      </span>

                      {/* Conv Title if in 'all' scope */}
                      {scope === 'all' && (
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-[180px] bg-zinc-100 dark:bg-black/60 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          {entry.convTitle}
                        </span>
                      )}
                    </div>

                    {/* Word / Char count */}
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {wordCount} {wordCount === 1 ? 'word' : 'words'} • {charCount} chars
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="text-sm text-zinc-800 dark:text-zinc-100 font-normal leading-relaxed break-words whitespace-pre-wrap selection:bg-blue-500 selection:text-white">
                    {msg.content}
                  </div>

                  {/* Attachments preview if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-black/70 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                          <span className="truncate max-w-[160px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60 flex-wrap">
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                      {isUser ? 'Prompt sent to AI model' : 'AI generated response'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Jump to Message in Chat */}
                      <button
                        onClick={() => onJumpToMessage(msg.id, entry.convId)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                        title="Scroll to this message in chat"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Jump to in Chat</span>
                      </button>

                      {/* Use as Prompt / Insert into Input (for user messages) */}
                      {isUser && (
                        <button
                          onClick={() => onUseAsPrompt(msg.content)}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer dark:border-zinc-700/80"
                          title="Load this text into chat input to edit or re-send"
                        >
                          <PenSquare className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                          <span className="hidden sm:inline">Use as Prompt</span>
                        </button>
                      )}

                      {/* Copy Text */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 border border-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-white dark:border-zinc-700/80 transition-all cursor-pointer"
                        title="Copy message text"
                      >
                        {copiedId === msg.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete Message */}
                      <button
                        onClick={() => onDeleteMessage(msg.id, entry.convId)}
                        className="p-1.5 rounded-xl bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 border border-zinc-200 hover:border-rose-300 dark:bg-zinc-800/80 dark:hover:bg-rose-900/60 dark:text-zinc-400 dark:hover:text-rose-300 dark:border-zinc-700/80 dark:hover:border-rose-800/60 transition-all cursor-pointer"
                        title="Delete message from conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/60 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>
              {filteredItems.length} messages displayed • {totalWordsInView} total words
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
