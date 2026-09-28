import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { categoryApi } from '../api/categoryApi';
import {
  User,
  Mail,
  Shield,
  Tag,
  Plus,
  Trash2,
  Calendar,
  LogOut,
  Layers,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import AlertBanner from '../components/common/AlertBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('EXPENSE');
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setSubmitting(true);
      await categoryApi.create({
        name: newCatName.trim(),
        type: newCatType,
      });
      setAlert({ type: 'success', message: `Category '${newCatName}' created successfully!` });
      setIsCatModalOpen(false);
      setNewCatName('');
      await loadCategories();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create category.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category '${name}'?`)) {
      return;
    }
    try {
      await categoryApi.delete(id);
      setAlert({ type: 'success', message: `Category '${name}' deleted successfully.` });
      await loadCategories();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Cannot delete category in use.',
      });
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const incomeCategories = categories.filter((c) => c.type === 'INCOME');

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Categories</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review your account profile and manage income/expense classifications.
        </p>
      </div>

      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* User Information Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-emerald-600/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{user?.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> Secure JWT Authenticated
                </span>
                <span className="text-xs text-slate-400">ID: #{user?.id}</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors self-start sm:self-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Categories Management Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Category Management</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Custom categories appear in transaction entry and budget allocations.
            </p>
          </div>

          <button
            onClick={() => setIsCatModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Category</span>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading categories..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Categories */}
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-rose-600 mb-3 flex items-center justify-between">
                <span>Expense Categories</span>
                <span className="text-slate-400 text-[11px] font-normal">{expenseCategories.length} items</span>
              </h4>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {expenseCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm group hover:border-slate-200 transition-colors"
                  >
                    <span className="font-medium text-slate-700">{c.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Categories */}
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-600 mb-3 flex items-center justify-between">
                <span>Income Categories</span>
                <span className="text-slate-400 text-[11px] font-normal">{incomeCategories.length} items</span>
              </h4>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {incomeCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm group hover:border-slate-200 transition-colors"
                  >
                    <span className="font-medium text-slate-700">{c.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Add Custom Category"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Category Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setNewCatType('EXPENSE')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  newCatType === 'EXPENSE'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setNewCatType('INCOME')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  newCatType === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Gym & Fitness, Dividend Yield"
              className="block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
