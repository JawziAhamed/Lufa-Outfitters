import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Loader, SectionHeader } from '../../components';
import { analyticsService } from '../../services/analyticsService';
import { currency } from '../../utils/format';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

const StatCard = ({ label, value, sub }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
  </div>
);

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: resp } = await analyticsService.returnsComplaints();
      setData(resp);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { data: blob } = await analyticsService.downloadReturnsComplaintsReport({
        from: dateFrom,
        to: dateTo,
      });
      downloadBlob(blob, `returns-complaints-${dateFrom}-to-${dateTo}.pdf`);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Loader label="Loading reports..." />;

  const summary = data?.summary || {};
  const returnsByStatus = data?.returnsByStatus || [];
  const complaintsByStatus = data?.complaintsByStatus || [];
  const mostReturnedProducts = data?.mostReturnedProducts || [];

  const returnChartData = returnsByStatus.map((r) => ({
    name: String(r._id || '').replace(/_/g, ' '),
    count: r.count,
    refunded: r.refunded || 0,
  }));

  const complaintChartData = complaintsByStatus.map((c) => ({
    name: String(c._id || '').replace(/_/g, ' '),
    count: c.count,
  }));

  const productChartData = mostReturnedProducts.map((p) => ({
    name: p._id || 'Unknown',
    returns: p.returnCount,
  }));

  return (
    <div>
      <SectionHeader
        title="Returns & Complaints Reports"
        description="Analytics and PDF export for return requests and complaint tickets."
      />

      {/* PDF Download Controls */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {downloading ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
        <button
          type="button"
          onClick={fetchData}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Refresh Data
        </button>
      </div>

      {/* ── Returns Summary Cards ───────────────────── */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Return & Refund Summary
      </h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Returns" value={summary.totalReturns ?? 0} />
        <StatCard
          label="Approval Rate"
          value={`${summary.approvalRate ?? 0}%`}
          sub={`${summary.approvedCount ?? 0} approved of ${summary.totalReturns ?? 0}`}
        />
        <StatCard
          label="Rejection Rate"
          value={`${summary.rejectionRate ?? 0}%`}
          sub={`${summary.rejectedCount ?? 0} rejected`}
        />
        <StatCard
          label="Total Refunded"
          value={currency(summary.totalRefunded ?? 0)}
          sub="Across all refunded returns"
        />
        <StatCard label="Total Complaints" value={summary.totalComplaints ?? 0} />
        <StatCard
          label="Avg Resolution Time"
          value={
            summary.avgResolutionHours != null ? `${summary.avgResolutionHours}h` : 'N/A'
          }
          sub="For resolved/closed complaints"
        />
      </div>

      {/* ── Returns by Status ───────────────────────── */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Returns by Status</h3>
          {returnChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={returnChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No data</p>
          )}
        </div>

        {/* Complaints by Status Pie */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Complaints by Status</h3>
          {complaintChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={complaintChartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, count }) => `${name}: ${count}`}
                  labelLine={false}
                >
                  {complaintChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No data</p>
          )}
        </div>
      </div>

      {/* ── Most Returned Products ──────────────────── */}
      {productChartData.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Most Returned Products</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={productChartData}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="returns" fill="#334155" radius={[0, 4, 4, 0]} name="Returns" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Tables ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Returns breakdown table */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Returns Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="pb-2 text-right text-xs font-semibold uppercase text-slate-500">Count</th>
                <th className="pb-2 text-right text-xs font-semibold uppercase text-slate-500">Refunded</th>
              </tr>
            </thead>
            <tbody>
              {returnsByStatus.map((r) => (
                <tr key={r._id} className="border-b border-slate-50">
                  <td className="py-2 capitalize">{String(r._id || '').replace(/_/g, ' ')}</td>
                  <td className="py-2 text-right font-medium">{r.count}</td>
                  <td className="py-2 text-right text-slate-600">{currency(r.refunded || 0)}</td>
                </tr>
              ))}
              {returnsByStatus.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Complaints breakdown table */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Complaints Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="pb-2 text-right text-xs font-semibold uppercase text-slate-500">Count</th>
              </tr>
            </thead>
            <tbody>
              {complaintsByStatus.map((c) => (
                <tr key={c._id} className="border-b border-slate-50">
                  <td className="py-2 capitalize">{String(c._id || '').replace(/_/g, ' ')}</td>
                  <td className="py-2 text-right font-medium">{c.count}</td>
                </tr>
              ))}
              {complaintsByStatus.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-slate-400">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
