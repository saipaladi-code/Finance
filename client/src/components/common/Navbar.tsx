import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  Bell,
  Search,
  Globe,
  Settings,
  LogOut,
  CheckCheck,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { NotificationItem } from '../../types/index.js';
import { formatDate } from '../../utils/formatters.js';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationAsRead('all');
      setUnreadCount(0);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLanguageChange = (lng: 'en' | 'te') => {
    i18n.changeLanguage(lng);
    setShowLangMenu(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customers?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const currentDate = new Date().toLocaleDateString(i18n.language === 'te' ? 'te-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-4 lg:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-[#F5F7FB] border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </form>

        {/* Date Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-[#F5F7FB] border border-slate-200 rounded-full text-xs font-medium text-slate-600 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Selector (🌐 English / 🌐 తెలుగు) */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            title={t('nav.selectLanguage')}
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>{i18n.language === 'te' ? '🌐 తెలుగు' : '🌐 English'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors ${
                  i18n.language === 'en'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🌐 English</span>
                {i18n.language === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
              </button>
              <button
                onClick={() => handleLanguageChange('te')}
                className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors ${
                  i18n.language === 'te'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🌐 తెలుగు</span>
                {i18n.language === 'te' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title={t('nav.notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 bg-[#F5F7FB] border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{t('nav.notifications')}</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                      {unreadCount} {t('common.pending')}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> {t('notifications.markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    {t('notifications.emptyNotifications')}
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDate(n.date || n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-[#F5F7FB] border-t border-slate-200 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  {t('dashboard.viewAll')} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#142B4A] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-emerald-600 font-medium capitalize">
                {user?.role || 'Admin'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-500" /> {t('nav.settings')}
              </button>
              <button
                onClick={async () => {
                  setShowUserMenu(false);
                  await logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> {t('nav.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
