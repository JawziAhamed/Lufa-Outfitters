import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (payload) => {
    try {
      await registerUser(payload);
      toast.success('Account created');
      navigate('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Join us</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Create Account</h1>
          <p className="text-sm text-slate-600">Design and order custom tees effortlessly.</p>
        </div>

        <form className="relative mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              {...register('name', { required: 'Name is required', minLength: 2 })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            {errors.name ? <p className="mt-1 text-xs text-rose-600">Name is required</p> : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            {errors.email ? <p className="mt-1 text-xs text-rose-600">Email is required</p> : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
            {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input
              type="text"
              {...register('phone')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Address</label>
            <textarea
              rows={2}
              {...register('address')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-inner transition focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="relative mt-4 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-900 underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
