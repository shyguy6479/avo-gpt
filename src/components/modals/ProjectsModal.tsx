import React, { useState } from 'react';
import { X, Boxes, FolderPlus, Folder, MessageSquare, ChevronRight, Plus, Trash2, Tag } from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
  color?: string;
  isCollapsed?: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  folderId?: string;
  updatedAt: string;
}

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderItem[];
  conversations: ConversationItem[];
  onCreateFolder: (name: string, color: string) => void;
  onSelectConversation: (id: string) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  folders,
  conversations,
  onCreateFolder,
  onSelectConversation
}) => {
  const [newProjName, setNewProjName] = useState('');
  const [newProjColor, setNewProjColor] = useState('bg-emerald-500');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onCreateFolder(newProjName.trim(), newProjColor);
    setNewProjName('');
  };

  const activeFolder = folders.find(f => f.id === selectedFolderId) || folders[0];
  const filteredConvs = activeFolder
    ? conversations.filter(c => c.folderId === activeFolder.id)
    : conversations;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200">
              <Boxes className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Projects & Workspace Folders</h3>
              <p className="text-xs text-zinc-400">Organize chat threads and code artifacts into dedicated project spaces.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Create New Project Bar */}
          <form onSubmit={handleCreate} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Create New Project Space</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="e.g. Next.js Refactoring, Machine Learning API..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center gap-2">
                <select
                  value={newProjColor}
                  onChange={(e) => setNewProjColor(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="bg-emerald-500">Emerald Green</option>
                  <option value="bg-blue-500">Ocean Blue</option>
                  <option value="bg-purple-500">Violet Purple</option>
                  <option value="bg-amber-500">Amber Gold</option>
                  <option value="bg-rose-500">Rose Red</option>
                </select>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              </div>
            </div>
          </form>

          {/* Folder List & Thread Inspector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Folder Sidebar */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Active Folders ({folders.length})</div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {folders.map((f) => {
                  const count = conversations.filter(c => c.folderId === f.id).length;
                  const isSelected = (selectedFolderId === f.id) || (!selectedFolderId && f === folders[0]);

                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFolderId(f.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800/90 border-emerald-500/50 text-white shadow-md'
                          : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${f.color || 'bg-zinc-500'}`} />
                        <span className="text-xs font-semibold truncate">{f.name}</span>
                      </div>
                      <span className="text-[10px] bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-400">
                        {count} {count === 1 ? 'thread' : 'threads'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Folder Threads Inspector */}
            <div className="md:col-span-2 space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Conversations in {activeFolder?.name || 'Project'}</span>
                <span className="text-[10px] text-emerald-400 font-mono">{filteredConvs.length} Items</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredConvs.length === 0 ? (
                  <div className="p-8 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-2">
                    <Folder className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400">No conversations assigned to this project folder yet.</p>
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onClose();
                      }}
                      className="w-full p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 flex items-center justify-between group transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MessageSquare className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{conv.title}</p>
                          <p className="text-[10px] text-zinc-500">{conv.updatedAt}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
