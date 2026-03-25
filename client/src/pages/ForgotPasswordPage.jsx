import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { authService } from '../services/authService';

const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (payload) => {
    try {
      await authService.forgotPassword(payload);
      toast.success('Reset token generated. Check server logs (mock email service).');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request reset token');
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reset access</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Forgot Password</h1>
          <p className="text-sm text-slate-600">Enter your account email to request a password reset token.</p>
        </div>

        <form className="relative mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            {isSubmitting ? 'Requesting...' : 'Request Reset Token'}
          </button>
        </form>

        <p className="relative mt-4 text-sm text-slate-600">
          Remembered password?{' '}
          <Link to="/login" className="font-semibold text-slate-900 underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
