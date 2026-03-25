import { Link } from 'react-router-dom';

import { EmptyState, SectionHeader } from '../components';
import TShirtPreviewPair from '../components/TShirtPreviewPair';
import { useCartStore } from '../store/cartStore';
import { currency } from '../utils/format';
import { resolveProductImageUrl } from '../utils/image';

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='26'%3ENo Image%3C/text%3E%3C/svg%3E";

const CartPage = () => {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const subtotal = useCartStore((state) => state.subtotal());

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Your Bag"
        title="Cart"
        description="Review selected custom products, tweak quantities, and continue to checkout."
      />

      {items.length === 0 ? (
        <EmptyState title="Your cart is empty" description="Add products and customize them before checkout." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.4fr,0.6fr]">
          <div className="space-y-4">
            {items.map((item, index) => (
              <article
                key={`${item.productId}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4">
                  <TShirtPreviewPair
                    productName={item.productName}
                    baseSrc={resolveProductImageUrl(
                      item.baseProductImage || item.customization?.baseProductImage
                    )}
                    customSrc={resolveProductImageUrl(
                      item.customPreviewImage || item.customization?.customPreviewImage
                    )}
                    fallbackSrc={fallbackImage}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">{item.productName}</h3>
                    <p className="text-sm text-slate-500">
                      Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                    </p>
                    {item.customization?.shirtColor ? (
                      <p className="text-xs text-slate-500">
                        Shirt color: <span className="font-semibold">{item.customization.shirtColor}</span>
                      </p>
                    ) : null}
                    {item.customization?.note ? (
                      <p className="text-xs text-slate-500">Note: {item.customization.note}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateItemQuantity(index, Number(event.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm focus:border-slate-400 focus:outline-none sm:w-20"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                  <span>Unit: {currency(item.unitPrice)}</span>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                    Line Total: {currency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur xl:sticky xl:top-24">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Order Summary</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{currency(subtotal)}</p>
            <p className="text-sm text-slate-500">Taxes & delivery calculated at checkout</p>
            <Link
              to="/checkout"
              className="mt-5 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              Proceed to Checkout
            </Link>
            <p className="mt-3 text-xs text-slate-500">
              Need to edit a design? You can do it from the product page before placing the order.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
