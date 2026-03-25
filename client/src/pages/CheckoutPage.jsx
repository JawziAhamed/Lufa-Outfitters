import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { EmptyState, SectionHeader } from '../components';
import TShirtPreviewPair from '../components/TShirtPreviewPair';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { PAYMENT_METHODS, SL_DISTRICTS } from '../utils/constants';
import { currency } from '../utils/format';
import { resolveProductImageUrl } from '../utils/image';

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='22'%3ENo Image%3C/text%3E%3C/svg%3E";

// ── District Combobox ──────────────────────────────────────────────────────────
const DistrictCombobox = ({ value, onChange, error }) => {
  const [search, setSearch] = useState(value || '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Keep search text in sync when value changes externally
  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        // If the typed text doesn't match any district, revert to the saved value
        const match = SL_DISTRICTS.find(
          (d) => d.name.toLowerCase() === search.trim().toLowerCase()
        );
        if (!match) setSearch(value || '');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [search, value]);

  const filtered = useMemo(
    () =>
      SL_DISTRICTS.filter((d) =>
        d.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [search]
  );

  const handleSelect = (district) => {
    setSearch(district.name);
    onChange(district.name);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setOpen(true);
    if (!e.target.value.trim()) onChange('');
  };

  const selectedDistrict = SL_DISTRICTS.find((d) => d.name === value);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Type to search district…"
          autoComplete="off"
          className={`mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 pr-9 text-sm shadow-inner transition focus:bg-white focus:outline-none ${
            error
              ? 'border-rose-400 focus:border-rose-500'
              : 'border-slate-200 focus:border-slate-400'
          }`}
        />
        {/* Chevron icon */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </span>
      </div>

      {/* Delivery fee badge next to selected district */}
      {selectedDistrict && !open && (
        <span className="absolute right-8 top-1/2 mt-0.5 -translate-y-1/2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          {currency(selectedDistrict.fee)} delivery
        </span>
      )}

      {/* Dropdown */}
      {open && (
        <ul className="absolute left-0 top-full z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-400">No districts found</li>
          ) : (
            filtered.map((d) => (
              <li
                key={d.name}
                onMouseDown={() => handleSelect(d)}
                className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                  d.name === value ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'
                }`}
              >
                <span>
                  {d.name}
                  <span className="ml-1.5 text-xs text-slate-400">{d.province}</span>
                </span>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {currency(d.fee)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

// ── CheckoutPage ──────────────────────────────────────────────────────────────
const CheckoutPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());
  const clearCart = useCartStore((state) => state.clearCart);

  const [summary, setSummary] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',        // holds the selected district name
      postalCode: '',
      paymentMethod: 'cod',
      promoCode: '',
      giftCardCode: '',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const promoCodeValue = watch('promoCode');
  const giftCardCodeValue = watch('giftCardCode');
  const stateValue = watch('state');   // district

  if (!items.length) {
    return <EmptyState title="No items in cart" description="Add products before checkout." />;
  }

  // Local delivery fee estimate — shown instantly when a district is selected,
  // before the user clicks "Calculate Summary".
  const localDeliveryFee = useMemo(() => {
    const d = SL_DISTRICTS.find((district) => district.name === stateValue);
    return d ? d.fee : null;
  }, [stateValue]);

  const buildPayload = (formData, { includeCustomizationAssets = true } = {}) => {
    const mappedItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      customization: {
        ...item.customization,
        shirtColor: item.customization?.shirtColor || item.color || '#FFFFFF',
        baseProductImage: item.baseProductImage || item.customization?.baseProductImage || '',
        customPreviewImage: includeCustomizationAssets
          ? item.customPreviewImage || item.customization?.customPreviewImage || ''
          : '',
        logoDecal: includeCustomizationAssets ? item.customization?.logoDecal || '' : '',
        fullDecal: includeCustomizationAssets ? item.customization?.fullDecal || '' : '',
      },
    }));

    return {
      items: mappedItems,
      promoCode: formData.promoCode?.trim().toUpperCase() || undefined,
      giftCardCode: formData.giftCardCode?.trim().toUpperCase() || undefined,
      paymentMethod: formData.paymentMethod,
      deliveryAddress: {
        fullName: formData.fullName,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,        // district name → used by deliveryService
        country: 'Sri Lanka',
        postalCode: formData.postalCode,
      },
    };
  };

  // Reset the server summary whenever any discount/delivery-affecting field changes
  useEffect(() => {
    setSummary(null);
  }, [promoCodeValue, giftCardCodeValue, paymentMethod, stateValue]);

  const handleQuote = async (formData) => {
    try {
      setLoadingQuote(true);
      const payload = buildPayload(formData, { includeCustomizationAssets: false });
      const { data } = await orderService.quote(payload);
      setSummary(data.summary);
      toast.success('Order summary calculated');
    } catch (error) {
      setSummary(null);
      toast.error(error.response?.data?.message || 'Failed to calculate summary');
    } finally {
      setLoadingQuote(false);
    }
  };

  const calculateSummary = () => {
    const currentValues = getValues();
    handleQuote(currentValues);
  };

  const onSubmit = async (formData) => {
    try {
      setPlacingOrder(true);
      const payload = buildPayload(formData, { includeCustomizationAssets: true });
      const { data } = await orderService.createOrder(payload);
      clearCart();
      toast.success('Order placed successfully');
      if (user?.role === 'customer') {
        navigate(`/dashboard/orders/${data.order?._id}`, { state: { justPlaced: true } });
      } else {
        navigate('/admin/orders');
      }
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      return null;
    } finally {
      setPlacingOrder(false);
    }
  };

  // Summary values — prefer server response, fall back to local estimates
  const summarySubtotal       = summary?.subtotal        ?? subtotal;
  const summaryDeliveryFee    = summary?.deliveryFee     ?? localDeliveryFee ?? 0;
  const summaryPromoDiscount  = summary?.promoDiscount   ?? 0;
  const summaryGiftCardAmount = summary?.giftCardAmount  ?? 0;
  const summaryTotal          = summary?.total           ?? (summarySubtotal + summaryDeliveryFee - summaryPromoDiscount - summaryGiftCardAmount);
  const isEstimate            = !summary;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr,0.9fr]">
      <section className="space-y-5">
        <SectionHeader
          eyebrow="Secure checkout"
          title="Checkout"
          description="Add delivery details, pick payment, and confirm your custom order."
        />

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* ── Shipping Details ───────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Shipping Details
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <label className="text-sm font-medium text-slate-700">
                Full Name
                <input
                  type="text"
                  {...register('fullName', { required: 'Full name is required' })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
                {errors.fullName && <span className="text-xs text-rose-600">{errors.fullName.message}</span>}
              </label>

              {/* Phone */}
              <label className="text-sm font-medium text-slate-700">
                Phone
                <input
                  type="text"
                  {...register('phone', { required: 'Phone is required' })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
                {errors.phone && <span className="text-xs text-rose-600">{errors.phone.message}</span>}
              </label>

              {/* Address Line 1 */}
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Address Line 1
                <input
                  type="text"
                  {...register('addressLine1', { required: 'Address is required' })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
                {errors.addressLine1 && <span className="text-xs text-rose-600">{errors.addressLine1.message}</span>}
              </label>

              {/* Address Line 2 */}
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Address Line 2
                <input
                  type="text"
                  {...register('addressLine2')}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </label>

              {/* City (optional) */}
              <label className="text-sm font-medium text-slate-700">
                City
                <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>
                <input
                  type="text"
                  {...register('city')}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </label>

              {/* District (searchable dropdown) */}
              <label className="text-sm font-medium text-slate-700">
                District
                {/* Hidden input registers district value with react-hook-form */}
                <input
                  type="hidden"
                  {...register('state', { required: 'Please select a district' })}
                />
                <DistrictCombobox
                  value={stateValue}
                  onChange={(val) => setValue('state', val, { shouldValidate: true })}
                  error={errors.state}
                />
                {errors.state && <span className="mt-1 block text-xs text-rose-600">{errors.state.message}</span>}
              </label>

              {/* Postal Code */}
              <label className="text-sm font-medium text-slate-700">
                Postal Code
                <input
                  type="text"
                  {...register('postalCode', { required: 'Postal code is required' })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
                {errors.postalCode && <span className="text-xs text-rose-600">{errors.postalCode.message}</span>}
              </label>

              {/* Country — locked to Sri Lanka */}
              <label className="text-sm font-medium text-slate-700">
                Country
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500">
                  <span>🇱🇰</span>
                  <span>Sri Lanka</span>
                  <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Fixed
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* ── Payments & Discounts ───────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Payments &amp; Discounts
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {/* Payment Method */}
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Payment Method
                <select
                  {...register('paymentMethod', { required: true })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Promo Code */}
              <label className="text-sm font-medium text-slate-700">
                Promo Code
                <input
                  type="text"
                  {...register('promoCode')}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </label>

              {/* Gift Card Code */}
              <label className="text-sm font-medium text-slate-700">
                Gift Card Code
                <input
                  type="text"
                  {...register('giftCardCode')}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </label>
            </div>

            {paymentMethod === 'installment' && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                Installment plan uses 3 payments. First payment is mandatory at order placement.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={calculateSummary}
                disabled={loadingQuote}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow sm:w-auto"
              >
                {loadingQuote ? 'Calculating...' : 'Calculate Summary'}
              </button>

              <button
                type="submit"
                disabled={placingOrder}
                className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow sm:w-auto"
              >
                {placingOrder ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* ── Order Summary Sidebar ─────────────────────────────────────── */}
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isEstimate
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isEstimate ? 'Estimated' : 'Confirmed'}
          </span>
        </div>

        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          {items.map((item, idx) => (
            <li
              key={`${item.productId}-${idx}`}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="mb-3">
                <TShirtPreviewPair
                  compact
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

              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-slate-800">
                  {item.productName}{' '}
                  <span className="text-xs text-slate-500">x {item.quantity}</span>
                </span>
                <span className="font-bold text-slate-900">
                  {currency(item.unitPrice * item.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
          <div className="flex justify-between text-slate-200">
            <span>Subtotal</span>
            <strong>{currency(summarySubtotal)}</strong>
          </div>

          <div className="flex justify-between text-slate-200">
            <span className="flex items-center gap-1.5">
              Delivery Fee
              {isEstimate && stateValue && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                  est.
                </span>
              )}
            </span>
            <strong>
              {stateValue || summary
                ? currency(summaryDeliveryFee)
                : <span className="text-slate-500 text-xs">Select district</span>}
            </strong>
          </div>

          {summaryPromoDiscount > 0 && (
            <div className="flex justify-between text-emerald-200">
              <span>Promo Discount</span>
              <strong>- {currency(summaryPromoDiscount)}</strong>
            </div>
          )}

          {summaryGiftCardAmount > 0 && (
            <div className="flex justify-between text-emerald-200">
              <span>Gift Card</span>
              <strong>- {currency(summaryGiftCardAmount)}</strong>
            </div>
          )}

          <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold">
            <span>Total</span>
            <span>{currency(summaryTotal)}</span>
          </div>
        </div>

        {isEstimate && (
          <p className="mt-3 text-xs text-slate-500">
            {stateValue
              ? 'Delivery fee is estimated based on your district. Click "Calculate Summary" to confirm final totals with any discounts.'
              : 'Select your district to see a delivery estimate, or click "Calculate Summary" for the confirmed total.'}
          </p>
        )}
      </aside>
    </div>
  );
};

export default CheckoutPage;
