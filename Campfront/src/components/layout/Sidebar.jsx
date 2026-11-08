import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { notificationApi } from '../../api';
import { 
  NAV_KEYS, 
  isNavAllowed 
} from '../../utils/navigationPermissions';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  ClipboardList, 
  QrCode, 
  Home, 
  DollarSign, 
  Package, 
  TrendingUp, 
  MessageSquare,
  Building2, 
  Layers, 
  Users 
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);

  // Synchronize unread notification count
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getMyNotifications();
        const notifs = res.data?.data || res.data || [];
        if (Array.isArray(notifs) && isMounted) {
          const unread = notifs.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        // silent fallback
      }
    };

    if (user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      const handleUpdate = () => fetchUnread();
      window.addEventListener('notifications-updated', handleUpdate);
      return () => {
        isMounted = false;
        clearInterval(interval);
        window.removeEventListener('notifications-updated', handleUpdate);
      };
    }
  }, [user]);

  const isMediaPA = 
    user?.position === 'PA_TEAM' || 
    user?.position === 'MEDIA_TEAM' || 
    user?.departmentName?.toLowerCase().includes('communication') ||
    user?.departmentName?.toLowerCase().includes('media') ||
    user?.department?.type === 'COMMUNICATION';

  // Master Navigation Items according to SDA RUM official governance structure
  const masterNavigation = [
    { 
      key: NAV_KEYS.DASHBOARD,
      name: isMediaPA ? t('nav.mediaDashboard', 'Media & PA Control') : t('nav.dashboard', 'Dashboard'), 
      href: '/app/dashboard', 
      icon: LayoutDashboard,
    },
    { 
      key: NAV_KEYS.PROPOSALS,
      name: t('nav.proposals', 'Proposals'), 
      href: '/app/proposals', 
      icon: FileText,
    },
    { 
      key: NAV_KEYS.EVENTS,
      name: isMediaPA ? t('nav.mediaSchedule', 'Events & Schedulers') : t('nav.events', 'Events & Camps'), 
      href: '/app/events', 
      icon: Calendar,
    },
    { 
      key: NAV_KEYS.REGISTRATIONS,
      name: t('nav.registrations', 'Registrations'), 
      href: '/app/registrations', 
      icon: ClipboardList,
    },
    { 
      key: NAV_KEYS.ATTENDANCE,
      name: t('nav.attendance', 'Attendance'), 
      href: '/app/attendance', 
      icon: QrCode,
    },
    { 
      key: NAV_KEYS.ACCOMMODATION,
      name: t('nav.accommodation', 'Accommodation'), 
      href: '/app/accommodation', 
      icon: Home,
    },
    { 
      key: NAV_KEYS.PAYMENTS,
      name: t('nav.payments', 'Payments'), 
      href: '/app/payments', 
      icon: DollarSign,
    },
    { 
      key: NAV_KEYS.RESOURCES,
      name: isMediaPA ? t('nav.mediaResources', 'Media & Presentation Files') : t('nav.resources', 'Resources'), 
      href: '/app/resources', 
      icon: Package,
    },
    { 
      key: NAV_KEYS.ANALYTICS,
      name: t('nav.analytics', 'Readiness Analytics'), 
      href: '/app/analytics', 
      icon: TrendingUp,
    },
    { 
      key: NAV_KEYS.COMMUNICATION,
      name: t('nav.communication', 'Communication'), 
      href: '/app/communication', 
      icon: MessageSquare,
      badge: unreadCount,
    },
    { 
      key: NAV_KEYS.DEPARTMENTS,
      name: t('nav.departments', 'Departments'), 
      href: '/app/departments', 
      icon: Building2,
    },
    { 
      key: NAV_KEYS.ORGANIZATION,
      name: t('nav.organization', 'Hierarchy Units'), 
      href: '/app/organization', 
      icon: Layers,
    },
    { 
      key: NAV_KEYS.USERS,
      name: t('nav.users', 'User Directory'), 
      href: '/app/users', 
      icon: Users,
    },
  ];

  // Dynamically filter tabs based on role & position
  const visibleNavItems = masterNavigation.filter((item) => isNavAllowed(user, item.key));

  const isItemActive = (item) => {
    if (item.href === '/app/communication') {
      return location.pathname.startsWith('/app/communication') || location.pathname.startsWith('/app/notifications');
    }
    if (item.href === '/app/dashboard') {
      return location.pathname === '/app/dashboard' || location.pathname.startsWith('/app/dashboard/');
    }
    return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
  };

  return (
    <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out select-none ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleNavItems.map((item) => {
          const active = isItemActive(item);
          return (
            <NavLink
              key={item.key}
              to={item.href}
              onClick={onClose}
              className={`group flex items-center px-3.5 py-2 text-sm rounded-lg transition-all duration-150 ${
                active
                  ? 'bg-slate-800 text-white font-semibold border-l-[3.5px] border-indigo-500 shadow-sm shadow-indigo-950/20'
                  : 'text-slate-200 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
            >
              <item.icon 
                className={`w-5 h-5 mr-3 shrink-0 transition-colors ${
                  active 
                    ? 'text-indigo-400 opacity-100' 
                    : 'text-slate-400 group-hover:text-slate-200 opacity-90 group-hover:opacity-100'
                }`} 
              />
              <span className="truncate tracking-normal">{item.name}</span>
              {item.badge > 0 && (
                <span 
                  className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-blue-600 rounded-full shadow-sm"
                  title={`${item.badge} unread notifications`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Executive Footer Section */}
      <div className="shrink-0 p-3.5 border-t border-slate-800 bg-slate-950/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0"></div>
          <p 
            className="text-[13px] text-slate-200 font-semibold truncate" 
            title={user?.organizationUnitName || user?.organization || t('header.unionName', 'Rwanda Union Mission')}
          >
            {user?.organizationUnitName || user?.organization || t('header.unionName', 'Rwanda Union Mission')}
          </p>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 pl-5 font-medium tracking-tight">
          SDA Camp Meeting Management
        </p>
      </div>
    </aside>
  );
}
