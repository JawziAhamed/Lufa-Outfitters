import apiClient from './apiClient';

export const categoryService = {
  getCategories: (params) => apiClient.get('/categories', { params }),
  createCategory: (payload) => apiClient.post('/categories', payload),
};
