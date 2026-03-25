import apiClient from './apiClient';

export const analyticsService = {
  dashboard: () => apiClient.get('/analytics/dashboard'),
  monthlySales: (params) => apiClient.get('/analytics/sales/monthly', { params }),
  returnsComplaints: () => apiClient.get('/analytics/returns-complaints'),
  downloadSalesReport: (params) =>
    apiClient.get('/analytics/reports/sales/pdf', {
      params,
      responseType: 'blob',
    }),
  downloadStockReport: () =>
    apiClient.get('/analytics/reports/stock/pdf', {
      responseType: 'blob',
    }),
  downloadReturnsComplaintsReport: (params) =>
    apiClient.get('/analytics/reports/returns-complaints/pdf', {
      params,
      responseType: 'blob',
    }),
};
