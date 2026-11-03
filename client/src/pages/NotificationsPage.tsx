import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  Coins,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api.js';
import { NotificationItem } from '../types/index.js';
import { formatDateTime } from '../utils/formatters.js';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.markNotificationAsRead('all');
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'due_reminder':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'auction':
        return <Coins className="w-5 h-5 text-indigo-600" />;
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A] tracking-tight">
            {t('notifications.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t('notifications.subtitle')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-blue-600 shadow-xs transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" /> {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            {t('common.loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">{t('notifications.emptyNotifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                  !n.isRead ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">{n.message}</p>
                    <span className="inline-block text-[11px] text-slate-400 mt-2 font-mono">
                      {formatDateTime(n.date || n.createdAt)}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-white transition-colors shrink-0"
                    title={t('common.confirm')}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
