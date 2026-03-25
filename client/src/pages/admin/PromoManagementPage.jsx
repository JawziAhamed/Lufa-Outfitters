import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Loader, SectionHeader } from '../../components';
import { promoService } from '../../services/promoService';
import { shortDate } from '../../utils/format';

const PromoManagementPage = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: '',
      description: '',
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 100,
      promotionalAlert: '',
      isActive: true,
      newCustomersOnly: false,
    },
  });

  const {
    register: registerBroadcast,
    handleSubmit: handleBroadcastSubmit,
    reset: resetBroadcast,
  } = useForm({
    defaultValues: { message: '' },
  });

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const { data } = await promoService.getPromos({ page: 1, limit: 50 });
      setPromos(data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch promos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const onSubmit = async (payload) => {
    try {
      await promoService.createPromo(payload);
      toast.success('Promo created');
      reset();
      fetchPromos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create promo');
    }
  };

  const handleToggle = async (promo) => {
    try {
      await promoService.updatePromo(promo._id, { isActive: !promo.isActive });
      toast.success('Promo status updated');
      fetchPromos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update promo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete promo code?')) return;

    try {
      await promoService.deletePromo(id);
      toast.success('Promo deleted');
      fetchPromos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete promo');
    }
  };

  const onBroadcast = async (payload) => {
    try {
      const { data } = await promoService.broadcastPromo(payload);
      toast.success(`Broadcast sent to ${data.recipients} recipients`);
      resetBroadcast();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
    }
  };

  return (
    <div>
      <SectionHeader title="Promo Management" description="Create promo codes, manage activation, and send promotional alerts." />

      <form onSubmit={handleSubmit(onSubmit)} className="mb-6 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Create Promo Code</h3>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            {...register('code', { required: true })}
            placeholder="Code"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            {...register('description')}
            placeholder="Description"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <select {...register('discountType')} className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
          <input
            type="number"
            step="0.01"
            {...register('discountValue', { required: true })}
            placeholder="Discount value"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="0.01"
            {...register('minOrderValue')}
            placeholder="Min order value"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            step="0.01"
            {...register('maxDiscount')}
            placeholder="Max discount"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            {...register('usageLimit')}
            placeholder="Usage limit"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('isActive')} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('newCustomersOnly')} />
            New customers only
          </label>
          <textarea
            {...register('promotionalAlert')}
            placeholder="Promotional alert text"
            className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            rows={2}
          />
        </div>

        {errors.code ? <p className="mt-2 text-xs text-rose-600">Code is required.</p> : null}

        <button type="submit" className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Create Promo
        </button>
      </form>

      <form onSubmit={handleBroadcastSubmit(onBroadcast)} className="mb-6 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Send Promotional Alert</h3>
        <textarea
          {...registerBroadcast('message', { required: true })}
          rows={2}
          placeholder="Promotional message"
          className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="mt-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
          Broadcast Alert
        </button>
      </form>

      {loading ? <Loader label="Loading promos" /> : null}

      {!loading ? (
        <div className="space-y-3">
          {promos.map((promo) => (
            <article key={promo._id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{promo.code}</p>
                  <p className="text-xs text-slate-500">{promo.description}</p>
                  {promo.newCustomersOnly ? (
                    <p className="text-xs font-semibold text-indigo-600">Eligible only for first-time customers</p>
                  ) : null}
                  <p className="text-xs text-slate-500">Created {shortDate(promo.createdAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(promo)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {promo.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(promo._id)}
                    className="rounded border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default PromoManagementPage;
