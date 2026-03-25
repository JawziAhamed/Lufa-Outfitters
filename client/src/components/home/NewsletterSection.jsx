import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValidEmail = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!isValidEmail) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      toast.success('Subscribed successfully. Exclusive deals are on the way.');
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10"
    >
      <p className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500">
        Newsletter
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Get Exclusive T-Shirt Deals</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
        Subscribe for new drops, limited discounts, and special bulk pricing announcements.
      </p>

      <form onSubmit={onSubmit} className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email address"
          aria-label="Email address"
          className="h-12 flex-1 rounded-xl border border-slate-300 px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
        >
          {submitting ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
    </motion.section>
  );
};

export default NewsletterSection;
