import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationApi } from '../../api';
import { Bell, User, LogOut } from 'lucide-react';
import Badge from '../ui/Badge';
import sdaLogo from '../../assets/sda-logo.jpg';
import LanguageSwitcher from '../ui/LanguageSwitcher';

import { useTranslation } from '../../contexts/LanguageContext';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
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

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      const notifs = res.data?.data || res.data || [];
      if (Array.isArray(notifs)) {
        setNotifications(notifs);
      }
    } catch (e) {
      console.error('Error fetching notifications in header:', e);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationApi.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (e) {}
    }
    setShowNotifications(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else {
      navigate('/app/notifications');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 fixed top-0 left-0 right-0 z-40 h-16 transition-colors duration-200">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo & Title */}
        <div className="flex items-center space-x-4">
          <img src={sdaLogo} alt="SDA Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">CampCoordAI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-300">{t('header.subtitle', 'Camp Management System')}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
              }}
              className="relative p-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:border-slate-700"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-800 py-2">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('participant.recentNotifications', 'Notifications')}</h3>
                    {unreadCount > 0 && (
                      <Badge variant="danger" size="sm">{unreadCount} {t('header.new', 'new')}</Badge>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer border-b border-gray-100 dark:border-slate-800 ${
                          !notif.isRead ? 'bg-blue-50/60 dark:bg-primary-950/50 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{notif.title}</p>
                          {!notif.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-800 text-center">
                  <Link
                    to="/app/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-bold"
                  >
                    {t('header.viewAllNotifications', 'View all notifications')}
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
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {t(`roles.${user?.role}`, user?.role || 'User')}
                </p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-200 dark:border-slate-800 py-2">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="info" size="sm">{t(`roles.${user?.role}`, user?.role)}</Badge>
                    {user?.position && (
                      <Badge variant="default" size="sm">
                        {t(`positions.${user?.position}`, user?.position?.replace(/_/g, ' '))}
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
