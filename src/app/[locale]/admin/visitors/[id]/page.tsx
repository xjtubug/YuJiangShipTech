'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Monitor,
  Globe,
  Clock,
  Eye,
  Star,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';

interface PageViewData {
  id: string;
  path: string;
  title: string | null;
  duration: number;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    nameEn: string;
    images: string;
  } | null;
}

interface InquiryData {
  id: string;
  inquiryNumber: string;
  companyName: string;
  contactName: string;
  email: string;
  status: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
}

interface VisitorDetail {
  id: string;
  ip: string;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  language: string | null;
  referrer: string | null;
  leadScore: number;
  isHighValue: boolean;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  pageViews: PageViewData[];
  inquiries: InquiryData[];
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getScoreColor(score: number) {
  if (score >= 81) return { bar: 'bg-red-500', bg: 'bg-red-100' };
  if (score >= 51) return { bar: 'bg-orange-500', bg: 'bg-orange-100' };
  if (score >= 21) return { bar: 'bg-amber-500', bg: 'bg-amber-100' };
  return { bar: 'bg-gray-400', bg: 'bg-gray-100' };
}

export default function VisitorDetailPage() {
  const [visitor, setVisitor] = useState<VisitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    fetch(`/api/admin/visitors/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(setVisitor)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const markHighValue = async () => {
    if (!visitor) return;
    try {
      await fetch(`/api/admin/visitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHighValue: true }),
      });
      setVisitor((prev) => (prev ? { ...prev, isHighValue: true } : prev));
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6 h-64 animate-pulse" />
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6 h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !visitor) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Visitors
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">Visitor not found</p>
        </div>
      </div>
    );
  }

  const productsViewed = visitor.pageViews.filter((pv) => pv.product !== null);
  const uniqueProducts = Array.from(
    new Map(productsViewed.map((pv) => [pv.product!.id, pv.product!])).values()
  );
  const scoreColor = getScoreColor(visitor.leadScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visitor Detail</h1>
            <p className="text-sm text-gray-500 font-mono">{visitor.ip}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!visitor.isHighValue ? (
            <button
              onClick={markHighValue}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 bg-orange-50 text-orange-700 text-sm font-medium hover:bg-orange-100 transition-colors"
            >
              <Star className="w-4 h-4" />
              Mark as High Value
            </button>
          ) : (
            <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium">
              <Star className="w-4 h-4 fill-orange-500" />
              High Value Lead
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Visitor Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700 font-medium">
                  {[visitor.city, visitor.region, visitor.country]
                    .filter(Boolean)
                    .join(', ') || 'Unknown'}
                </p>
                <p className="text-gray-400 text-xs">Location</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700">{visitor.browser ?? '—'}</p>
                <p className="text-gray-400 text-xs">Browser</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Monitor className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700 capitalize">
                  {visitor.device ?? '—'} · {visitor.os ?? '—'}
                </p>
                <p className="text-gray-400 text-xs">Device & OS</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700">
                  {new Date(visitor.firstVisit).toLocaleDateString()}
                </p>
                <p className="text-gray-400 text-xs">First Visit</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700">
                  {new Date(visitor.lastVisit).toLocaleDateString()}
                </p>
                <p className="text-gray-400 text-xs">Last Visit</p>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Total Visits</p>
            <p className="text-2xl font-bold text-gray-900">
              {visitor.visitCount}
            </p>
          </div>
        </div>

        {/* Lead Score & Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Score Gauge */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Lead Score</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <LeadScoreBadge score={visitor.leadScore} />
                  <span className="text-2xl font-bold text-gray-900">
                    {visitor.leadScore}
                  </span>
                </div>
                <div className={`w-full h-3 rounded-full ${scoreColor.bg}`}>
                  <div
                    className={`h-3 rounded-full transition-all ${scoreColor.bar}`}
                    style={{ width: `${Math.min(visitor.leadScore, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Cold</span>
                  <span>Warm</span>
                  <span>Hot</span>
                  <span>Very Hot</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Viewed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Products Viewed ({uniqueProducts.length})
            </h3>
            {uniqueProducts.length === 0 ? (
              <p className="text-gray-400 text-sm">No products viewed</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uniqueProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-700 truncate">
                      {product.nameEn}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Browsing History Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">
          Browsing History ({visitor.pageViews.length} pages)
        </h3>
        {visitor.pageViews.length === 0 ? (
          <p className="text-gray-400 text-sm">No page views recorded</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-4">
              {visitor.pageViews.slice(0, 50).map((pv) => (
                <div key={pv.id} className="flex items-start gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center flex-shrink-0 z-10">
                    <Eye className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {pv.title || pv.path}
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {pv.path}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>
                        {new Date(pv.createdAt).toLocaleString()}
                      </span>
                      {pv.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(pv.duration)}
                        </span>
                      )}
                      {pv.product && (
                        <span className="text-primary-600">
                          Product: {pv.product.nameEn}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inquiries from this visitor */}
      {visitor.inquiries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Inquiries ({visitor.inquiries.length})
          </h3>
          <div className="space-y-3">
            {visitor.inquiries.map((inq) => (
              <div
                key={inq.id}
                className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {inq.inquiryNumber}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[inq.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {inq.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {inq.companyName} — {inq.contactName}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {inq.items.map((it) => `${it.productName} ×${it.quantity}`).join(', ')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(inq.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
