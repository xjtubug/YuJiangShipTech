'use client';

import { useState } from 'react';
import {
  FileText,
  Calendar,
  CalendarDays,
  CalendarRange,
  Send,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  MessageSquare,
  Flame,
} from 'lucide-react';

type ReportType = 'daily' | 'weekly' | 'monthly';

interface ReportData {
  type: string;
  period: { from: string; to: string };
  totalVisitors: number;
  newVisitors: number;
  totalInquiries: number;
  inquiriesByStatus: Record<string, number>;
  topProducts: Array<{ name: string; views: number }>;
  topCountries: Array<{ country: string; count: number }>;
  leadScoreDistribution: {
    cold: number;
    warm: number;
    hot: number;
    veryHot: number;
  };
}

interface GeneratedReport {
  type: ReportType;
  data: ReportData;
  generatedAt: string;
  emailSent?: boolean;
}

const REPORT_TYPES: {
  type: ReportType;
  label: string;
  desc: string;
  icon: typeof Calendar;
}[] = [
  {
    type: 'daily',
    label: 'Daily Report',
    desc: 'Last 24 hours summary',
    icon: Calendar,
  },
  {
    type: 'weekly',
    label: 'Weekly Report',
    desc: 'Last 7 days summary',
    icon: CalendarDays,
  },
  {
    type: 'monthly',
    label: 'Monthly Report',
    desc: 'Last 30 days summary',
    icon: CalendarRange,
  },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [email, setEmail] = useState('');
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [preview, setPreview] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (type: ReportType) => {
    setGenerating(type);
    setError(null);
    try {
      const body: { type: string; email?: string } = { type };
      if (email.trim()) body.email = email.trim();

      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();

      const report: GeneratedReport = {
        type,
        data: data.report,
        generatedAt: new Date().toISOString(),
        emailSent: !!email.trim(),
      };

      setReports((prev) => [report, ...prev]);
      setPreview(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = (report: GeneratedReport) => {
    const content = JSON.stringify(report.data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.type}-${report.data.period.from.split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {REPORT_TYPES.map(({ type, label, desc, icon: Icon }) => (
          <div
            key={type}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 p-2.5 rounded-lg">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{label}</h3>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
            <button
              onClick={() => generateReport(type)}
              disabled={generating !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating === type ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Email Option */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Report (Optional)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Enter an email to automatically send the generated report
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yujiangshiptech.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Send className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Report Preview */}
      {preview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Report Preview — {preview.type.charAt(0).toUpperCase() + preview.type.slice(1)}
          </h3>
          <p className="text-xs text-gray-400">
            Period: {new Date(preview.period.from).toLocaleDateString()} —{' '}
            {new Date(preview.period.to).toLocaleDateString()}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {preview.totalVisitors}
              </p>
              <p className="text-xs text-gray-500">Total Visitors</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600 mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {preview.newVisitors}
              </p>
              <p className="text-xs text-gray-500">New Visitors</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600 mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {preview.totalInquiries}
              </p>
              <p className="text-xs text-gray-500">Inquiries</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600 mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {preview.leadScoreDistribution.hot +
                  preview.leadScoreDistribution.veryHot}
              </p>
              <p className="text-xs text-gray-500">Hot Leads</p>
            </div>
          </div>

          {/* Lead Score Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Lead Score Distribution
            </h4>
            <div className="flex gap-3">
              {[
                { label: 'Cold', value: preview.leadScoreDistribution.cold, color: 'bg-gray-200' },
                { label: 'Warm', value: preview.leadScoreDistribution.warm, color: 'bg-amber-300' },
                { label: 'Hot', value: preview.leadScoreDistribution.hot, color: 'bg-orange-400' },
                { label: 'Very Hot', value: preview.leadScoreDistribution.veryHot, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-gray-600">
                    {item.label}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          {preview.topProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Top Products
              </h4>
              <div className="space-y-1">
                {preview.topProducts.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50"
                  >
                    <span className="text-gray-700">
                      {i + 1}. {p.name}
                    </span>
                    <span className="text-gray-400">{p.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Countries */}
          {preview.topCountries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Top Countries
              </h4>
              <div className="flex flex-wrap gap-2">
                {preview.topCountries.map((c, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                  >
                    {c.country}: {c.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Reports History */}
      {reports.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Generated Reports</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {reports.map((report, i) => (
              <div
                key={i}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">
                      {report.type} Report
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(report.data.period.from).toLocaleDateString()} —{' '}
                      {new Date(report.data.period.to).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {report.emailSent && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Emailed
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(report.generatedAt).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => downloadReport(report)}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreview(report.data)}
                    className="px-3 py-1.5 rounded-lg text-sm text-primary-600 hover:bg-primary-50"
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
