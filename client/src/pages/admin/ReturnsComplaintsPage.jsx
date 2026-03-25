import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Loader, Pagination, SectionHeader } from '../../components';
import { complaintService } from '../../services/complaintService';
import { returnService } from '../../services/returnService';
import { useAuthStore } from '../../store/authStore';
import { currency, shortDate } from '../../utils/format';
import { resolveProductImageUrl } from '../../utils/image';

// ─── Shared Helpers ────────────────────────────────────────────────────────────

const RETURN_STATUSES = ['pending', 'approved', 'rejected', 'picked_up', 'refunded'];
const COMPLAINT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const REFUND_METHODS = ['wallet', 'manual_cash', 'bank_transfer'];

const REASON_LABELS = {
  damaged_product: 'Damaged Product',
  wrong_item: 'Wrong Item Received',
  not_satisfied: 'Not Satisfied',
  other: 'Other',
};

const RETURN_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  picked_up: 'bg-blue-100 text-blue-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const COMPLAINT_STATUS_COLORS = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-600',
};

const StatusBadge = ({ status, colorMap }) => {
  const color = colorMap[status] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Return Request Detail Panel ───────────────────────────────────────────────

const ReturnDetailPanel = ({ item, onUpdated }) => {
  const [status, setStatus] = useState(item.status);
  const [adminResponse, setAdminResponse] = useState(item.adminResponse || '');
  const [internalNotes, setInternalNotes] = useState(item.internalNotes || '');
  const [refundAmount, setRefundAmount] = useState(item.refundAmount || 0);
  const [refundMethod, setRefundMethod] = useState(item.refundMethod || 'wallet');
  const [refundTransactionRef, setRefundTransactionRef] = useState(item.refundTransactionRef || '');
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await returnService.updateReturn(item._id, {
        status,
        adminResponse,
        internalNotes,
        refundAmount: Number(refundAmount),
        refundMethod,
        refundTransactionRef,
      });
      toast.success('Return request updated');
      onUpdated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Full size" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Customer & Order Info */}
        <div className="space-y-1 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Customer</p>
          <p className="font-medium text-slate-900">{item.user?.name || 'N/A'}</p>
          <p className="text-slate-500">{item.user?.email}</p>
          <p className="text-xs text-slate-400">
            Order #{item.order?._id ? String(item.order._id).slice(-8).toUpperCase() : 'N/A'}
          </p>
          <p className="text-xs text-slate-400">
            Reason: <span className="font-medium">{REASON_LABELS[item.reasonType] || item.reasonType}</span>
          </p>
          {item.reason && <p className="text-xs text-slate-500">Note: {item.reason}</p>}
          {item.description && <p className="text-xs text-slate-500">Desc: {item.description}</p>}
        </div>

        {/* Image Proof */}
        {item.damagedImageUrl && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Image Proof</p>
            <button type="button" onClick={() => setLightbox(resolveProductImageUrl(item.damagedImageUrl))}>
              <img
                src={resolveProductImageUrl(item.damagedImageUrl)}
                alt="Proof"
                className="h-28 w-auto rounded-lg border border-slate-200 object-cover hover:opacity-80"
              />
            </button>
            <p className="mt-1 text-[10px] text-slate-400">Click to enlarge</p>
          </div>
        )}

        {/* Items to Return */}
        {item.items && item.items.length > 0 && (
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Items</p>
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
              {item.items.map((ri, i) => (
                <div key={i} className="flex justify-between px-3 py-1.5">
                  <span>{ri.productName}</span>
                  <span className="text-slate-500">×{ri.quantity}{ri.size ? ` | ${ri.size}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Update */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {RETURN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Refund Method */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500">Refund Method</label>
          <select
            value={refundMethod}
            onChange={(e) => setRefundMethod(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {REFUND_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Refund Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Refund Amount ({currency(0).slice(0, 1)})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Transaction Ref */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500">Transaction Ref</label>
          <input
            type="text"
            value={refundTransactionRef}
            onChange={(e) => setRefundTransactionRef(e.target.value)}
            placeholder="e.g. TXN-12345"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Admin Response (visible to customer) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Response to Customer
          </label>
          <textarea
            rows={2}
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            placeholder="Message visible to the customer..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Internal Notes */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Internal Notes <span className="normal-case text-slate-400">(not visible to customer)</span>
          </label>
          <textarea
            rows={2}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Private notes for staff..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* Status History */}
      {item.statusHistory && item.statusHistory.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Status History</p>
          <div className="space-y-1">
            {item.statusHistory.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="capitalize font-medium">{h.status.replace(/_/g, ' ')}</span>
                {h.note ? <span>— {h.note}</span> : null}
                <span className="ml-auto">{shortDate(h.changedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Complaint Detail Panel ────────────────────────────────────────────────────

const ComplaintDetailPanel = ({ complaint, onUpdated }) => {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState(complaint.status);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await complaintService.addMessage(complaint._id, { message: replyText.trim() });
      toast.success('Reply sent');
      setReplyText('');
      onUpdated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await complaintService.updateComplaint(complaint._id, { status });
      toast.success('Status updated');
      onUpdated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Info */}
        <div className="text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Customer</p>
          <p className="font-medium">{complaint.user?.name}</p>
          <p className="text-slate-500">{complaint.user?.email}</p>
          {complaint.order && (
            <p className="text-xs text-slate-400">
              Order #{String(complaint.order._id || complaint.order).slice(-8).toUpperCase()}
            </p>
          )}
        </div>

        {/* Attachment */}
        {complaint.attachmentUrl && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Attachment</p>
            <a href={complaint.attachmentUrl} target="_blank" rel="noreferrer">
              <img
                src={complaint.attachmentUrl}
                alt="Attachment"
                className="h-24 w-auto rounded-lg border border-slate-200 object-cover hover:opacity-80"
              />
            </a>
          </div>
        )}

        {/* Status */}
        <div className="sm:col-span-2 flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase text-slate-500">Update Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
            >
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleStatusUpdate}
            disabled={saving}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? '...' : 'Update'}
          </button>
        </div>
      </div>

      {/* Thread */}
      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Conversation</p>
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
          {complaint.messages && complaint.messages.length > 0 ? (
            complaint.messages.map((msg) => {
              const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'staff';
              return (
                <div key={msg._id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      isStaff ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 shadow-sm'
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] font-semibold opacity-70">
                      {isStaff ? (msg.senderName || 'Support Team') : (msg.senderName || 'Customer')}
                    </p>
                    <p>{msg.message}</p>
                    <p className="mt-0.5 text-[10px] opacity-60">{shortDate(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400">No messages yet.</p>
          )}
        </div>
      </div>

      {/* Reply Box */}
      {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
        <div className="mt-3 flex gap-2">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply to the customer..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="button"
            onClick={handleSendReply}
            disabled={sending || !replyText.trim()}
            className="self-end rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ReturnsComplaintsPage = () => {
  const [activeTab, setActiveTab] = useState('returns');
  const [returnsList, setReturnsList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Returns filters
  const [returnStatus, setReturnStatus] = useState('');
  const [returnSearch, setReturnSearch] = useState('');
  const [returnFrom, setReturnFrom] = useState('');
  const [returnTo, setReturnTo] = useState('');
  const [returnPage, setReturnPage] = useState(1);
  const [returnPagination, setReturnPagination] = useState(null);

  // Complaints filters
  const [complaintStatus, setComplaintStatus] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintFrom, setComplaintFrom] = useState('');
  const [complaintTo, setComplaintTo] = useState('');
  const [complaintPage, setComplaintPage] = useState(1);
  const [complaintPagination, setComplaintPagination] = useState(null);

  const fetchReturns = async () => {
    setReturnsLoading(true);
    try {
      const { data } = await returnService.getReturns({
        page: returnPage,
        limit: 10,
        status: returnStatus || undefined,
        search: returnSearch || undefined,
        from: returnFrom || undefined,
        to: returnTo || undefined,
      });
      setReturnsList(data.data || []);
      setReturnPagination(data.pagination);
    } catch {
      toast.error('Failed to load returns');
    } finally {
      setReturnsLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setComplaintsLoading(true);
    try {
      const { data } = await complaintService.getComplaints({
        page: complaintPage,
        limit: 10,
        status: complaintStatus || undefined,
        search: complaintSearch || undefined,
        from: complaintFrom || undefined,
        to: complaintTo || undefined,
      });
      setComplaints(data.data || []);
      setComplaintPagination(data.pagination);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [returnPage, returnStatus, returnFrom, returnTo]);

  useEffect(() => {
    fetchComplaints();
  }, [complaintPage, complaintStatus, complaintFrom, complaintTo]);

  const handleReturnSearch = (e) => {
    e.preventDefault();
    setReturnPage(1);
    fetchReturns();
  };

  const handleComplaintSearch = (e) => {
    e.preventDefault();
    setComplaintPage(1);
    fetchComplaints();
  };

  return (
    <div>
      <SectionHeader
        title="Returns & Complaints"
        description="Manage return requests and customer complaint tickets."
      />

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {[
          { key: 'returns', label: 'Return Requests' },
          { key: 'complaints', label: 'Complaints' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Returns Tab ─────────────────────────────── */}
      {activeTab === 'returns' && (
        <div>
          {/* Filters */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
            <form onSubmit={handleReturnSearch} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={returnSearch}
                onChange={(e) => setReturnSearch(e.target.value)}
                placeholder="Search customer name, email..."
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 min-w-[180px] flex-1"
              />
              <select
                value={returnStatus}
                onChange={(e) => { setReturnStatus(e.target.value); setReturnPage(1); }}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
              >
                <option value="">All Statuses</option>
                {RETURN_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <input
                type="date"
                value={returnFrom}
                onChange={(e) => { setReturnFrom(e.target.value); setReturnPage(1); }}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
              />
              <input
                type="date"
                value={returnTo}
                onChange={(e) => { setReturnTo(e.target.value); setReturnPage(1); }}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setReturnSearch(''); setReturnStatus(''); setReturnFrom(''); setReturnTo('');
                  setReturnPage(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            </form>
          </div>

          {returnsLoading ? (
            <Loader label="Loading returns..." />
          ) : returnsList.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No return requests found.
            </p>
          ) : (
            <div className="space-y-3">
              {returnsList.map((item) => (
                <article key={item._id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                    className="flex w-full items-start justify-between p-4 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        #{item._id.slice(-8).toUpperCase()} —{' '}
                        <span className="font-normal">{item.user?.name}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {REASON_LABELS[item.reasonType] || item.reasonType} · {shortDate(item.createdAt)}
                      </p>
                      <p className="text-xs text-slate-500">Refund: {currency(item.refundAmount)}</p>
                    </div>
                    <StatusBadge status={item.status} colorMap={RETURN_STATUS_COLORS} />
                  </button>

                  {expandedId === item._id && (
                    <div className="px-4 pb-4">
                      <ReturnDetailPanel item={item} onUpdated={fetchReturns} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {returnPagination && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <p>{returnPagination.total} total requests</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={returnPage <= 1}
                  onClick={() => setReturnPage((p) => p - 1)}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
                >
                  Prev
                </button>
                <span className="px-2 py-1">
                  {returnPage} / {Math.ceil(returnPagination.total / returnPagination.limit) || 1}
                </span>
                <button
                  type="button"
                  disabled={returnPage >= Math.ceil(returnPagination.total / returnPagination.limit)}
                  onClick={() => setReturnPage((p) => p + 1)}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Complaints Tab ───────────────────────────── */}
      {activeTab === 'complaints' && (
        <div>
          {/* Filters */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
            <form onSubmit={handleComplaintSearch} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                placeholder="Search by name, email, subject, ID..."
                className="min-w-[180px] flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <select
                value={complaintStatus}
                onChange={(e) => { setComplaintStatus(e.target.value); setComplaintPage(1); }}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
              >
                <option value="">All Statuses</option>
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <input
                type="date"
                value={complaintFrom}
                onChange={(e) => { setComplaintFrom(e.target.value); setComplaintPage(1); }}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
              />
              <input
                type="date"
                value={complaintTo}
                onChange={(e) => { setComplaintTo(e.target.value); setComplaintPage(1); }}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setComplaintSearch(''); setComplaintStatus(''); setComplaintFrom(''); setComplaintTo('');
                  setComplaintPage(1);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            </form>
          </div>

          {complaintsLoading ? (
            <Loader label="Loading complaints..." />
          ) : complaints.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No complaints found.
            </p>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <article key={complaint._id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === complaint._id ? null : complaint._id)}
                    className="flex w-full items-start justify-between p-4 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{complaint.subject}</p>
                      <p className="text-xs text-slate-500">
                        {complaint.complaintId && (
                          <span className="font-mono">{complaint.complaintId} · </span>
                        )}
                        {complaint.user?.name} · {shortDate(complaint.createdAt)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {complaint.messages?.length || 0} message
                        {complaint.messages?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <StatusBadge status={complaint.status} colorMap={COMPLAINT_STATUS_COLORS} />
                  </button>

                  {expandedId === complaint._id && (
                    <div className="px-4 pb-4">
                      <ComplaintDetailPanel complaint={complaint} onUpdated={fetchComplaints} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {complaintPagination && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <p>{complaintPagination.total} total complaints</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={complaintPage <= 1}
                  onClick={() => setComplaintPage((p) => p - 1)}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
                >
                  Prev
                </button>
                <span className="px-2 py-1">
                  {complaintPage} / {Math.ceil(complaintPagination.total / complaintPagination.limit) || 1}
                </span>
                <button
                  type="button"
                  disabled={complaintPage >= Math.ceil(complaintPagination.total / complaintPagination.limit)}
                  onClick={() => setComplaintPage((p) => p + 1)}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReturnsComplaintsPage;
