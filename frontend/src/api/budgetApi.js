import client from './client';

export const budgetApi = {
  getAll: async (month = null, year = null) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await client.get('/budgets', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await client.get(`/budgets/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await client.post('/budgets', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await client.put(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await client.delete(`/budgets/${id}`);
    return response.data;
  },
};
