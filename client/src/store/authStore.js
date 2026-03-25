import { create } from 'zustand';

import { authService } from '../services/authService';

const initialToken = localStorage.getItem('auth_token');
const initialUserRaw = localStorage.getItem('auth_user');
const initialUser = initialUserRaw ? JSON.parse(initialUserRaw) : null;

export const useAuthStore = create((set, get) => ({
  token: initialToken || '',
  user: initialUser,
  loading: false,

  isAuthenticated: () => Boolean(get().token),
  hasRole: (roles = []) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  },

  setAuth: ({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ token: '', user: null });
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await authService.register(payload);
      get().setAuth({ token: data.token, user: data.user });
      return data;
    } finally {
      set({ loading: false });
    }
  },

  login: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await authService.login(payload);
      get().setAuth({ token: data.token, user: data.user });
      return data;
    } finally {
      set({ loading: false });
    }
  },

  fetchProfile: async () => {
    if (!get().token) return null;

    set({ loading: true });
    try {
      const { data } = await authService.me();
      const token = get().token;
      get().setAuth({ token, user: data.user });
      return data.user;
    } catch (error) {
      get().clearAuth();
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await authService.updateProfile(payload);
      const token = get().token;
      get().setAuth({ token, user: data.user });
      return data;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore network errors on logout.
    }
    get().clearAuth();
  },
}));
