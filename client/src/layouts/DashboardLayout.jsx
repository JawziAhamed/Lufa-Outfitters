import { NavLink, Outlet } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';

const customerLinks = [
  { to: '/dashboard/orders', label: 'My Orders' },
  { to: '/dashboard/notifications', label: 'Notifications' },
  { to: '/dashboard/returns', label: 'My Returns' },
  { to: '/dashboard/complaints', label: 'My Complaints' },
  { to: '/dashboard/profile', label: 'Profile' },
];

const adminLinks = [
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/notifications', label: 'Notifications' },
  { to: '/admin/returns-complaints', label: 'Returns & Complaints' },
  { to: '/admin/reports', label: 'Reports', adminOnly: true },
  { to: '/admin/promos', label: 'Promo Management' },
  { to: '/admin/profile', label: 'Profile' },
];

const DashboardLayout = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const baseAdminLinks = adminLinks.filter((l) => !l.adminOnly || isAdmin);
  const links =
    user?.role === 'customer'
      ? customerLinks
      : isAdmin
        ? [{ to: '/admin/users', label: 'Users' }, ...baseAdminLinks]
        : baseAdminLinks;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px,1fr] lg:gap-6">
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          {user?.role === 'customer' ? 'Customer Dashboard' : 'Admin Dashboard'}
        </h2>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="min-h-[480px] min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5 lg:p-6">
        <Outlet />
      </section>
    </div>
  );
};

export default DashboardLayout;
