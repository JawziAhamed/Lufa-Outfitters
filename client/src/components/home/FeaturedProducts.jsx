import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import ProductCard from '../ProductCard';
import SectionHeader from '../common/SectionHeader';
import { productService } from '../../services/productService';

/* ── Card width + gap must match the CSS animation distance exactly ── */
const CARD_W = 272; // px  (w-68 equivalent)
const CARD_GAP = 20; // px  (gap-5)

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paused, setPaused] = useState(false);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await productService.getProducts({ page: 1, limit: 8 });
      setProducts(data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load featured products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Duplicate list so the strip is always 2× wide → seamless loop when we
  // translate -50% (exactly one full copy width).
  const carousel = [...products, ...products];

  // Speed: ~3 s per card feels comfortable and not rushed.
  const duration = `${products.length * 3}s`;

  // Total width of ONE copy of the strip (cards + gaps).
  const stripWidth = products.length * (CARD_W + CARD_GAP);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {/* Keyframes injected once alongside this component */}
      <style>{`
        @keyframes featured-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${stripWidth}px); }
        }
      `}</style>

      <SectionHeader
        title="Featured This Week"
        description="Trending custom t-shirts selected for quality, style, and customer love."
        eyebrow="Featured"
        action={
          <Link
            to="/products"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            View All
          </Link>
        }
      />

      {/* ── Loading skeleton row ── */}
      {loading ? (
        <div className="mt-6 flex gap-5 overflow-hidden">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="w-[272px] flex-shrink-0 animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="aspect-square bg-slate-200" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-200" />
                <div className="h-3 w-3/4 rounded bg-slate-200" />
                <div className="h-8 w-full rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Error state ── */}
      {!loading && error ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchFeaturedProducts}
            className="mt-3 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      ) : null}

      {/* ── Empty state ── */}
      {!loading && !error && products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No featured products are available right now.
        </div>
      ) : null}

      {/* ── Carousel ── */}
      {!loading && !error && products.length > 0 ? (
        <div
          className="relative mt-6 overflow-hidden"
          /* Fade edges for a polished look */
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex"
            style={{
              gap: `${CARD_GAP}px`,
              /* Two full copies side-by-side */
              width: `${stripWidth * 2}px`,
              animation: `featured-scroll ${duration} linear infinite`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          >
            {carousel.map((product, idx) => (
              <div
                key={`${product._id}-${idx}`}
                style={{ width: `${CARD_W}px`, flexShrink: 0 }}
                className="transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl"
              >
                <ProductCard product={product} ctaLabel="View" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </motion.section>
  );
};

export default FeaturedProducts;
