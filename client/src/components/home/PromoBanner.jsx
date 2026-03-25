import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const promoImage =
  'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?auto=format&fit=crop&w=1000&q=80';

const PromoBanner = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-red-500 p-8 text-white shadow-xl shadow-slate-300/40 sm:p-10"
    >
      <div className="pointer-events-none absolute -left-10 top-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Custom Design Studio
          </p>
          <h2 className="text-3xl font-black leading-tight sm:text-4xl">Create Your Own Design in Minutes</h2>
          <p className="max-w-xl text-sm text-slate-100 sm:text-base">
            Upload artwork, generate AI designs, adjust colors, and preview your tee in 3D before placing the order.
          </p>
          <Link
            to="/products"
            className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.98]"
          >
            Open Customizer
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/10 p-3 backdrop-blur-sm">
          <img
            src={promoImage}
            alt="Custom t-shirt design preview"
            loading="lazy"
            className="h-64 w-full rounded-xl object-cover sm:h-72"
          />
        </div>
      </div>
    </motion.section>
  );
};

export default PromoBanner;
