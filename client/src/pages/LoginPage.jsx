import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/authStore';

const suspensionStorageKey = 'auth_suspension_until';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const [suspensionUntil, setSuspensionUntil] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const storedLockUntil = localStorage.getItem(suspensionStorageKey);
    if (!storedLockUntil) return;

    const lockUntilTime = new Date(storedLockUntil).getTime();
    if (Number.isNaN(lockUntilTime) || lockUntilTime <= Date.now()) {
      localStorage.removeItem(suspensionStorageKey);
      return;
    }

    setSuspensionUntil(new Date(lockUntilTime).toISOString());
  }, []);

  useEffect(() => {
    if (!suspensionUntil) {
      setRemainingSeconds(0);
      return undefined;
    }

    const lockUntilTime = new Date(suspensionUntil).getTime();

    const tick = () => {
      const diffMs = lockUntilTime - Date.now();
      if (diffMs <= 0) {
        setSuspensionUntil('');
        setRemainingSeconds(0);
        localStorage.removeItem(suspensionStorageKey);
        return;
      }

      setRemainingSeconds(Math.ceil(diffMs / 1000));
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [suspensionUntil]);

  const countdownLabel = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remainingSeconds]);

  const onSubmit = async (payload) => {
    if (remainingSeconds > 0) {
      toast.error(
        'Your account has been temporarily suspended for 15 minutes due to multiple incorrect password attempts. Please try again later.'
      );
      return;
    }

    try {
      await login(payload);
      localStorage.removeItem(suspensionStorageKey);
      setSuspensionUntil('');
      setRemainingSeconds(0);
      toast.success('Logged in successfully');
      navigate('/products');
    } catch (error) {
      const responseStatus = error.response?.status;
      const lockUntil = error.response?.data?.details?.lockUntil;
      const serverRemainingSeconds = Number(error.response?.data?.details?.remainingSeconds || 0);

      if (responseStatus === 423 && lockUntil) {
        setSuspensionUntil(lockUntil);
        localStorage.setItem(suspensionStorageKey, lockUntil);
        if (serverRemainingSeconds > 0) {
          setRemainingSeconds(serverRemainingSeconds);
        }
      }

      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  const isSuspended = remainingSeconds > 0;

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
        <div className="relative space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Welcome back</p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Login</h1>
          <p className="text-sm text-slate-600">Access your account securely.</p>
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

          {isSuspended ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p>
                Your account has been temporarily suspended for 15 minutes due to multiple incorrect password
                attempts. Please try again later.
              </p>
              <p className="mt-1 font-semibold">Time remaining: {countdownLabel}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || isSuspended}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing in...' : isSuspended ? `Suspended (${countdownLabel})` : 'Sign In'}
          </button>
        </form>

        <div className="relative mt-4 space-y-2 text-sm text-slate-600">
          <p>
            No account?{' '}
            <Link to="/register" className="font-semibold text-slate-900 underline">
              Register
            </Link>
          </p>
          <p>
            Forgot password?{' '}
            <Link to="/forgot-password" className="font-semibold text-slate-900 underline">
              Reset it
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
