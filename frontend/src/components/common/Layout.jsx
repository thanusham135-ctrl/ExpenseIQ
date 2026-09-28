import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Overview';
    if (pathname.startsWith('/transactions')) return 'Transactions';
    if (pathname.startsWith('/budgets')) return 'Monthly Budgets';
    if (pathname.startsWith('/reports')) return 'Financial Reports';
    if (pathname.startsWith('/profile')) return 'Profile & Categories';
    return 'ExpenseIQ';
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar onOpenMobileSidebar={() => setMobileOpen(true)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
