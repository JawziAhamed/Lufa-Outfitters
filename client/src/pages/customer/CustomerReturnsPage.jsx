import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { EmptyState, Loader, Pagination, SectionHeader } from '../../components';
import { orderService } from '../../services/orderService';
import { returnService } from '../../services/returnService';
import { currency, shortDate } from '../../utils/format';
import { resolveProductImageUrl } from '../../utils/image';

const REASON_OPTIONS = [
  { value: 'damaged_product', label: 'Damaged Product', requiresImage: true },
  { value: 'wrong_item', label: 'Wrong Item Received', requiresImage: true },
  { value: 'not_satisfied', label: 'Not Satisfied', requiresImage: false },
  { value: 'other', label: 'Other', requiresImage: false },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  picked_up: { label: 'Picked Up', color: 'bg-blue-100 text-blue-800' },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800' },
};

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Request Submitted' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'picked_up', label: 'Pickup Initiated' },
  { key: 'refunded', label: 'Refund Processed' },
];

const getTimelineStep = (status) => {
  if (status === 'pending') return 0;
  if (status === 'approved' || status === 'rejected') return 1;
  if (status === 'picked_up') return 2;
  if (status === 'refunded') return 3;
  return 0;
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const Timeline = ({ status }) => {
  const activeStep = getTimelineStep(status);
  const isRejected = status === 'rejected';

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Return Progress</p>
      <div className="flex items-center gap-0">
        {TIMELINE_STEPS.map((step, index) => {
          const isActive = index <= activeStep && !isRejected;
          const isCurrent = index === activeStep && !isRejected;
          const isLast = index === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    isRejected && index === 1
                      ? 'border-red-500 bg-red-500 text-white'
                      : isActive
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isRejected && index === 1 ? '✕' : isActive ? '✓' : index + 1}
                </div>
                <p
                  className={`mt-1 w-16 text-center text-[10px] leading-tight ${
                    isCurrent ? 'font-semibold text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {isRejected && index === 1 ? 'Rejected' : step.label}
                </p>
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    isActive && index < activeStep ? 'bg-slate-900' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CustomerReturnsPage = () => {
  const [returnsList, setReturnsList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { reasonType: '' } });

  const watchedReasonType = watch('reasonType');
  const selectedReason = REASON_OPTIONS.find((r) => r.value === watchedReasonType);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: returnsData }, { data: ordersData }] = await Promise.all([
        returnService.getMyReturns({ page, limit: 6 }),
        orderService.getMyOrders({ page: 1, limit: 50 }),
      ]);
      setReturnsList(returnsData.data || []);
      setPagination(returnsData.pagination);
      setOrders(ordersData.data || []);
    } catch {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPG and PNG images are allowed');
      e.target.value = '';
      setImagePreview(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be less than 5MB');
      e.target.value = '';
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (payload) => {
    if (selectedReason?.requiresImage && !fileInputRef.current?.files?.[0]) {
      toast.error('Image proof is required for this return reason');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', payload.orderId);
      formData.append('reasonType', payload.reasonType);
      if (payload.reason) formData.append('reason', payload.reason);
      if (payload.description) formData.append('description', payload.description);
      if (fileInputRef.current?.files?.[0]) {
        formData.append('damagedImage', fileInputRef.current.files[0]);
      }

      await returnService.createReturn(formData);
      toast.success('Return request submitted successfully');
      reset();
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="My Returns"
        description="Submit return requests and track their progress."
      />

      {/* Submit Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Submit Return Request
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Order Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Order *</label>
            <select
              {...register('orderId', { required: 'Please select an order' })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">Select an order...</option>
              {orders.map((order) => (
                <option key={order._id} value={order._id}>
                  #{order._id.slice(-8).toUpperCase()} — {currency(order.total)} ({order.status})
                </option>
              ))}
            </select>
            {errors.orderId && <p className="mt-1 text-xs text-rose-600">{errors.orderId.message}</p>}
          </div>

          {/* Reason Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Reason *</label>
            <select
              {...register('reasonType', { required: 'Please select a reason' })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">Select reason...</option>
              {REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.reasonType && (
              <p className="mt-1 text-xs text-rose-600">{errors.reasonType.message}</p>
            )}
          </div>

          {/* Custom Reason (for "Other") */}
          {watchedReasonType === 'other' && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Please describe your reason *</label>
              <input
                type="text"
                {...register('reason', {
                  required: 'Please describe your reason',
                  minLength: { value: 10, message: 'Must be at least 10 characters' },
                })}
                placeholder="Describe why you want to return this item..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              {errors.reason && <p className="mt-1 text-xs text-rose-600">{errors.reason.message}</p>}
            </div>
          )}

          {/* Image Upload */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Image Proof{' '}
              {selectedReason?.requiresImage ? (
                <span className="text-rose-600">* (required)</span>
              ) : (
                <span className="text-slate-400">(optional)</span>
              )}
            </label>
            <p className="mb-1 text-xs text-slate-500">Accepted: JPG, PNG — Max 5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-auto rounded-lg border border-slate-200 object-cover"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Additional Comments <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Any additional details about the issue..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Return Request'}
        </button>
      </form>

      {/* List */}
      {loading ? <Loader label="Loading returns..." /> : null}

      {!loading && returnsList.length === 0 ? (
        <EmptyState title="No return requests" description="You haven't submitted any return requests yet." />
      ) : null}

      <div className="space-y-4">
        {returnsList.map((item) => (
          <article key={item._id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
              className="flex w-full items-start justify-between p-4 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Return #{item._id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-slate-500">Submitted {shortDate(item.createdAt)}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Reason:{' '}
                  <span className="font-medium">
                    {REASON_OPTIONS.find((r) => r.value === item.reasonType)?.label ||
                      item.reasonType ||
                      item.reason}
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={item.status} />
                <p className="text-xs text-slate-500">Refund: {currency(item.refundAmount)}</p>
              </div>
            </button>

            {/* Expanded Content */}
            {expandedId === item._id && (
              <div className="border-t border-slate-100 px-4 pb-4">
                {/* Timeline */}
                <Timeline status={item.status} />

                {/* Details */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {item.reason && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Reason Details</p>
                      <p className="text-sm text-slate-700">{item.reason}</p>
                    </div>
                  )}
                  {item.description && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Additional Comments</p>
                      <p className="text-sm text-slate-700">{item.description}</p>
                    </div>
                  )}
                  {item.refundMethod && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Refund Method</p>
                      <p className="text-sm capitalize text-slate-700">
                        {item.refundMethod.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                  {item.refundTransactionRef && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Transaction Ref</p>
                      <p className="font-mono text-sm text-slate-700">{item.refundTransactionRef}</p>
                    </div>
                  )}
                </div>

                {/* Image Proof */}
                {item.damagedImageUrl && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-semibold text-slate-500">Image Proof</p>
                    <a href={resolveProductImageUrl(item.damagedImageUrl)} target="_blank" rel="noreferrer">
                      <img
                        src={resolveProductImageUrl(item.damagedImageUrl)}
                        alt="Damaged product"
                        className="h-28 w-auto rounded-lg border border-slate-200 object-cover hover:opacity-80"
                      />
                    </a>
                  </div>
                )}

                {/* Admin Response */}
                {item.adminResponse && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-700">Admin Response</p>
                    <p className="mt-0.5 text-sm text-blue-900">{item.adminResponse}</p>
                  </div>
                )}

                {/* Returned Items */}
                {item.items && item.items.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-semibold text-slate-500">Items to Return</p>
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                      {item.items.map((ri, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2">
                          <p className="text-sm text-slate-700">{ri.productName}</p>
                          <p className="text-xs text-slate-500">
                            Qty: {ri.quantity}
                            {ri.size ? ` | ${ri.size}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status History */}
                {item.statusHistory && item.statusHistory.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-semibold text-slate-500">Status History</p>
                    <div className="space-y-1">
                      {item.statusHistory.map((hist, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span className="capitalize">{hist.status.replace(/_/g, ' ')}</span>
                          {hist.note && <span>— {hist.note}</span>}
                          <span className="ml-auto">{shortDate(hist.changedAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
};

export default CustomerReturnsPage;
