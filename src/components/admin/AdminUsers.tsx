import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  X,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export interface UserRecord {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'disabled';
  conversationsCount: number;
  aiRequestsCount: number;
  lastActive: string;
  createdAt: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected User for Editing in Drawer
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state
  const [editPlan, setEditPlan] = useState<'Free' | 'Pro' | 'Enterprise'>('Free');
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'super_admin'>('user');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended' | 'disabled'>('active');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': 'avo-master-admin-token' },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.warn('Using local fallback users:', err);
      setUsers([
        {
          uid: 'user_abhixin79_gmail_com',
          name: 'Abhinav Sinha',
          email: 'abhixin79@gmail.com',
          plan: 'Enterprise',
          role: 'super_admin',
          status: 'active',
          conversationsCount: 14,
          aiRequestsCount: 168,
          lastActive: new Date().toISOString(),
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          uid: 'user_sarah_connor_acme_com',
          name: 'Sarah Connor',
          email: 'sarah.c@cyberdyne.io',
          plan: 'Pro',
          role: 'user',
          status: 'active',
          conversationsCount: 8,
          aiRequestsCount: 94,
          lastActive: new Date(Date.now() - 4 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 24 * 86400000).toISOString(),
        },
        {
          uid: 'user_david_miller_tech_org',
          name: 'David Miller',
          email: 'david.m@apexlabs.dev',
          plan: 'Pro',
          role: 'user',
          status: 'active',
          conversationsCount: 11,
          aiRequestsCount: 112,
          lastActive: new Date(Date.now() - 12 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 19 * 86400000).toISOString(),
        },
        {
          uid: 'user_elena_rostova_design_io',
          name: 'Elena Rostova',
          email: 'elena@matrixstudio.co',
          plan: 'Free',
          role: 'user',
          status: 'active',
          conversationsCount: 5,
          aiRequestsCount: 38,
          lastActive: new Date(Date.now() - 28 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
        {
          uid: 'user_marcus_vance_security_net',
          name: 'Marcus Vance',
          email: 'm.vance@defense-grid.net',
          plan: 'Enterprise',
          role: 'admin',
          status: 'active',
          conversationsCount: 9,
          aiRequestsCount: 86,
          lastActive: new Date(Date.now() - 2 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
        },
        {
          uid: 'user_priya_sharma_ai_in',
          name: 'Priya Sharma',
          email: 'priya.s@zenith-ai.in',
          plan: 'Pro',
          role: 'user',
          status: 'active',
          conversationsCount: 6,
          aiRequestsCount: 52,
          lastActive: new Date(Date.now() - 48 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDrawer = (user: UserRecord) => {
    setSelectedUser(user);
    setEditPlan(user.plan);
    setEditRole(user.role);
    setEditStatus(user.status);
    setSaveSuccess(false);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'avo-master-admin-token',
        },
        body: JSON.stringify({
          plan: editPlan,
          role: editRole,
          status: editStatus,
        }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      const updated = await res.json();

      setUsers((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
      setSelectedUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error updating user: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || u.plan.toLowerCase() === planFilter.toLowerCase();
    const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || u.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesPlan && matchesRole && matchesStatus;
  });

  const exportCsv = () => {
    const headers = ['UID', 'Name', 'Email', 'Plan', 'Role', 'Status', 'Conversations', 'AI Requests', 'Last Active', 'Created At'];
    const rows = filteredUsers.map((u) => [
      u.uid,
      `"${u.name}"`,
      u.email,
      u.plan,
      u.role,
      u.status,
      u.conversationsCount,
      u.aiRequestsCount,
      u.lastActive,
      u.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `avo_ai_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="admin-users-page" className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#27272a]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">Users</h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-0.5">
            Manage accounts, subscriptions, and administrative permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs text-[#a1a1aa] hover:text-[#ffffff] transition-colors font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchUsers}
            className="p-1.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#ffffff] transition-colors"
            title="Refresh users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#ffffff]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-wrap gap-2.5 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            id="admin-users-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#09090b] border border-[#27272a] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#ffffff] font-sans"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Plan Filter */}
          <select
            id="admin-plan-filter"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-[#09090b] border border-[#27272a] rounded-md px-2.5 py-1.5 text-[#a1a1aa] focus:outline-none focus:border-[#ffffff] font-mono text-[11px]"
          >
            <option value="all">Plan: All</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>

          {/* Role Filter */}
          <select
            id="admin-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#09090b] border border-[#27272a] rounded-md px-2.5 py-1.5 text-[#a1a1aa] focus:outline-none focus:border-[#ffffff] font-mono text-[11px]"
          >
            <option value="all">Role: All</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          {/* Status Filter */}
          <select
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#09090b] border border-[#27272a] rounded-md px-2.5 py-1.5 text-[#a1a1aa] focus:outline-none focus:border-[#ffffff] font-mono text-[11px]"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-lg bg-[#09090b] border border-[#27272a] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#000000] text-[#a1a1aa] font-mono uppercase text-[10px] tracking-wider border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Conversations</th>
                <th className="py-3 px-3">AI Requests</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[#f4f4f5]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#71717a] font-mono text-xs">
                    No users matching selected filters
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.uid}
                    id={`user-row-${u.uid}`}
                    onClick={() => handleOpenDrawer(u)}
                    className="hover:bg-[#09090b] transition-colors cursor-pointer group"
                  >
                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#18181b] border border-[#3f3f46] text-[#ffffff] flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
                          {u.name.slice(0, 2)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-white truncate group-hover:text-[#ffffff] transition-colors">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-[#a1a1aa] font-mono truncate">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          u.plan === 'Enterprise'
                            ? 'bg-[#18181b] text-[#e4e4e7] border border-[#3f3f46]'
                            : u.plan === 'Pro'
                            ? 'bg-[#18181b] text-[#ffffff] border border-[#27272a]'
                            : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a]'
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                          u.role === 'super_admin'
                            ? 'bg-[#291717] text-[#FCA5A5] border border-[#522525]'
                            : u.role === 'admin'
                            ? 'bg-[#1F2213] text-[#FDE047] border border-[#444923]'
                            : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a]'
                        }`}
                      >
                        {u.role === 'super_admin' && <Shield className="w-2.5 h-2.5" />}
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    {/* Conversations */}
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {u.conversationsCount}
                    </td>

                    {/* AI Requests */}
                    <td className="py-3 px-3 font-mono text-[11px] text-[#ffffff]">
                      {u.aiRequestsCount}
                    </td>

                    {/* Last Active */}
                    <td className="py-3 px-3 font-mono text-[11px] text-[#a1a1aa]">
                      {new Date(u.lastActive).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                          u.status === 'active'
                            ? 'text-[#ffffff]'
                            : u.status === 'suspended'
                            ? 'text-[#FBBF24]'
                            : 'text-[#F87171]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-[#ffffff]'
                              : u.status === 'suspended'
                              ? 'bg-[#FBBF24]'
                              : 'bg-[#F87171]'
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(u);
                        }}
                        className="p-1 text-[#a1a1aa] hover:text-[#ffffff] rounded hover:bg-[#18181b] transition-colors"
                        title="Edit user"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedUser(null)}
          />

          <div className="relative z-10 w-full max-w-md h-full bg-[#09090b] border-l border-[#27272a] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] text-[#ffffff] flex items-center justify-center font-bold text-xs uppercase">
                  {selectedUser.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedUser.name}</h3>
                  <p className="text-[11px] text-[#a1a1aa] font-mono">{selectedUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 text-[#a1a1aa] hover:text-white rounded hover:bg-[#18181b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Account Stats */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[#18181b] border border-[#27272a] font-mono">
                <div>
                  <span className="text-[10px] text-[#71717a] uppercase">Conversations</span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedUser.conversationsCount}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#71717a] uppercase">AI Messages</span>
                  <div className="text-sm font-bold text-[#ffffff] mt-0.5">
                    {selectedUser.aiRequestsCount}
                  </div>
                </div>
              </div>

              {/* Edit Plan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#a1a1aa] uppercase">Subscription Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Free', 'Pro', 'Enterprise'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPlan(p)}
                      className={`py-2 px-3 rounded text-center font-mono text-xs transition-colors ${
                        editPlan === p
                          ? 'bg-[#18181b] text-[#ffffff] border border-[#3f3f46] font-semibold'
                          : 'bg-[#000000] text-[#a1a1aa] border border-[#27272a] hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Role */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#a1a1aa] uppercase">System Access Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['user', 'admin', 'super_admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditRole(r)}
                      className={`py-2 px-2 rounded text-center font-mono text-[11px] transition-colors ${
                        editRole === r
                          ? 'bg-[#18181b] text-[#ffffff] border border-[#3f3f46] font-semibold'
                          : 'bg-[#000000] text-[#a1a1aa] border border-[#27272a] hover:text-white'
                      }`}
                    >
                      {r === 'super_admin' ? 'Super Admin' : r.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#71717a] mt-1">
                  Super Admin has unrestricted permissions across all AI routing and backend configurations.
                </p>
              </div>

              {/* Edit Account Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[#a1a1aa] uppercase">Account Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'suspended', 'disabled'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditStatus(s)}
                      className={`py-2 px-3 rounded text-center font-mono text-xs transition-colors ${
                        editStatus === s
                          ? s === 'active'
                            ? 'bg-[#18181b] text-[#ffffff] border border-[#3f3f46]'
                            : 'bg-[#291717] text-[#FCA5A5] border border-[#522525]'
                          : 'bg-[#000000] text-[#a1a1aa] border border-[#27272a] hover:text-white'
                      }`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Metadata */}
              <div className="space-y-2 pt-3 border-t border-[#27272a] text-[11px] font-mono text-[#71717a]">
                <div className="flex justify-between">
                  <span>User UID:</span>
                  <span className="text-[#a1a1aa] truncate max-w-[200px]">{selectedUser.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Signed up:</span>
                  <span className="text-[#a1a1aa]">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last active:</span>
                  <span className="text-[#a1a1aa]">{new Date(selectedUser.lastActive).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#27272a] bg-[#09090b] flex items-center justify-between">
              {saveSuccess ? (
                <span className="text-xs font-mono text-[#ffffff] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved to database!
                </span>
              ) : (
                <span className="text-[11px] text-[#71717a] font-mono">Changes persist across app</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-3 py-1.5 rounded text-xs text-[#a1a1aa] hover:text-white hover:bg-[#18181b] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUser}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-xs font-medium text-[#ffffff] transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
