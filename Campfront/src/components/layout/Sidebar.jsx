import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Users, 
  Building2,
  ClipboardList,
  Home,
  DollarSign,
  QrCode,
  Package,
  Bell,
  Settings,
  Briefcase,
  Brain,
  BarChart3
} from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';

export default function Sidebar() {
  const { user, isAdmin, isCoordinator } = useAuth();
  const { t } = useTranslation();

  const navigation = [
    { name: t('nav.dashboard', 'Dashboard'), key: 'nav.dashboard', href: '/app/dashboard', icon: LayoutDashboard, roles: ['ADMINISTRATOR', 'COORDINATOR', 'PARTICIPANT'] },
    { name: t('nav.proposals', 'Proposals'), key: 'nav.proposals', href: '/app/proposals', icon: FileText, roles: ['ADMINISTRATOR', 'COORDINATOR', 'PARTICIPANT'] },
    { name: t('nav.events', 'Events'), key: 'nav.events', href: '/app/events', icon: Calendar, roles: ['ADMINISTRATOR', 'COORDINATOR', 'PARTICIPANT'] },
    { name: t('nav.registrations', 'Registrations'), key: 'nav.registrations', href: '/app/registrations', icon: ClipboardList, roles: ['ADMINISTRATOR', 'COORDINATOR', 'PARTICIPANT'] },
    { name: t('nav.attendance', 'Attendance'), key: 'nav.attendance', href: '/app/attendance', icon: QrCode, roles: ['ADMINISTRATOR', 'COORDINATOR'] },
    { name: t('nav.accommodation', 'Accommodation'), key: 'nav.accommodation', href: '/app/accommodation', icon: Home, roles: ['ADMINISTRATOR', 'COORDINATOR'] },
    { name: t('nav.payments', 'Payments'), key: 'nav.payments', href: '/app/payments', icon: DollarSign, roles: ['ADMINISTRATOR', 'COORDINATOR'] },
    { name: t('nav.resources', 'Resources'), key: 'nav.resources', href: '/app/resources', icon: Package, roles: ['ADMINISTRATOR', 'COORDINATOR'] },
    { name: t('nav.analytics', 'AI Insights'), key: 'nav.analytics', href: '/app/analytics', icon: Brain, roles: ['ADMINISTRATOR', 'COORDINATOR'] },
    { name: t('nav.organization', 'Organization'), key: 'nav.organization', href: '/app/organization', icon: Building2, roles: ['ADMINISTRATOR'] },
    { name: t('nav.users', 'Users'), key: 'nav.users', href: '/app/users', icon: Users, roles: ['ADMINISTRATOR'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col justify-between z-20">
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3 shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="text-xs text-gray-500 font-medium">{t('common.loggedInAs', 'Logged in as:')}</p>
          <p 
            className="text-xs font-semibold text-gray-900 break-all leading-tight cursor-default" 
            title={user?.email}
          >
            {user?.email || 'N/A'}
          </p>
          <p 
            className="text-xs text-primary-600 font-medium truncate" 
            title={user?.organizationUnitName || user?.organization || 'Rwanda Union Mission'}
          >
            {user?.organizationUnitName || user?.organization || 'Rwanda Union Mission'}
          </p>
        </div>
      </div>
    </aside>
  );
}
