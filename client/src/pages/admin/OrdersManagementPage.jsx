import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Loader, Pagination, SectionHeader } from '../../components';
import { orderService } from '../../services/orderService';
import { currency, shortDate } from '../../utils/format';
import { resolveProductImageUrl } from '../../utils/image';

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const paymentStatusOptions = ['', 'pending', 'partially_paid', 'paid', 'refunded'];
const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";

const toLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const OrdersManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ page: 1, limit: 10, status: '', paymentStatus: '' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await orderService.getAllOrders(query);
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
  }, [query.page, query.limit, query.status, query.paymentStatus]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order');
    }
  };

  return (
    <div>
      <SectionHeader
        title="Orders"
        description="Review complete customer order details, pricing breakdowns, delivery info, and fulfillment progress."
      />

      <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Order Status
          <select
            value={query.status}
            onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, status: event.target.value }))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {toLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Payment Status
          <select
            value={query.paymentStatus}
            onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, paymentStatus: event.target.value }))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All payment statuses</option>
            {paymentStatusOptions
              .filter(Boolean)
              .map((status) => (
                <option key={status} value={status}>
                  {toLabel(status)}
                </option>
              ))}
          </select>
        </label>
      </div>

      {loading ? <Loader label="Loading orders" /> : null}

      {!loading ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="break-all text-[11px] text-slate-400">{order._id}</p>
                  <p className="text-xs text-slate-500">Placed on {shortDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    Payment: {toLabel(order.paymentStatus)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(event) => handleStatusChange(order._id, event.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {toLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr,1fr]">
                <section className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {order.user?.name || order.deliveryAddress?.fullName || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-600">
                      Email: {order.user?.email || 'N/A'} | Phone: {order.deliveryAddress?.phone || 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200">
                    <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ordered Products
                    </p>
                    <div className="space-y-2 p-2">
                      {order.items.map((item, index) => {
                        const baseImageSrc =
                          resolveProductImageUrl(
                            item.baseProductImage || item.customization?.baseProductImage || item.product?.imageUrl
                          ) || fallbackImage;
                        const customPreviewSrc =
                          resolveProductImageUrl(item.customPreviewImage || item.customization?.customPreviewImage) ||
                          fallbackImage;

                        return (
                          <div
                            key={`${order._id}-${item.product?._id || item.productName}-${index}`}
                            className="grid items-center gap-3 rounded-lg border border-slate-100 p-2 sm:grid-cols-[150px,1fr]"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Base T-shirt
                                </p>
                                <img
                                  src={baseImageSrc}
                                  alt={`${item.productName} base`}
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = fallbackImage;
                                  }}
                                  className="h-16 w-full object-cover"
                                />
                              </div>
                              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Customized Design
                                </p>
                                <img
                                  src={customPreviewSrc}
                                  alt={`${item.productName} custom preview`}
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = fallbackImage;
                                  }}
                                  className="h-16 w-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="grid gap-1 sm:grid-cols-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                                <p className="text-xs text-slate-500">
                                  Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                                </p>
                                {item.customization?.shirtColor ? (
                                  <p className="text-xs text-slate-500">
                                    Shirt color: {item.customization.shirtColor}
                                  </p>
                                ) : null}
                                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                <p className="text-[11px] font-semibold text-indigo-700">
                                  Your Customized Design (Will be printed and delivered)
                                </p>
                              </div>
                              <div className="text-xs text-slate-700 sm:text-right">
                                <p>Unit: {currency(item.unitPrice)}</p>
                                <p className="font-semibold text-slate-900">
                                  Subtotal: {currency(item.totalPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <aside className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Method: <span className="font-semibold">{toLabel(order.paymentMethod)}</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Status: <span className="font-semibold">{toLabel(order.paymentStatus)}</span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing</p>
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{currency(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>
                          Promo
                          {order.promoCode ? ` (${order.promoCode})` : ''}
                        </span>
                        <span>- {currency(order.promoDiscount || 0)}</span>
                      </div>
                      {order.promoDiscount > 0 && order.subtotal > 0 ? (
                        <div className="text-xs text-emerald-700">
                          Discount rate: {((order.promoDiscount / order.subtotal) * 100).toFixed(2)}%
                        </div>
                      ) : null}
                      <div className="flex justify-between text-emerald-700">
                        <span>Gift Card</span>
                        <span>- {currency(order.giftCardAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{currency(order.deliveryFee || 0)}</span>
                      </div>
                      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                        <span>Final Total</span>
                        <span>{currency(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Address</p>
                    <p className="mt-1 break-words text-sm text-slate-700">
                      {order.deliveryAddress?.addressLine1}
                      {order.deliveryAddress?.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
                    </p>
                    <p className="text-sm text-slate-700">
                      {order.deliveryAddress?.city}, {order.deliveryAddress?.state}, {order.deliveryAddress?.country}{' '}
                      {order.deliveryAddress?.postalCode}
                    </p>
                  </div>
                </aside>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Pagination pagination={pagination} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} />
    </div>
  );
};

export default OrdersManagementPage;
