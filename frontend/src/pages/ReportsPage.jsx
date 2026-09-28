import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import { reportApi } from '../api/reportApi';
import StatCard from '../components/common/StatCard';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import AlertBanner from '../components/common/AlertBanner';

export default function ReportsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [alert, setAlert] = useState(null);

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getMonthlyReport(selectedMonth, selectedYear);
      setReport(data);
    } catch (err) {
      console.error('Failed to load report', err);
      setAlert({ type: 'error', message: 'Failed to generate financial report.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const handleDownloadCsv = async () => {
    try {
      setDownloading(true);
      await reportApi.downloadCsv(selectedMonth, selectedYear);
      setAlert({ type: 'success', message: 'Report exported to CSV successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to download CSV export.' });
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const selectedMonthName = months.find((m) => m.value === selectedMonth)?.name;

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports</h2>
          <p className="text-xs text-slate-500 mt-1">
            In-depth monthly audit and data export for {selectedMonthName} {selectedYear}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none border-l pl-2 border-slate-200"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Export to CSV Button */}
          <button
            onClick={handleDownloadCsv}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{downloading ? 'Exporting...' : 'Export to CSV'}</span>
          </button>
        </div>
      </div>

      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {loading ? (
        <div className="p-16">
          <LoadingSpinner text="Generating monthly financial statement..." />
        </div>
      ) : !report ? (
        <EmptyState title="No report data" description="Unable to load report data." />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Monthly Income"
              value={formatCurrency(report.totalIncome)}
              subtitle={`Total inflows in ${selectedMonthName}`}
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Monthly Expenses"
              value={formatCurrency(report.totalExpenses)}
              subtitle={`Total outflows in ${selectedMonthName}`}
              icon={TrendingDown}
              variant="danger"
            />
            <StatCard
              title="Net Savings"
              value={formatCurrency(report.savings)}
              subtitle={
                report.savings >= 0 ? 'Surplus cash flow' : 'Deficit for the month'
              }
              icon={PiggyBank}
              variant={report.savings >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              title="Average Daily Expense"
              value={formatCurrency(report.averageDailyExpense)}
              subtitle={`${report.transactionsCount} transactions recorded`}
              icon={Flame}
              variant="default"
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-1">Expense Breakdown</h3>
              <p className="text-xs text-slate-400 mb-4">Proportion of category spending</p>
              <CategoryPieChart data={report.categorySpendings} />
            </div>

            {/* Category Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Category Statement</h3>
                    <p className="text-xs text-slate-400">
                      Top spending: <span className="font-semibold text-slate-700">{report.highestSpendingCategory}</span>
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {report.categorySpendings.length} categories active
                  </div>
                </div>

                {report.categorySpendings.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      title="No spending recorded"
                      description={`No expense transactions exist for ${selectedMonthName} ${selectedYear}.`}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3.5">Category</th>
                          <th className="px-6 py-3.5 text-right">Amount</th>
                          <th className="px-6 py-3.5 text-right">% of Expenses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.categorySpendings.map((cat) => (
                          <tr key={cat.categoryId} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3.5 font-semibold text-slate-800">
                              {cat.categoryName}
                            </td>
                            <td className="px-6 py-3.5 text-right font-bold font-tabular text-slate-900">
                              {formatCurrency(cat.amount)}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                {cat.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer summary bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Summary calculated from PostgreSQL database records</span>
                <span className="font-semibold text-slate-900">
                  Total outflow: {formatCurrency(report.totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
