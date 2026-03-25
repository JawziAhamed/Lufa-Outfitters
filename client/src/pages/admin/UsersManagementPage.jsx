import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { Loader, Pagination, SectionHeader } from '../../components';
import { userService } from '../../services/userService';
import { shortDate } from '../../utils/format';

const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    search: '',
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    address: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await userService.getUsers(query);
      setUsers(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [query.page, query.limit, query.search]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error('Name, email, and password (min 8 chars) are required.');
      return;
    }
    try {
      setCreating(true);
      await userService.createUser(form);
      toast.success('User created');
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        phone: '',
        address: '',
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await userService.updateUserRole(userId, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await userService.deleteUser(userId);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <SectionHeader title="Users Management" description="Manage roles and lifecycle of users." />

      <div className="mb-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:grid-cols-[1.1fr,0.9fr]">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleCreate}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Full name"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="Email"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Password (min 8)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="customer">Customer</option>
          </select>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Phone (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="Address (optional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2 lg:col-span-3"
          />
          <button
            type="submit"
            disabled={creating}
            className="col-span-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-[0.98]"
          >
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input
            type="text"
            value={query.search}
            onChange={(event) => setQuery((prev) => ({ ...prev, page: 1, search: event.target.value }))}
            placeholder="Search by name/email/role"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {loading ? <Loader label="Loading users" /> : null}

      {!loading ? (
        <div className="space-y-3">
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <article key={user._id} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="mt-0.5 text-xs text-slate-500 break-all">{user.email}</p>
                <p className="mt-2 text-xs text-slate-500">Created: {shortDate(user.createdAt)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user._id, event.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                  >
                    <option value="admin">admin</option>
                    <option value="staff">staff</option>
                    <option value="customer">customer</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(user._id)}
                    className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
            <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{user.name}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user._id, event.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="admin">admin</option>
                      <option value="staff">staff</option>
                      <option value="customer">customer</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">{shortDate(user.createdAt)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(user._id)}
                      className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Pagination pagination={pagination} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} />
    </div>
  );
};

export default UsersManagementPage;
