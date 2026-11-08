import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationApi } from '../../api';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import Badge from '../ui/Badge';
import sdaLogo from '../../assets/sda-logo.jpg';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import ThemeSwitcher from '../ui/ThemeSwitcher';

import { useTranslation } from '../../contexts/LanguageContext';
import { getUserDisplayRole, getImageUrl } from '../../utils/userRoleHelper';

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'User';
  const displayRole = getUserDisplayRole(user, t);
  const avatarUrl = getImageUrl(user?.profileImageUrl);

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
      const handleUpdate = () => fetchNotifications();
      window.addEventListener('notifications-updated', handleUpdate);
      return () => {
        window.removeEventListener('notifications-updated', handleUpdate);
      };
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
        window.dispatchEvent(new Event('notifications-updated'));
      } catch (e) {}
    }
    setShowNotifications(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    } else {
      navigate('/app/communication');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white dark:bg-[#0B1426] border-b border-slate-200 dark:border-slate-800 fixed top-0 left-0 right-0 z-40 h-16 transition-colors duration-200">
      <div className="flex items-center justify-between h-full px-3 sm:px-6">
        {/* Left side: Menu button + Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3.5">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3.5">
            <img src={sdaLogo} alt="SDA Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-md" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">CampCoordAI</h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-300 font-medium hidden sm:block">{t('header.subtitle', 'Rwanda Union Mission')}</p>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 md:space-x-3">
          {/* Theme Switcher Toggle */}
          <ThemeSwitcher />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
              }}
              className="relative p-2 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title={t('header.notifications', 'Notifications')}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0B1426]"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#111D38] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 max-h-[80vh] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('header.notifications', 'Notifications')}</h3>
                    {unreadCount > 0 && (
                      <Badge variant="danger" size="sm">{unreadCount} {t('header.new', 'new')}</Badge>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      {t('header.noNotifications', 'No notifications yet')}
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border-b border-slate-100 dark:border-slate-800/80 transition-colors ${
                          !notif.isRead ? 'bg-blue-50/60 dark:bg-primary-950/40 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{notif.title}</p>
                          {!notif.isRead && <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full shrink-0 mt-1"></span>}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 font-mono">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : t('header.justNow', 'Just now')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-center">
                  <Link
                    to="/app/communication"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-bold"
                  >
                    {t('header.viewAllNotifications', 'View all notifications')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-1.5 sm:space-x-2.5 p-1 sm:p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {/* Profile Picture - Always Visible */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-800 dark:bg-primary-700 text-white rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shadow-xs overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img
                    key={avatarUrl.slice(-20)}
                    src={avatarUrl}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white">{userName.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              {/* Name and Role - Hidden on mobile, visible on larger screens */}
              <div className="text-left hidden md:block pr-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{userName}</p>
                <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 truncate max-w-[140px]" title={displayRole}>
                  {displayRole}
                </p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-[#111D38] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 dark:bg-primary-700 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-xs overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img
                        key={avatarUrl.slice(-20)}
                        src={avatarUrl}
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userName.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="info" size="sm">{displayRole}</Badge>
                    {(user?.organizationUnitName || user?.organization) && (
                      <Badge variant="default" size="sm">
                        {user?.organizationUnitName || user?.organization}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/app/profile"
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-4 h-4 mr-3 text-slate-500 dark:text-slate-400" />
                    {t('nav.profile', 'My Profile')}
                  </Link>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 py-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
