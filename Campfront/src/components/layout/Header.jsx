import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, User, LogOut } from 'lucide-react';
import Badge from '../ui/Badge';
import sdaLogo from '../../assets/sda-logo.jpg';
import LanguageSwitcher from '../ui/LanguageSwitcher';

import { useTranslation } from '../../contexts/LanguageContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'User';

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'New proposal submitted', time: '5 min ago', read: false },
    { id: 2, title: 'Event registration opened', time: '1 hour ago', read: false },
    { id: 3, title: 'Payment verified', time: '2 hours ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 fixed top-0 left-0 right-0 z-40 h-16 transition-colors duration-200">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo & Title */}
        <div className="flex items-center space-x-4">
          <img src={sdaLogo} alt="SDA Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">CampCoordAI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-300">Camp Management System</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:border-slate-700"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-800 py-2">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge variant="danger" size="sm">{unreadCount} new</Badge>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer border-b border-gray-100 dark:border-slate-800 ${
                        !notif.read ? 'bg-blue-50/60 dark:bg-primary-950/50' : ''
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{notif.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-800">
                  <Link
                    to="/notifications"
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-bold"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:border-slate-700"
            >
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                {userName.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{userName}</p>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{user?.role || 'User'}</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-800 py-2">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{user?.email}</p>
                  <div className="mt-2">
                    <Badge variant="info" size="sm">{user?.role}</Badge>
                    {user?.position && (
                      <Badge variant="default" size="sm" className="ml-2">
                        {user.position}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/app/profile"
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-4 h-4 mr-3" />
                    {t('nav.profile', 'My Profile')}
                  </Link>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-800 py-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    {t('nav.logout', 'Sign out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
