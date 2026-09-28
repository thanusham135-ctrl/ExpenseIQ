import client from './client';

export const authApi = {
  register: async (data) => {
    const response = await client.post('/auth/register', data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await client.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },
};
