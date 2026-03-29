'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';

const navItems = [
  { href: '', label: 'Dashboard', labelZh: '仪表盘', icon: LayoutDashboard },
  { href: '/visitors', label: 'Visitors', labelZh: '访客', icon: Users },
  { href: '/inquiries', label: 'Inquiries', labelZh: '询价', icon: MessageSquare },
  { href: '/products', label: 'Products', labelZh: '产品', icon: Package },
  { href: '/reports', label: 'Reports', labelZh: '报告', icon: FileText },
  { href: '/experts', label: 'Experts', labelZh: '专家', icon: UserCheck },
  { href: '/customers', label: 'Customers', labelZh: '客户', icon: UsersRound },
  { href: '/settings', label: 'Settings', labelZh: '设置', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'en';
  const basePath = `/${locale}/admin`;

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
          <h1 className="text-white font-bold text-sm leading-tight">YuJiang</h1>
          <p className="text-primary-300 text-xs">ShipTechnology</p>
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
              {locale === 'zh' ? item.labelZh : item.label}
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
          {locale === 'zh' ? '返回网站' : 'Back to Site'}
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
            <h2 className="text-lg font-semibold text-gray-800">
              {locale === 'zh' ? '管理面板' : 'Admin Panel'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              {locale === 'zh' ? 'EN' : '中文'}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">
                {locale === 'zh' ? '管理员' : 'Administrator'}
              </p>
              <p className="text-xs text-gray-400">admin@yujiangshiptech.com</p>
            </div>
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
