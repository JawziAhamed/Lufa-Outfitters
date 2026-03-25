import apiClient from './apiClient';

export const inventoryService = {
  getInventory: (params) => apiClient.get('/inventory', { params }),
  getLowStockAlerts: () => apiClient.get('/inventory/alerts/low-stock'),
  updateInventory: (id, payload) => apiClient.patch(`/inventory/${id}`, payload),
  adjustStock: (payload) => apiClient.post('/inventory/adjust', payload),
};
