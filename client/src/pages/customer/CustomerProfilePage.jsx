import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Loader, SectionHeader } from '../../components';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { resolveProductImageUrl } from '../../utils/image';

const avatarPlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='Arial,sans-serif' font-size='20'%3EProfile%3C/text%3E%3C/svg%3E";

const toLabel = (value = '') =>
  String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const roleBadgeClass = (role = '') => {
  if (role === 'admin') return 'bg-rose-100 text-rose-700';
  if (role === 'staff') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
};

const CustomerProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const loading = useAuthStore((state) => state.loading);

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    watch: watchProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      avatar: null,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedAvatar = watchProfile('avatar');
  const newPasswordValue = watchPassword('newPassword');

  const profileImageUrl = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    const resolved = resolveProductImageUrl(user?.avatarUrl);
    return resolved || avatarPlaceholder;
  }, [avatarPreview, user?.avatarUrl]);

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const { data } = await authService.getActivity({ limit: 12 });
      setActivity(data.activity || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load account activity');
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadPageData = async () => {
      try {
        await fetchProfile();
      } catch (error) {
        // Handled centrally by auth store.
      }

      if (!active) return;
      await loadActivity();
    };

    loadPageData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    resetProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      avatar: null,
    });
  }, [user, resetProfileForm]);

  useEffect(() => {
    const file = watchedAvatar?.[0];
    if (!file) {
      setAvatarPreview('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [watchedAvatar]);

  const onProfileSubmit = async (payload) => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', payload.name?.trim() || '');
      formData.append('email', payload.email?.trim() || '');
      formData.append('phone', payload.phone?.trim() || '');
      formData.append('address', payload.address?.trim() || '');

      if (payload.avatar?.[0]) {
        formData.append('avatar', payload.avatar[0]);
      }

      await updateProfile(formData);
      toast.success('Profile updated successfully');
      await loadActivity();
      setAvatarPreview('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (payload) => {
    setChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      });
      toast.success('Password changed successfully');
      resetPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      await loadActivity();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading && !user) {
    return <Loader label="Loading profile" />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Profile Management"
        description="View and update your personal details, password, avatar, and recent account activity."
      />

      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mx-auto h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100 sm:h-20 sm:w-20">
            <img
              src={profileImageUrl}
              alt="Profile avatar"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = avatarPlaceholder;
              }}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-base font-bold text-slate-900">{user?.name || 'User'}</p>
            <p className="break-all text-xs text-slate-500">{user?.email}</p>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${roleBadgeClass(
                user?.role
              )}`}
            >
              {toLabel(user?.role)}
            </span>
          </div>

          <dl className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <dt>Phone</dt>
              <dd className="text-right">{user?.phone || 'N/A'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Last Login</dt>
              <dd className="text-right">{formatDateTime(user?.lastLoginAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Wallet</dt>
              <dd className="text-right">${Number(user?.walletBalance || 0).toFixed(2)}</dd>
            </div>
          </dl>
        </aside>

        <section className="space-y-6">
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Personal Information</h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Name
                <input
                  type="text"
                  {...registerProfile('name', { required: 'Name is required', minLength: 2, maxLength: 80 })}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
                {profileErrors.name ? <p className="text-xs text-rose-600">{profileErrors.name.message}</p> : null}
              </label>

              <label className="text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  {...registerProfile('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
                  })}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
                {profileErrors.email ? <p className="text-xs text-rose-600">{profileErrors.email.message}</p> : null}
              </label>

              <label className="text-sm font-medium text-slate-700">
                Phone
                <input
                  type="text"
                  {...registerProfile('phone', { maxLength: 20 })}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
                {profileErrors.phone ? <p className="text-xs text-rose-600">Phone is too long</p> : null}
              </label>

              <label className="text-sm font-medium text-slate-700">
                Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  {...registerProfile('avatar')}
                  className="mt-1 block w-full text-sm"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Address
                <textarea
                  rows={3}
                  {...registerProfile('address', { maxLength: 255 })}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
                {profileErrors.address ? <p className="text-xs text-rose-600">Address is too long</p> : null}
              </label>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Change Password</h3>

              <div className="mt-3 space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Current Password
                  <input
                    type="password"
                    {...registerPassword('currentPassword', { required: 'Current password is required', minLength: 8 })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                  {passwordErrors.currentPassword ? (
                    <p className="text-xs text-rose-600">{passwordErrors.currentPassword.message}</p>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  New Password
                  <input
                    type="password"
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Minimum 8 characters' },
                    })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                  {passwordErrors.newPassword ? (
                    <p className="text-xs text-rose-600">{passwordErrors.newPassword.message}</p>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Confirm New Password
                  <input
                    type="password"
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: (value) => value === newPasswordValue || 'Passwords do not match',
                    })}
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                  {passwordErrors.confirmPassword ? (
                    <p className="text-xs text-rose-600">{passwordErrors.confirmPassword.message}</p>
                  ) : null}
                </label>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="mt-3 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Activity</h3>

              {activityLoading ? (
                <p className="mt-3 text-sm text-slate-500">Loading activity...</p>
              ) : activity.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No recent activity found.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {activity.map((entry, index) => (
                    <li key={`${entry.action}-${entry.createdAt}-${index}`} className="rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">{toLabel(entry.action)}</p>
                      <p>{formatDateTime(entry.createdAt)}</p>
                      {entry.ipAddress ? <p className="mt-0.5">IP: {entry.ipAddress}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
