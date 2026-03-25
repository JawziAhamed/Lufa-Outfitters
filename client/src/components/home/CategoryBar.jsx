import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const items = [
  { label: 'New Arrivals', icon: '🆕', to: '/products?sort=new' },
  { label: 'Best Sellers', icon: '🔥', to: '/products?sort=popular' },
  { label: 'Custom Design', icon: '🎨', to: '/products' },
  { label: 'Bulk Orders', icon: '📦', to: '/products?bulk=true' },
  { label: 'Discounts', icon: '🏷️', to: '/products?discount=true' },
];

const CategoryBar = () => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex gap-3 overflow-x-auto py-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="min-w-[150px] flex-1"
          >
            <Link
              to={item.to}
              className="group flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-900 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900/40 focus:ring-offset-2 focus:ring-offset-white"
            >
              
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm transition group-hover:bg-slate-900 group-hover:text-white">
                {item.icon}
              </span>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategoryBar;
