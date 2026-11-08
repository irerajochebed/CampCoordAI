import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        <main className="flex-1 p-4 sm:p-6 lg:ml-64 min-h-[calc(100vh-4rem)] w-full">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
