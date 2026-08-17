import api from './axios';

export const getPlatformOverview = () => api.get('/admin/overview');

export const getAllSMEs = () => api.get('/admin/smes');
