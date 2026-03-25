import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { EmptyState, Loader, Pagination, SectionHeader } from '../../components';
import { complaintService } from '../../services/complaintService';
import { orderService } from '../../services/orderService';
import { useAuthStore } from '../../store/authStore';
import { shortDate } from '../../utils/format';

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CustomerComplaintsPage = () => {
  const user = useAuthStore((s) => s.user);
  const [complaints, setComplaints] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: complaintsData }, { data: ordersData }] = await Promise.all([
        complaintService.getMyComplaints({ page, limit: 6 }),
        orderService.getMyOrders({ page: 1, limit: 50 }),
      ]);
      setComplaints(complaintsData.data || []);
      setPagination(complaintsData.pagination);
      setOrders(ordersData.data || []);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const onSubmit = async (payload) => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error('Only JPG and PNG images are allowed');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Attachment must be less than 5MB');
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (payload.orderId) formData.append('orderId', payload.orderId);
      formData.append('subject', payload.subject);
      formData.append('message', payload.message);
      if (file) formData.append('attachment', file);

      await complaintService.createComplaint(formData);
      toast.success('Complaint submitted successfully');
      reset();
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (complaintId) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await complaintService.addMessage(complaintId, { message: replyText.trim() });
      toast.success('Reply sent');
      setReplyText('');
      setReplyingTo(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div>
      <SectionHeader title="My Complaints" description="Submit issues and track admin/staff responses." />

      {/* Submit Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Submit New Complaint
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Order (optional) */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Related Order <span className="text-slate-400">(optional)</span>
            </label>
            <select
              {...register('orderId')}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">None</option>
              {orders.map((order) => (
                <option key={order._id} value={order._id}>
                  #{order._id.slice(-8).toUpperCase()} — {order.status}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Subject *</label>
            <input
              type="text"
              {...register('subject', {
                required: 'Subject is required',
                minLength: { value: 3, message: 'At least 3 characters' },
                maxLength: { value: 200, message: 'Max 200 characters' },
              })}
              placeholder="Brief description of the issue"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {errors.subject && <p className="mt-1 text-xs text-rose-600">{errors.subject.message}</p>}
          </div>

          {/* Message */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Description *</label>
            <textarea
              rows={4}
              {...register('message', {
                required: 'Description is required',
                minLength: { value: 10, message: 'At least 10 characters' },
                maxLength: { value: 2000, message: 'Max 2000 characters' },
              })}
              placeholder="Describe your issue in detail..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message.message}</p>}
          </div>

          {/* Attachment */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Attachment <span className="text-slate-400">(optional — JPG/PNG, max 5MB)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>

      {/* List */}
      {loading ? <Loader label="Loading complaints..." /> : null}

      {!loading && complaints.length === 0 ? (
        <EmptyState title="No complaints" description="Raise a complaint if you face any service issues." />
      ) : null}

      <div className="space-y-4">
        {complaints.map((complaint) => (
          <article key={complaint._id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === complaint._id ? null : complaint._id)}
              className="flex w-full items-start justify-between p-4 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{complaint.subject}</p>
                <p className="text-xs text-slate-500">
                  {complaint.complaintId && (
                    <span className="font-mono font-medium text-slate-600">{complaint.complaintId}</span>
                  )}{' '}
                  · {shortDate(complaint.createdAt)}
                </p>
                {complaint.order && (
                  <p className="text-xs text-slate-400">
                    Order #{String(complaint.order._id || complaint.order).slice(-8).toUpperCase()}
                  </p>
                )}
              </div>
              <StatusBadge status={complaint.status} />
            </button>

            {/* Expanded */}
            {expandedId === complaint._id && (
              <div className="border-t border-slate-100 px-4 pb-4">
                {/* Attachment */}
                {complaint.attachmentUrl && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-semibold text-slate-500">Attachment</p>
                    <a href={complaint.attachmentUrl} target="_blank" rel="noreferrer">
                      <img
                        src={complaint.attachmentUrl}
                        alt="Attachment"
                        className="h-28 w-auto rounded-lg border border-slate-200 object-cover hover:opacity-80"
                      />
                    </a>
                  </div>
                )}

                {/* Message Thread */}
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">Conversation</p>
                  <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                    {complaint.messages && complaint.messages.length > 0 ? (
                      complaint.messages.map((msg) => {
                        const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
                        const isAdmin = msg.senderRole === 'admin' || msg.senderRole === 'staff';
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                isMe
                                  ? 'bg-slate-900 text-white'
                                  : isAdmin
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-white text-slate-800 shadow-sm'
                              }`}
                            >
                              <p className="mb-0.5 text-[10px] font-semibold opacity-70">
                                {isMe ? 'You' : msg.senderName || (isAdmin ? 'Support Team' : 'Customer')}
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
                  <div className="mt-3">
                    {replyingTo === complaint._id ? (
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your follow-up message..."
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleSendReply(complaint._id)}
                            disabled={sendingReply || !replyText.trim()}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                          >
                            {sendingReply ? '...' : 'Send'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReplyingTo(complaint._id)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                      >
                        Add follow-up message
                      </button>
                    )}
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

export default CustomerComplaintsPage;
