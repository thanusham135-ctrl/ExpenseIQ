import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Flame,
  PlusCircle,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { transactionApi } from '../api/transactionApi';
import StatCard from '../components/common/StatCard';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import TransactionModal from '../components/transactions/TransactionModal';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('EXPENSE');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumData, trendData, catData, transData] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getMonthlyTrend(6),
        dashboardApi.getCategorySpending(),
        transactionApi.getAll({}),
      ]);

      setSummary(sumData);
      setMonthlyTrend(trendData);
      setCategoryBreakdown(catData);
      setRecentTransactions(transData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (data) => {
    await transactionApi.create(data);
    await fetchDashboardData();
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0.00';
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Fetching financial intelligence..." />
      </div>
    );
  }

  const balance = summary?.currentBalance || 0;
  const isPositiveBalance = balance >= 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/10">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">Personal Balance</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 font-tabular">
            {formatCurrency(balance)}
          </h2>
          <p className="text-xs text-slate-300 mt-2">
            Formula: Net Worth = Total Income ({formatCurrency(summary?.totalIncome)}) - Total Expenses ({formatCurrency(summary?.totalExpenses)})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal('INCOME')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold backdrop-blur-sm transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Add Income
          </button>
          <button
            onClick={() => handleOpenModal('EXPENSE')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4 text-rose-500" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.totalIncome)}
          subtitle="All-time lifetime income"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.totalExpenses)}
          subtitle="All-time lifetime outflow"
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          title="This Month's Spending"
          value={formatCurrency(summary?.currentMonthExpenses)}
          subtitle="Current calendar month"
          icon={Calendar}
          variant="info"
        />
        <StatCard
          title="Daily Average (Month)"
          value={formatCurrency(summary?.averageDailyExpense)}
          subtitle={`Top category: ${summary?.highestSpendingCategory || 'None'}`}
          icon={Flame}
          variant="default"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Monthly Cash Flow</h3>
              <p className="text-xs text-slate-400">Income vs Expenses over the last 6 months</p>
            </div>
          </div>
          <MonthlyTrendChart data={monthlyTrend} />
        </div>

        {/* Expense by Category Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">Expense by Category</h3>
            <p className="text-xs text-slate-400">Current month spending distribution</p>
          </div>
          <CategoryPieChart data={categoryBreakdown} />
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Your latest recorded financial entries</p>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No transactions yet"
              description="Record your first income or expense transaction to start visualizing your cash flow."
              actionLabel="Add Transaction"
              onAction={() => handleOpenModal('EXPENSE')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isIncome ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {tx.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {tx.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-md">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {format(new Date(tx.transactionDate), 'MMM d, yyyy')}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold font-tabular whitespace-nowrap ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialType={modalType}
      />
    </div>
  );
}
