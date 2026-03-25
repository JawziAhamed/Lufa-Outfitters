import apiClient from './apiClient';

export const promoService = {
  getPromos: (params) => apiClient.get('/promos', { params }),
  createPromo: (payload) => apiClient.post('/promos', payload),
  updatePromo: (id, payload) => apiClient.patch(`/promos/${id}`, payload),
  deletePromo: (id) => apiClient.delete(`/promos/${id}`),
  broadcastPromo: (payload) => apiClient.post('/promos/broadcast', payload),
};
