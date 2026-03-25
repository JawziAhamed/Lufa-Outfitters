import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useCartStore } from '../../store/cartStore';
import { notificationService } from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
    <path
      d="M9 18h6M10.5 21h3M6 16.5h12l-1.4-2.1a6.3 6.3 0 0 1-1.1-3.5V9a3.5 3.5 0 1 0-7 0v1.9a6.3 6.3 0 0 1-1.1 3.5L6 16.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NavBar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const cartCount = useCartStore((state) => state.items.length);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let intervalId = null;
    let cancelled = false;

    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadCount(0);
        return;
      }

      try {
        const { data } = await notificationService.getUnreadCount();
        if (!cancelled) {
          setUnreadCount(Number(data.unreadCount || 0));
        }
      } catch (error) {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnreadCount();

    if (user) {
      intervalId = setInterval(fetchUnreadCount, 30000);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const navItems = useMemo(() => {
    const items = [
      { to: '/products', label: 'Products' },
      { to: '/cart', label: `Cart (${cartCount})` },
    ];

    if (user?.role === 'customer') {
      items.push({ to: '/dashboard/orders', label: 'Dashboard' });
      items.push({
        to: '/dashboard/notifications',
        label: 'Notifications',
        badge: unreadCount,
        isNotification: true,
      });
    }

    if (user && (user.role === 'admin' || user.role === 'staff')) {
      items.push({ to: '/admin/analytics', label: 'Admin' });
      items.push({
        to: '/admin/notifications',
        label: 'Notifications',
        badge: unreadCount,
        isNotification: true,
      });
    }

    return items;
  }, [cartCount, unreadCount, user]);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const linkBaseClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
    }`;

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Custom Tee Studio
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkBaseClass}>
                <span className="inline-flex items-center gap-1.5">
                  {item.isNotification ? (
                    <span className="text-slate-500">
                      <BellIcon />
                    </span>
                  ) : null}
                  {item.label}
                  {item.badge > 0 ? (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!user ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/login"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <span className="max-w-[10rem] truncate text-sm text-slate-600">{user.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  Logout
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        <div className={`${mobileOpen ? 'mt-3 block' : 'hidden'} space-y-2 border-t border-slate-200 pt-3 md:hidden`}>
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={linkBaseClass}
              >
                <span className="inline-flex items-center gap-1.5">
                  {item.isNotification ? (
                    <span className="text-slate-500">
                      <BellIcon />
                    </span>
                  ) : null}
                  {item.label}
                  {item.badge > 0 ? (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>

          {!user ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span className="max-w-[70%] truncate">{user.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
