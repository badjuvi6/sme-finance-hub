import api from './axios';

export const getInvoices = (params = {}) => api.get('/invoices', { params });

export const getInvoiceSummary = () => api.get('/invoices/summary');

export const createInvoice = (payload) => api.post('/invoices', payload);

export const updateInvoice = (id, payload) => api.put(`/invoices/${id}`, payload);

export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
