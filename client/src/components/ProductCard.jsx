import { Link } from 'react-router-dom';

import { currency } from '../utils/format';
import { resolveProductImageUrl } from '../utils/image';

const NO_IMAGE_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='28'%3ENo Image%3C/text%3E%3C/svg%3E";

const getImageUrl = (product) => {
  const resolvedImageUrl = resolveProductImageUrl(product?.imageUrl);
  if (resolvedImageUrl) return resolvedImageUrl;

  return NO_IMAGE_DATA_URL;
};

const ProductCard = ({ product, showDescription = true, showRating = true, ctaLabel = 'View' }) => {
  const rating = Number(product?.rating || 4.6);
  const roundedRating = Math.round(rating);
  const src = getImageUrl(product);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative aspect-[4/4] w-full overflow-hidden bg-slate-100">
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = NO_IMAGE_DATA_URL;
          }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-60" />
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-1 text-base font-bold text-slate-900">{product.name}</h3>

        {showDescription ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">{product.description}</p>
        ) : null}

        {showRating ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-sm ${star <= roundedRating ? 'text-amber-400' : 'text-slate-300'}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500">{rating.toFixed(1)}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-slate-900">{currency(product.basePrice)}</span>
          <Link
            to={`/products/${product._id}`}
            aria-label={`View ${product.name}`}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
