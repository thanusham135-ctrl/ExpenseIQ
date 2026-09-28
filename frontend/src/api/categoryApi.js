import client from './client';

export const categoryApi = {
  getAll: async (type = null) => {
    const params = type ? { type } : {};
    const response = await client.get('/categories', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await client.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await client.post('/categories', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await client.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await client.delete(`/categories/${id}`);
    return response.data;
  },
};
