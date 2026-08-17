import api from './axios';

export const login = (email, password) => api.post('/auth/login', { email, password });

export const register = (payload) => api.post('/auth/register', payload);

export const getMe = () => api.get('/auth/me');

export const updateProfile = (payload) => api.put('/auth/me', payload);
