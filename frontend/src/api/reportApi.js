import client from './client';

export const reportApi = {
  getMonthlyReport: async (month = null, year = null) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await client.get('/reports/monthly', { params });
    return response.data;
  },

  downloadCsv: async (month = null, year = null) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await client.get('/reports/export/csv', {
      params,
      responseType: 'blob',
    });

    // Create a link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expenseiq_report_${year || 'all'}_${month || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
