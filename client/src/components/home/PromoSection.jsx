import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import SectionHeader from '../common/SectionHeader';
import { promoService } from '../../services/promoService';

const formatDiscount = (promo) => {
  if (!promo) return 'Offer';
  if (promo.discountType === 'percent') return `${promo.discountValue}% OFF`;
  return `$${promo.discountValue} OFF`;
};

const formatExpiry = (expiresAt) => {
  if (!expiresAt) return 'No expiry';
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return 'No expiry';
  return `Expires ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const PromoSection = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPromos = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await promoService.getPromos({ page: 1, limit: 6, active: true });
      setPromos(data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load promotions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <SectionHeader
        title="Promotional Offers"
        description="Apply active coupon codes at checkout and save more on every order."
        eyebrow="Offers"
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-2xl border border-slate-200 p-5">
              <div className="h-6 w-24 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-full rounded bg-slate-200" />
              <div className="mt-5 h-9 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchPromos}
            className="mt-3 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      ) : null}

      {!loading && !error && promos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No active promo codes at the moment.
        </div>
      ) : null}

      {!loading && !error && promos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {promos.map((promo) => (
            <article
              key={promo._id}
              className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-red-50 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="inline-flex rounded-full bg-red-500 px-3 py-1 text-xs font-bold tracking-wide text-white">
                {formatDiscount(promo)}
              </span>
              <h3 className="mt-3 text-lg font-extrabold text-slate-900">{promo.code}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                {promo.description || promo.promotionalAlert || 'Limited-time discount on selected custom t-shirts.'}
              </p>
              <p className="mt-4 text-xs font-medium text-slate-500">{formatExpiry(promo.expiresAt)}</p>
            </article>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
};

export default PromoSection;
