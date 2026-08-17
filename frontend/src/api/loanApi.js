import api from './axios';

export const createLoanApplication = (payload) => api.post('/loans', payload);

export const getMyLoanApplications = () => api.get('/loans/mine');

export const getAllLoanApplications = (params = {}) => api.get('/loans', { params });

export const updateLoanStatus = (id, payload) => api.put(`/loans/${id}/status`, payload);
