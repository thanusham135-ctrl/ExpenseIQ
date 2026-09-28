import client from './client';

export const transactionApi = {
  getAll: async (filters = {}) => {
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.search) params.search = filters.search;

    const response = await client.get('/transactions', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await client.get(`/transactions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await client.post('/transactions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await client.put(`/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await client.delete(`/transactions/${id}`);
    return response.data;
  },
};
