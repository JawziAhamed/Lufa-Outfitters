import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const heroImage =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-10 lg:p-12">
      <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-red-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-72 w-72 rounded-full bg-slate-100 blur-3xl" />

      <div className="relative grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Premium Custom T-Shirt Platform
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Design Your Perfect Custom T-Shirt
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Launch your style with studio-grade 3D customization, AI-assisted artwork, fast fulfillment, and
            quality prints that stand out.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
            >
              Start Designing
            </Link>
            <Link
              to="/products"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 active:scale-[0.98]"
            >
              Browse Products
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { value: '50K+', label: 'Designs Printed' },
              { value: '24h', label: 'Quick Support' },
              { value: '4.9/5', label: 'Customer Rating' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-lg font-extrabold text-slate-900">{item.value}</p>
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-red-500 opacity-90" />
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative p-6 sm:p-8"
          >
            <div className="overflow-hidden rounded-3xl border border-white/30 bg-white/10 backdrop-blur-sm">
              <img
                src={heroImage}
                alt="Custom printed t-shirt mockup"
                loading="lazy"
                className="h-[280px] w-full object-cover sm:h-[360px] lg:h-[420px]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
