import client from './client';

export const dashboardApi = {
  getSummary: async () => {
    const response = await client.get('/dashboard/summary');
    return response.data;
  },

  getMonthlyTrend: async (monthsCount = 6) => {
    const response = await client.get('/dashboard/monthly', {
      params: { monthsCount },
    });
    return response.data;
  },

  getCategorySpending: async (month = null, year = null) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await client.get('/dashboard/categories', { params });
    return response.data;
  },
};
