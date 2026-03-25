import { motion } from 'framer-motion';

import SectionHeader from '../common/SectionHeader';

const items = [
  {
    icon: '🖨️',
    title: 'High Quality Printing',
    text: 'Vibrant, durable prints with premium inks and advanced print calibration.',
  },
  {
    icon: '🚚',
    title: 'Fast Delivery',
    text: 'Streamlined production and logistics for reliable, on-time shipping.',
  },
  {
    icon: '↩️',
    title: 'Easy Returns',
    text: 'Simple return workflows with quick review and transparent refund tracking.',
  },
  {
    icon: '🔒',
    title: 'Secure Payments',
    text: 'Safe checkout options including installment support and gift card payments.',
  },
];

const WhyChooseUs = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <SectionHeader
        title="Why Choose Us"
        description="Everything you need to launch custom t-shirts with confidence."
        eyebrow="Benefits"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.title}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-900 hover:bg-white hover:shadow-lg"
          >
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm transition group-hover:bg-slate-900 group-hover:text-white">
              {item.icon}
            </span>
            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
          </article>
        ))}
      </div>
    </motion.section>
  );
};

export default WhyChooseUs;
