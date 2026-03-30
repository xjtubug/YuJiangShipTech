'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import AuthProvider from '@/components/common/AuthProvider';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Package,
  FileText,
  Settings,
  ExternalLink,
  Menu,
  X,
  Ship,
  UserCheck,
  UsersRound,
  Globe,
  PenTool,
  Bell,
  Check,
  LogOut,
  ShieldCheck,
  ClipboardList,
  ShoppingCart,
  Mail,
  Image as ImageIcon,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const navItems = [
  { href: '', label: 'Dashboard', labelZh: '仪表盘', icon: LayoutDashboard, badge: '' },
  { href: '/visitors', label: 'Visitors', labelZh: '访客管理', icon: Users, badge: 'visitors' },
  { href: '/inquiries', label: 'Inquiries', labelZh: '询价管理', icon: MessageSquare, badge: 'inquiries' },
  { href: '/quotations', label: 'Quotations', labelZh: '报价管理', icon: ClipboardList, badge: '' },
  { href: '/orders', label: 'Orders', labelZh: '订单管理', icon: ShoppingCart, badge: '' },
  { href: '/products', label: 'Products', labelZh: '产品管理', icon: Package, badge: '' },
  { href: '/media', label: 'Media', labelZh: '媒体管理', icon: ImageIcon, badge: '' },
  { href: '/reports', label: 'Reports', labelZh: '数据报告', icon: FileText, badge: '' },
  { href: '/experts', label: 'Experts', labelZh: '专家管理', icon: UserCheck, badge: '' },
  { href: '/customers', label: 'Customers', labelZh: '客户管理', icon: UsersRound, badge: '' },
  { href: '/cms', label: 'CMS', labelZh: '内容管理', icon: PenTool, badge: '' },
  { href: '/email', label: 'Email Marketing', labelZh: '邮件营销', icon: Mail, badge: '' },
  { href: '/users', label: 'Users', labelZh: '用户管理', icon: ShieldCheck, badge: '' },
  { href: '/settings', label: 'Settings', labelZh: '系统设置', icon: Settings, badge: '' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}

function AdminLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'en';
  const basePath = `/${locale}/admin`;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || {});
        setNotifications(data.recent || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalUnread = Object.values(badges).reduce((a, b) => a + b, 0);

  const markAllRead = async () => {
    try {
      await fetch('/api/admin/notifications/read-all', { method: 'POST' });
      setBadges({});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    if (href === '') return pathname === basePath || pathname === `${basePath}/`;
    return pathname.startsWith(fullPath);
  };

  const toggleLocale = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const sidebar = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-primary-800">
        <div className="bg-secondary-500 p-2 rounded-lg">
          <Ship className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">禹疆船舶</h1>
          <p className="text-primary-300 text-xs">管理系统</p>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`${basePath}${item.href}`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.labelZh || item.label}
              {item.badge && badges[item.badge] > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {badges[item.badge] > 99 ? '99+' : badges[item.badge]}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Back to Site */}
      <div className="px-3 py-4 border-t border-primary-800">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-300 hover:bg-primary-800 hover:text-white transition-colors"
        >
          <ExternalLink className="w-5 h-5 flex-shrink-0" />
          返回网站
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-primary-300 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebar}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">管理面板</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-800">通知</h3>
                    {totalUnread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                        <Check className="w-3 h-3" /> 全部已读
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">暂无通知</div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link ? `/${locale}/admin${n.link.replace('/admin', '')}` : '#'}
                          onClick={() => setNotifOpen(false)}
                          className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('zh-CN')}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              {locale === 'zh' ? 'EN' : '中文'}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{session?.user?.name || '管理员'}</p>
              <p className="text-xs text-gray-400">{session?.user?.email || ''}</p>
            </div>
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {session?.user?.avatar ? (
                <Image src={session.user.avatar} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                (session?.user?.name || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/admin/login` })}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
