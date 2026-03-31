'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  Users,
  Plus,
  Edit2,
  Ban,
  ShieldCheck,
  Award,
  X,
  Loader2,
  Search,
  KeyRound,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  title?: string | null;
  active: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  admin: { label: '管理员', color: 'bg-orange-100 text-orange-700', icon: ShieldCheck, desc: '全部管理权限' },
  expert: { label: '专家', color: 'bg-purple-100 text-purple-700', icon: Award, desc: '专家评审' },
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin',
    title: '',
    bio: '',
    avatar: '',
  });

  const isSuperAdmin = session?.user?.role === 'super_admin' || session?.user?.role === 'admin';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'form' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'avatar');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (target === 'form') {
        setForm((prev) => ({ ...prev, avatar: data.url }));
      } else if (editUser) {
        handleUpdate(editUser.id, { avatar: data.url });
      }
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }

      setShowModal(false);
      setForm({ email: '', password: '', name: '', role: 'admin', title: '', bio: '', avatar: '' });
      fetchUsers();
    } catch {
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (res.ok) {
        fetchUsers();
        setEditUser(null);
      }
    } catch {
      // ignore
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('确定要停用此用户吗？')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch {
      // ignore
    }
  };

  const handlePasswordReset = async () => {
    if (!showPasswordReset || !newPassword) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: showPasswordReset, password: newPassword }),
      });
      if (res.ok) {
        setShowPasswordReset(null);
        setNewPassword('');
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6" />
            用户管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理系统用户及其权限</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加用户
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
              <span className="text-[10px] opacity-70">— {cfg.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">最后登录</th>
                {isSuperAdmin && (
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((user) => {
                const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
                const RoleIcon = roleCfg.icon;
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 ${!user.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {user.avatar ? (
                            <Image src={user.avatar} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleCfg.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.active ? '活跃' : '已停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
                        : '从未登录'}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowPasswordReset(user.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                            title="重置密码"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          {user.active && session?.user?.id !== user.id && (
                            <button
                              onClick={() => handleDeactivate(user.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="停用"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    暂无用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">添加用户</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label} — {cfg.desc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">职称</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="可选"
                />
              </div>
              {form.role === 'expert' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">头像</label>
                    <div className="flex items-center gap-3">
                      {form.avatar && (
                        <Image src={form.avatar} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <label className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs cursor-pointer hover:bg-gray-50">
                        上传头像
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(e, 'form')} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      placeholder="专家简介..."
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:bg-primary-400 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">编辑用户</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  defaultValue={editUser.name}
                  id="edit-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  defaultValue={editUser.role}
                  id="edit-role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  defaultValue={editUser.active ? 'true' : 'false'}
                  id="edit-active"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="true">活跃</option>
                  <option value="false">停用</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
                    const role = (document.getElementById('edit-role') as HTMLSelectElement)?.value;
                    const active = (document.getElementById('edit-active') as HTMLSelectElement)?.value === 'true';
                    handleUpdate(editUser.id, { name, role, active });
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">重置密码</h3>
              <button onClick={() => { setShowPasswordReset(null); setNewPassword(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  placeholder="至少6个字符"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPasswordReset(null); setNewPassword(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={saving || newPassword.length < 6}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:bg-orange-300 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
