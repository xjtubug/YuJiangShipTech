'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Download, Star, Filter, RefreshCw } from 'lucide-react';
import DataTable, { Column } from '@/components/admin/DataTable';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';

interface Visitor {
  id: string;
  ip: string;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  leadScore: number;
  isHighValue: boolean;
  visitCount: number;
  lastVisit: string;
  firstVisit: string;
  _count: { pageViews: number; inquiries: number };
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [country, setCountry] = useState('');
  const [minScore, setMinScore] = useState(0);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (country) qs.set('country', country);
      if (minScore > 0) qs.set('minScore', String(minScore));

      const res = await fetch(`/api/admin/visitors?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVisitors(data.visitors);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, [page, country, minScore]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const exportCSV = () => {
    const headers = ['IP', 'Country', 'City', 'Browser', 'Device', 'Lead Score', 'Visits', 'Last Visit'];
    const rows = visitors.map((v) => [
      v.ip,
      v.country ?? '',
      v.city ?? '',
      v.browser ?? '',
      v.device ?? '',
      v.leadScore,
      v.visitCount,
      new Date(v.lastVisit).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markHighValue = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/admin/visitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHighValue: true }),
      });
      setVisitors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isHighValue: true } : v))
      );
    } catch {
      // silently fail
    }
  };

  const columns: Column<Visitor & Record<string, unknown>>[] = [
    {
      key: 'ip',
      header: 'IP Address',
      render: (row) => (
        <span className="font-mono text-xs">{row.ip}</span>
      ),
    },
    {
      key: 'country',
      header: 'Location',
      sortable: true,
      render: (row) => (
        <span>
          {row.country ?? '—'}
          {row.city ? `, ${row.city}` : ''}
        </span>
      ),
    },
    {
      key: 'browser',
      header: 'Browser',
      render: (row) => <span>{row.browser ?? '—'}</span>,
    },
    {
      key: 'device',
      header: 'Device',
      render: (row) => <span className="capitalize">{row.device ?? '—'}</span>,
    },
    {
      key: 'leadScore',
      header: 'Lead Score',
      sortable: true,
      render: (row) => <LeadScoreBadge score={row.leadScore} />,
    },
    {
      key: 'visitCount',
      header: 'Visits',
      sortable: true,
      render: (row) => <span className="font-medium">{row.visitCount}</span>,
    },
    {
      key: 'lastVisit',
      header: 'Last Visit',
      sortable: true,
      render: (row) => (
        <span className="text-gray-500 whitespace-nowrap">
          {new Date(row.lastVisit).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {!row.isHighValue && (
            <button
              onClick={(e) => markHighValue(row.id, e)}
              className="p-1 rounded hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors"
              title="Mark as High Value"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          {row.isHighValue && (
            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchVisitors}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            Filters
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Country
              </label>
              <input
                type="text"
                placeholder="Filter by country..."
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Min Lead Score: {minScore}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => {
                  setMinScore(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full accent-primary-600"
              />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={visitors as (Visitor & Record<string, unknown>)[]}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/${locale}/admin/visitors/${row.id}`)}
        rowKey={(row) => row.id}
        emptyMessage="No visitors found"
      />
    </div>
  );
}
