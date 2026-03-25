import apiClient from './apiClient';

export const returnService = {
  getMyReturns: (params) => apiClient.get('/returns/mine', { params }),
  getReturns: (params) => apiClient.get('/returns', { params }),
  createReturn: (formData) =>
    apiClient.post('/returns', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateReturn: (id, payload) => apiClient.patch(`/returns/${id}`, payload),
};
