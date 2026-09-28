import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle,
  TrendingDown,
} from 'lucide-react';
import { budgetApi } from '../api/budgetApi';
import { categoryApi } from '../api/categoryApi';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import AlertBanner from '../components/common/AlertBanner';

export default function BudgetsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
  });

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const [bList, catList] = await Promise.all([
        budgetApi.getAll(selectedMonth, selectedYear),
        categoryApi.getAll('EXPENSE'),
      ]);
      setBudgets(bList);
      setExpenseCategories(catList);
    } catch (err) {
      console.error('Failed to load budgets', err);
      setAlert({ type: 'error', message: 'Failed to load budgets.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth, selectedYear]);

  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setFormData({
      categoryId: expenseCategories.length > 0 ? expenseCategories[0].id : '',
      amount: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount,
    });
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid amount greater than 0.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        categoryId: Number(formData.categoryId),
        amount: amountVal,
        month: Number(selectedMonth),
        year: Number(selectedYear),
      };

      if (editingBudget) {
        await budgetApi.update(editingBudget.id, payload);
        setAlert({ type: 'success', message: 'Budget updated successfully!' });
      } else {
        await budgetApi.create(payload);
        setAlert({ type: 'success', message: 'Budget created successfully!' });
      }

      setIsModalOpen(false);
      await loadBudgets();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save budget.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await budgetApi.delete(deletingId);
      setAlert({ type: 'success', message: 'Budget removed successfully.' });
      setDeletingId(null);
      await loadBudgets();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to delete budget.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

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

  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Month Selector & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Monthly Budgets</h2>
          <p className="text-xs text-slate-500 mt-1">
            Establish spending caps for categories and monitor adherence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
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

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Set Category Budget</span>
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

      {/* Aggregate Budget Bar */}
      {budgets.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Budgeted</span>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(totalBudgeted)}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Actual Spent</span>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                totalSpent > totalBudgeted
                  ? 'bg-rose-500'
                  : totalSpent > totalBudgeted * 0.8
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(
                  totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Budgets Grid */}
      {loading ? (
        <div className="p-16">
          <LoadingSpinner text="Computing budget consumption..." />
        </div>
      ) : budgets.length === 0 ? (
        <div className="p-10">
          <EmptyState
            title="No budgets configured for this month"
            description="Set a monthly budget for Food, Transport, Shopping, or any expense category to take control of your expenses."
            actionLabel="Set Category Budget"
            onAction={handleOpenCreateModal}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const isExceeded = b.exceeded;
            const progress = Math.min(b.percentageUsed, 100);

            return (
              <div
                key={b.id}
                className={`p-6 bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                  isExceeded ? 'border-rose-200' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{b.categoryName}</h3>
                    <p className="text-xs text-slate-400">
                      Budget: <span className="font-semibold text-slate-700">{formatCurrency(b.amount)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(b)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Budget"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-500">
                      Spent: <strong className="text-slate-800">{formatCurrency(b.spent)}</strong>
                    </span>
                    <span
                      className={`font-bold ${
                        isExceeded
                          ? 'text-rose-600'
                          : b.percentageUsed >= 80
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {b.percentageUsed}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : b.percentageUsed >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Remaining & Status Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      {isExceeded ? 'Exceeded by' : 'Remaining'}
                    </span>
                    <span
                      className={`font-bold font-tabular ${
                        isExceeded ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {isExceeded
                        ? formatCurrency(Math.abs(b.remaining))
                        : formatCurrency(b.remaining)}
                    </span>
                  </div>

                  {isExceeded ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Budget exceeded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      On Track
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set/Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget' : 'Set Category Budget'}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
              disabled={!!editingBudget}
              className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Budget Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 5000"
              className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-tabular text-lg font-bold"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Budget"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to remove this budget limit? Your transaction history will not be affected.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteBudget}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
