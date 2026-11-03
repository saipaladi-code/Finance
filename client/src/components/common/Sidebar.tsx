import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  Coins,
  BadgeIndianRupee,
  Receipt,
  FileSpreadsheet,
  Bell,
  Settings,
  X,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, logout, businessSettings } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.customers'), path: '/customers', icon: Users },
    { name: t('nav.dailyFinance'), path: '/daily-finance', icon: Calendar },
    { name: t('nav.weeklyFinance'), path: '/weekly-finance', icon: CalendarDays },
    { name: t('nav.chitti'), path: '/chitti', icon: Coins },
    { name: t('nav.collections'), path: '/collections', icon: BadgeIndianRupee },
    { name: t('nav.payments'), path: '/payments', icon: Receipt },
    { name: t('nav.reports'), path: '/reports', icon: FileSpreadsheet },
    { name: t('nav.notifications'), path: '/notifications', icon: Bell },
    { name: t('nav.settings'), path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    if (window.confirm(t('common.confirm') + ': ' + t('nav.signOut') + '?')) {
      await logout();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#142B4A] text-slate-200 flex flex-col border-r border-[#1B375E] transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-4 bg-[#0E1F36] border-b border-[#1B375E]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 font-bold text-xl">
              ₹
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden transition-all duration-300">
                <h1 className="font-bold text-white text-base leading-tight truncate">
                  {businessSettings?.businessName || 'Smart Finance'}
                </h1>
                <p className="text-[11px] text-emerald-400 font-medium tracking-wide flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {t('nav.systemTitle')}
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B375E]"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B375E] transition-colors"
              title={isCollapsed ? t('nav.expanded') : t('nav.collapsed')}
              aria-label="Toggle sidebar collapse"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('nav.mainOperations')}
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'text-slate-200 hover:text-white hover:bg-[#1B375E]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-[#1B375E] bg-[#0E1F36]">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-2 px-1`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-full bg-[#1B375E] border border-blue-500/30 flex items-center justify-center font-bold text-blue-300 text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-emerald-400 capitalize">{user?.role || 'Admin'} {t('nav.adminAccess')}</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title={t('nav.signOut')}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#1B375E] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {isCollapsed && (
            <button
              onClick={handleLogout}
              title={t('nav.signOut')}
              className="w-full flex items-center justify-center py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#1B375E] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {!isCollapsed && (
            <div className="text-[10px] text-slate-400 text-center tracking-tight pt-1">
              Smart Finance v2.0 • Premium Edition
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
