'use client';

import { useEffect, useState, useCallback } from 'react';

import { useParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface InquiryItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  specs: string | null;
}

interface Inquiry {
  id: string;
  inquiryNumber: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  country: string | null;
  message: string | null;
  techRequirements: string | null;
  status: string;
  createdAt: string;
  items: InquiryItem[];
}

const STATUSES = ['all', 'new', 'processing', 'quoted', 'closed'] as const;

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  processing: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  quoted: 'bg-green-100 text-green-800 ring-green-600/20',
  closed: 'bg-gray-100 text-gray-600 ring-gray-500/20',
};

const TAB_COLORS: Record<string, string> = {
  all: 'bg-primary-600 text-white',
  new: 'bg-blue-600 text-white',
  processing: 'bg-yellow-500 text-white',
  quoted: 'bg-green-600 text-white',
  closed: 'bg-gray-500 text-white',
};

export default function InquiriesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') qs.set('status', statusFilter);

      const res = await fetch(`/api/admin/inquiries?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInquiries(data.inquiries);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: updated.status } : inq))
      );
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadPDF = (inq: Inquiry) => {
    // Simple text-based download as a placeholder for PDF
    const content = [
      `Inquiry: ${inq.inquiryNumber}`,
      `Date: ${new Date(inq.createdAt).toLocaleDateString()}`,
      `Company: ${inq.companyName}`,
      `Contact: ${inq.contactName}`,
      `Email: ${inq.email}`,
      `Phone: ${inq.phone ?? '—'}`,
      `Country: ${inq.country ?? '—'}`,
      `Status: ${inq.status}`,
      '',
      'Products:',
      ...inq.items.map(
        (it) => `  - ${it.productName} × ${it.quantity} ${it.unit}`
      ),
      '',
      `Message: ${inq.message ?? '—'}`,
      `Tech Requirements: ${inq.techRequirements ?? '—'}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inq.inquiryNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <button
          onClick={fetchInquiries}
          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 self-end sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              statusFilter === s
                ? TAB_COLORS[s]
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded flex-1" />
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inquiries List */}
      {!loading && inquiries.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No inquiries found</p>
        </div>
      )}

      {!loading && inquiries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    #
                  </th>
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Products
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => (
                  <>
                    <tr
                      key={inq.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === inq.id ? null : inq.id)
                      }
                    >
                      <td className="px-4 py-3">
                        {expandedId === inq.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 whitespace-nowrap">
                        {inq.inquiryNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {inq.companyName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {inq.contactName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {inq.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {inq.items.length} item{inq.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset capitalize ${STATUS_COLORS[inq.status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20'}`}
                        >
                          {inq.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={inq.status}
                            onChange={(e) => updateStatus(inq.id, e.target.value)}
                            disabled={updatingId === inq.id}
                            className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            <option value="new">New</option>
                            <option value="processing">Processing</option>
                            <option value="quoted">Quoted</option>
                            <option value="closed">Closed</option>
                          </select>
                          <button
                            onClick={() => downloadPDF(inq)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/${locale}/admin/quotations?fromInquiry=${inq.id}`)}
                            className="p-1 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600"
                            title="Create Quotation"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === inq.id && (
                      <tr key={`${inq.id}-detail`} className="bg-gray-50">
                        <td colSpan={9} className="px-8 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Phone:{' '}
                                </span>
                                <span className="text-gray-700">
                                  {inq.phone ?? '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Country:{' '}
                                </span>
                                <span className="text-gray-700">
                                  {inq.country ?? '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Message:{' '}
                                </span>
                                <span className="text-gray-700">
                                  {inq.message ?? '—'}
                                </span>
                              </div>
                              {inq.techRequirements && (
                                <div>
                                  <span className="text-gray-500 font-medium">
                                    Tech Requirements:{' '}
                                  </span>
                                  <span className="text-gray-700">
                                    {inq.techRequirements}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-500 font-medium block mb-2">
                                Products:
                              </span>
                              <div className="space-y-2">
                                {inq.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                                  >
                                    <span className="text-gray-700">
                                      {item.productName}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {item.quantity} {item.unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
