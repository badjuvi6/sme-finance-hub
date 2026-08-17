import api from './axios';

export const getTransactions = (params = {}) => api.get('/transactions', { params });

export const getTransactionSummary = () => api.get('/transactions/summary');

export const createTransaction = (payload) => api.post('/transactions', payload);

export const updateTransaction = (id, payload) => api.put(`/transactions/${id}`, payload);

export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
