import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { Loader, SectionHeader } from '../../components';
import { orderService } from '../../services/orderService';
import { currency, shortDate } from '../../utils/format';
import { resolveProductImageUrl } from '../../utils/image';

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='22'%3ENo Image%3C/text%3E%3C/svg%3E";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const justPlaced = Boolean(location.state?.justPlaced);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data } = await orderService.getOrderById(id);
        setOrder(data.order || null);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const orderCode = useMemo(() => String(order?._id || '').slice(-8).toUpperCase(), [order?._id]);

  if (loading) {
    return <Loader label="Loading order details" />;
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Order not found.</p>
        <Link to="/dashboard/orders" className="text-sm font-semibold text-slate-900 underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Order Preview"
        title={`Order #${orderCode}`}
        description="This is the final customization preview that will be used for printing."
      />

      {justPlaced ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your order has been placed successfully. Review your customized designs below.
        </div>
      ) : null}

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Date</p>
          <p className="text-sm text-slate-800">{shortDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="text-sm text-slate-800">
            {order.status} | {order.paymentStatus}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Method</p>
          <p className="text-sm text-slate-800">{order.paymentMethod}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final Total</p>
          <p className="text-sm font-bold text-slate-900">{currency(order.total)}</p>
        </div>
      </section>

      <section className="space-y-3">
        {order.items.map((item, index) => {
          const baseImage =
            resolveProductImageUrl(
              item.baseProductImage || item.customization?.baseProductImage || item.product?.imageUrl
            ) || fallbackImage;
          const customImage =
            resolveProductImageUrl(item.customPreviewImage || item.customization?.customPreviewImage) ||
            fallbackImage;

          return (
            <article key={`${item.product}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <p className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Base T-shirt
                  </p>
                  <img
                    src={baseImage}
                    alt={`${item.productName} base`}
                    className="h-56 w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = fallbackImage;
                    }}
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <p className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Your Customized Design (Will be printed and delivered)
                  </p>
                  <img
                    src={customImage}
                    alt={`${item.productName} custom`}
                    className="h-56 w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = fallbackImage;
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-900">{item.productName}</span>
                </p>
                <p className="sm:text-right">
                  Qty: {item.quantity} | Unit: {currency(item.unitPrice)}
                </p>
                <p>
                  Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                </p>
                <p className="font-semibold text-slate-900 sm:text-right">Subtotal: {currency(item.totalPrice)}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Address</p>
        <p className="mt-2 text-sm text-slate-700">
          {order.deliveryAddress?.fullName} | {order.deliveryAddress?.phone}
        </p>
        <p className="text-sm text-slate-700">
          {order.deliveryAddress?.addressLine1}
          {order.deliveryAddress?.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
        </p>
        <p className="text-sm text-slate-700">
          {order.deliveryAddress?.city}, {order.deliveryAddress?.state}, {order.deliveryAddress?.country}{' '}
          {order.deliveryAddress?.postalCode}
        </p>
      </section>
    </div>
  );
};

export default OrderDetailsPage;
