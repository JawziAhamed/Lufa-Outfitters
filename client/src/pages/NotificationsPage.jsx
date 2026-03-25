import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { EmptyState, Loader, Pagination, SectionHeader } from '../components';
import { notificationService } from '../services/notificationService';
import { relativeTime, shortDate } from '../utils/format';

const tabOptions = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'order', label: 'Orders' },
  { value: 'return', label: 'Returns' },
  { value: 'refund', label: 'Refunds' },
  { value: 'promotion', label: 'Promotions' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'system', label: 'System' },
];

const iconByType = {
  order: 'OR',
  payment: 'PM',
  promotion: 'PR',
  inventory: 'IN',
  return: 'RT',
  refund: 'RF',
  system: 'SY',
};

const badgeByType = {
  order: 'bg-blue-50 text-blue-700',
  payment: 'bg-cyan-50 text-cyan-700',
  promotion: 'bg-violet-50 text-violet-700',
  inventory: 'bg-amber-50 text-amber-700',
  return: 'bg-orange-50 text-orange-700',
  refund: 'bg-emerald-50 text-emerald-700',
  system: 'bg-slate-100 text-slate-700',
};

const toTypeLabel = (type = '') =>
  String(type)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    tab: 'all',
    type: 'all',
  });
  const [busyNotificationId, setBusyNotificationId] = useState('');
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [clearAllLoading, setClearAllLoading] = useState(false);

  const requestParams = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      tab: filters.tab,
      type: filters.type === 'all' ? undefined : filters.type,
    }),
    [filters]
  );

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationService.getNotifications(requestParams);
      setNotifications(data.data || []);
      setPagination(data.pagination || null);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [requestParams]);

  const handleMarkRead = async (notificationId) => {
    try {
      setBusyNotificationId(notificationId);
      await notificationService.markAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark notification as read');
    } finally {
      setBusyNotificationId('');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setBusyNotificationId(notificationId);
      await notificationService.deleteNotification(notificationId);
      toast.success('Notification deleted');
      await fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete notification');
    } finally {
      setBusyNotificationId('');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkAllLoading(true);
      await notificationService.markAllAsRead();
      toast.success('All notifications marked as read');
      await fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark all as read');
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear notifications in the current filter?')) return;

    try {
      setClearAllLoading(true);
      await notificationService.clearNotifications({
        tab: filters.tab,
        type: filters.type === 'all' ? undefined : filters.type,
      });
      toast.success('Notifications cleared');
      await fetchNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear notifications');
    } finally {
      setClearAllLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Track order lifecycle updates, returns/refunds, promotions, and system alerts."
        action={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllLoading || unreadCount === 0}
              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
            >
              {markAllLoading ? 'Updating...' : 'Mark All Read'}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearAllLoading || notifications.length === 0}
              className="rounded-md border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-60"
            >
              {clearAllLoading ? 'Clearing...' : 'Clear Filtered'}
            </button>
          </div>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {tabOptions.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, page: 1, tab: tab.value }))}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  filters.tab === tab.value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              Unread: {unreadCount}
            </span>
            <select
              value={filters.type}
              onChange={(event) => setFilters((prev) => ({ ...prev, page: 1, type: event.target.value }))}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading ? <Loader label="Loading notifications" /> : null}

      {!loading && notifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          description="You are all caught up. New updates will appear here automatically."
        />
      ) : null}

      {!loading && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const icon = iconByType[notification.type] || iconByType.system;
            const typeClass = badgeByType[notification.type] || badgeByType.system;
            const isBusy = busyNotificationId === notification._id;

            return (
              <article
                key={notification._id}
                className={`rounded-xl border p-4 shadow-sm transition ${
                  notification.isRead
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-900/20 bg-gradient-to-r from-slate-50 via-white to-white'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold">
                      {icon}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{notification.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeClass}`}>
                          {toTypeLabel(notification.type)}
                        </span>
                        {!notification.isRead ? (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-600">{notification.message}</p>
                      <p className="text-xs text-slate-500">
                        {relativeTime(notification.createdAt)} ({shortDate(notification.createdAt)})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {!notification.isRead ? (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification._id)}
                        disabled={isBusy}
                        className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
                      >
                        Mark Read
                      </button>
                    ) : null}

                    {notification.link ? (
                      <button
                        type="button"
                        onClick={() => navigate(notification.link)}
                        className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        Open
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleDelete(notification._id)}
                      disabled={isBusy}
                      className="rounded border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-600 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />
    </div>
  );
};

export default NotificationsPage;
