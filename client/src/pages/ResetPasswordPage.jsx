import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { authService } from '../services/authService';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      token: tokenFromUrl,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (payload) => {
    try {
      await authService.resetPassword({
        token: payload.token,
        newPassword: payload.newPassword,
      });
      toast.success('Password reset successful. Please login.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Secure reset</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Reset Password</h1>
          <p className="text-sm text-slate-600">Use the reset token from email service logs and set a new password.</p>
        </div>

        <form className="relative mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-700">Reset Token</label>
            <input
              type="text"
              {...register('token', { required: 'Token is required' })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            {errors.token ? <p className="mt-1 text-xs text-rose-600">{errors.token.message}</p> : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            {errors.newPassword ? (
              <p className="mt-1 text-xs text-rose-600">{errors.newPassword.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="relative mt-4 text-sm text-slate-600">
          Ready to sign in?{' '}
          <Link to="/login" className="font-semibold text-slate-900 underline">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
