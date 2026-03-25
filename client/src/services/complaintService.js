import apiClient from './apiClient';

export const complaintService = {
  getMyComplaints: (params) => apiClient.get('/complaints/mine', { params }),
  getComplaints: (params) => apiClient.get('/complaints', { params }),
  createComplaint: (formData) =>
    apiClient.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateComplaint: (id, payload) => apiClient.patch(`/complaints/${id}`, payload),
  addMessage: (id, payload) => apiClient.post(`/complaints/${id}/messages`, payload),
};
