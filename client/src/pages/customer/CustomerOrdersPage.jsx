import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { EmptyState, Loader, Pagination, SectionHeader } from '../../components';
import { orderService } from '../../services/orderService';
import { currency, shortDate } from '../../utils/format';
import { resolveProductImageUrl } from '../../utils/image';

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='22'%3ENo Image%3C/text%3E%3C/svg%3E";

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await orderService.getMyOrders({ page, limit: 8 });
      setOrders(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handlePayInstallment = async (orderId) => {
    try {
      await orderService.payInstallment(orderId);
      toast.success('Installment paid');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  return (
    <div>
      <SectionHeader title="My Orders" description="Track status, payment progress, and installment actions." />

      {loading ? <Loader label="Loading orders" /> : null}

      {!loading && orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Place your first customized order to see it here." />
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order._id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                <p className="break-all text-[11px] text-slate-400">{order._id}</p>
                <p className="text-xs text-slate-500">Placed on {shortDate(order.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">{order.status}</span>
                <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">{order.paymentStatus}</span>
              </div>
            </div>

            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {order.items.map((item, idx) => (
                <li
                  key={`${item.product}-${idx}`}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="overflow-hidden rounded border border-slate-200 bg-white">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Base T-shirt
                      </p>
                      <img
                        src={
                          resolveProductImageUrl(item.baseProductImage || item.customization?.baseProductImage || item.product?.imageUrl) ||
                          fallbackImage
                        }
                        alt={`${item.productName} base`}
                        className="h-36 w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackImage;
                        }}
                      />
                    </div>
                    <div className="overflow-hidden rounded border border-slate-200 bg-white">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Your Customized Design
                      </p>
                      <img
                        src={resolveProductImageUrl(item.customPreviewImage || item.customization?.customPreviewImage) || fallbackImage}
                        alt={`${item.productName} custom preview`}
                        className="h-36 w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackImage;
                        }}
                      />
                    </div>
                  </div>
                  <p className="mt-2">
                    {item.productName} x {item.quantity} ({currency(item.totalPrice)})
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <strong className="text-slate-900">Total: {currency(order.total)}</strong>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/dashboard/orders/${order._id}`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  View Order
                </Link>
                {order.paymentMethod === 'installment' && order.paymentStatus !== 'paid' ? (
                  <button
                    type="button"
                    onClick={() => handlePayInstallment(order._id)}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Pay Next Installment
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default CustomerOrdersPage;
