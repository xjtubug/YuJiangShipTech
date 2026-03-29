'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  MessageSquare,
  Package,
  Flame,
  Eye,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/admin/StatCard';

interface Stats {
  totalVisitors: number;
  totalInquiries: number;
  totalProducts: number;
  highValueLeads: number;
  recentInquiries: Array<{
    id: string;
    inquiryNumber: string;
    companyName: string;
    contactName: string;
    email: string;
    status: string;
    createdAt: string;
    items: Array<{ productName: string }>;
  }>;
  topProducts: Array<{
    nameEn?: string;
    slug?: string;
    viewCount: number;
  }>;
  visitorsByCountry: Array<{
    country: string;
    count: number;
  }>;
  chartData: Array<{
    date: string;
    visitors: number;
    inquiries: number;
  }>;
}

const PIE_COLORS = [
  '#2d5086', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-80">
              <div className="animate-pulse h-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">Failed to load dashboard data</p>
        <p className="text-red-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Visitors"
          value={stats.totalVisitors}
          icon={Users}
          trend="up"
          trendValue="All time"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Inquiries"
          value={stats.totalInquiries}
          icon={MessageSquare}
          trend="up"
          trendValue="All time"
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          trend="neutral"
          trendValue="Published"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="High-Value Leads"
          value={stats.highValueLeads}
          icon={Flame}
          trend="up"
          trendValue="Score ≥ 50"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Visitors Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Daily Visitors (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
              />
              <Line
                type="monotone"
                dataKey="visitors"
                stroke="#2d5086"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Inquiries Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Daily Inquiries (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
              />
              <Bar dataKey="inquiries" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visitors by Country Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Visitors by Country
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.visitorsByCountry.slice(0, 10)}
                dataKey="count"
                nameKey="country"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`
                }
                labelLine={{ strokeWidth: 1 }}
              >
                {stats.visitorsByCountry.slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Viewed Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Top Viewed Products
          </h3>
          <div className="space-y-3">
            {stats.topProducts.length === 0 && (
              <p className="text-gray-400 text-sm">No product views yet</p>
            )}
            {stats.topProducts.map((product, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 truncate">
                  {product.nameEn ?? 'Unknown Product'}
                </span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye className="w-3.5 h-3.5" />
                  {product.viewCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Inquiries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            Recent Inquiries
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Products
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentInquiries.map((inq) => (
                <tr
                  key={inq.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {inq.companyName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {inq.contactName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {inq.items.length > 0
                      ? inq.items.map((it) => it.productName).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[inq.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {inq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/${locale}/admin/inquiries`}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {stats.recentInquiries.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400 text-sm"
                  >
                    No inquiries yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
