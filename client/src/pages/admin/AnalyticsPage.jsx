import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';

import { Loader, SectionHeader } from '../../components';
import { analyticsService } from '../../services/analyticsService';
import { useAuthStore } from '../../store/authStore';
import { currency } from '../../utils/format';

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1200);
};

const getDownloadFileName = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] || fallback;
};

const AnalyticsPage = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const [dashboard, setDashboard] = useState(null);
  const [returnsReport, setReturnsReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');
  const [reportDates, setReportDates] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);

    return {
      from: toDateInputValue(from),
      to: toDateInputValue(to),
    };
  });

  const monthlyChartData = useMemo(() => {
    const rows = dashboard?.monthlySales || [];
    return rows.map((row) => ({
      month: `${row._id.month}/${String(row._id.year).slice(-2)}`,
      sales: Number(row.sales || 0),
      orders: Number(row.orders || 0),
    }));
  }, [dashboard]);

  const returnChartData = useMemo(() => {
    const rows = returnsReport?.returnsByStatus || [];
    return rows.map((row) => ({
      status: row._id,
      count: row.count,
    }));
  }, [returnsReport]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [{ data: dashboardData }, { data: returnData }] = await Promise.all([
          analyticsService.dashboard(),
          analyticsService.returnsComplaints(),
        ]);

        setDashboard(dashboardData);
        setReturnsReport(returnData);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleDownloadSalesReport = async () => {
    if (!isAdmin) {
      toast.error('Only admin users can download reports');
      return;
    }

    if (!reportDates.from || !reportDates.to) {
      toast.error('Please provide both from and to dates');
      return;
    }

    if (new Date(reportDates.from) > new Date(reportDates.to)) {
      toast.error('Invalid date range');
      return;
    }

    try {
      setDownloading('sales');
      const response = await analyticsService.downloadSalesReport(reportDates);
      const filename = getDownloadFileName(
        response.headers?.['content-disposition'],
        `sales-report-${reportDates.from}.pdf`
      );
      triggerDownload(response.data, filename);
      toast.success('Sales report downloaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download sales report');
    } finally {
      setDownloading('');
    }
  };

  const handleDownloadStockReport = async () => {
    if (!isAdmin) {
      toast.error('Only admin users can download reports');
      return;
    }

    try {
      setDownloading('stock');
      const response = await analyticsService.downloadStockReport();
      const filename = getDownloadFileName(
        response.headers?.['content-disposition'],
        `stock-report-${reportDates.to || 'latest'}.pdf`
      );
      triggerDownload(response.data, filename);
      toast.success('Stock report downloaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download stock report');
    } finally {
      setDownloading('');
    }
  };

  if (loading) {
    return <Loader label="Loading analytics" />;
  }

  const summary = dashboard?.summary || {};

  return (
    <div>
      <SectionHeader
        title="Analytics"
        description="Operational and sales insights for admin/staff."
        action={
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:min-w-[350px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Download Reports</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                From
                <input
                  type="date"
                  value={reportDates.from}
                  onChange={(event) =>
                    setReportDates((prev) => ({
                      ...prev,
                      from: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs text-slate-700"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                To
                <input
                  type="date"
                  value={reportDates.to}
                  onChange={(event) =>
                    setReportDates((prev) => ({
                      ...prev,
                      to: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-xs text-slate-700"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleDownloadSalesReport}
                disabled={!isAdmin || downloading === 'sales'}
                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading === 'sales' ? 'Generating...' : 'Download Sales Report (PDF)'}
              </button>
              <button
                type="button"
                onClick={handleDownloadStockReport}
                disabled={!isAdmin || downloading === 'stock'}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading === 'stock' ? 'Generating...' : 'Download Stock Report (PDF)'}
              </button>
            </div>
            {!isAdmin ? (
              <p className="text-xs text-amber-600">Only Admin users can download PDF reports.</p>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-500">Revenue</p>
          <p className="text-2xl font-bold text-slate-900">{currency(summary.totalRevenue || 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-500">Orders</p>
          <p className="text-2xl font-bold text-slate-900">{summary.totalOrders || 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-500">Low Stock Alerts</p>
          <p className="text-2xl font-bold text-slate-900">{summary.lowStockCount || 0}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Monthly Sales</h3>
          <div className="mt-3 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => currency(value)} />
                <Line dataKey="sales" stroke="#0f172a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Return Requests by Status</h3>
          <div className="mt-3 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Top Products</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[560px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2">Units Sold</th>
                <th className="px-2 py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.topProducts || []).map((product) => (
                <tr key={product._id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{product.productName}</td>
                  <td className="px-2 py-2">{product.unitsSold}</td>
                  <td className="px-2 py-2">{currency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
