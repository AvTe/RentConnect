'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, X, ExternalLink, Trash2, ArrowRight, Info, ShieldCheck, AlertTriangle, MessageSquare, UserPlus, HelpCircle } from 'lucide-react';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  subscribeToNewNotifications,
  deleteNotification
} from '@/lib/database';

export const NotificationBell = ({ userId, onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [notifsResult, countResult] = await Promise.all([
        getUserNotifications(userId, { limit: 20 }),
        getUnreadNotificationCount(userId)
      ]);

      if (notifsResult.success) {
        setNotifications(notifsResult.data);
      }
      if (countResult.success) {
        setUnreadCount(countResult.count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch and subscribe to realtime
  useEffect(() => {
    fetchNotifications();

    if (userId) {
      // Request permission for push notifications
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      unsubscribeRef.current = subscribeToNewNotifications(userId, (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);

        if (Notification.permission === 'granted') {
          new Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/logo.png'
          });
        }
      });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId, fetchNotifications]);

  // Close on outside click (desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Lock scroll when open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleMarkAsRead = async (notifId) => {
    const result = await markNotificationRead(notifId);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsRead(userId);
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleDelete = async (notifId, e) => {
    e.stopPropagation();
    const result = await deleteNotification(notifId);
    if (result.success) {
      const notif = notifications.find(n => n.id === notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      if (!notif?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notif);
    }
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'new_lead':
        return { icon: <ArrowRight className="w-4 h-4" />, bg: 'bg-orange-50', color: 'text-orange-600', border: 'border-orange-100' };
      case 'verification_approved':
        return { icon: <ShieldCheck className="w-4 h-4" />, bg: 'bg-green-50', color: 'text-green-600', border: 'border-green-100' };
      case 'verification_rejected':
        return { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-red-50', color: 'text-red-600', border: 'border-red-100' };
      case 'new_inquiry':
        return { icon: <MessageSquare className="w-4 h-4" />, bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100' };
      case 'connection_request':
        return { icon: <UserPlus className="w-4 h-4" />, bg: 'bg-indigo-50', color: 'text-indigo-600', border: 'border-indigo-100' };
      case 'support':
        return { icon: <HelpCircle className="w-4 h-4" />, bg: 'bg-slate-50', color: 'text-slate-600', border: 'border-slate-100' };
      case 'subscription_expiry':
        return { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100' };
      default:
        return { icon: <Info className="w-4 h-4" />, bg: 'bg-slate-50', color: 'text-slate-600', border: 'border-slate-100' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 rounded-2xl transition-all duration-200"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-none' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#FE9200] text-white text-[10px] rounded-full flex items-center justify-center font-black border-2 border-white ring-1 ring-orange-100 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Portal-like Overlay/Drawer */}
      {isOpen && (
        <>
          {/* Backdrop for Mobile */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] md:hidden animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className={`
            fixed inset-x-0 bottom-0 md:absolute md:top-full md:bottom-auto md:right-0 md:inset-x-auto
            w-full md:w-[400px] h-[80vh] md:h-auto max-h-[85vh] md:max-h-[600px]
            bg-white md:rounded-3xl rounded-t-[40px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.2)] md:border border-t border-slate-200 
            z-[100] overflow-hidden flex flex-col md:mt-3
            animate-in slide-in-from-bottom-20 md:slide-in-from-top-4 duration-500 ease-out
          `}>
            {/* Header */}
            <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {unreadCount} Unread Message{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 md:hidden"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
              {loading && notifications.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-[#FE9200] rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Feed...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-20 text-center opacity-40">
                  <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">Quiet for now</h4>
                  <p className="text-sm font-medium text-slate-500 mt-2">New leads and alerts will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {notifications.map((notif) => {
                    const styles = getNotificationStyles(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`group relative p-5 rounded-[24px] transition-all duration-300 cursor-pointer overflow-hidden border ${!notif.read
                          ? 'bg-white border-[#FE9200]/10 shadow-lg shadow-[#FE9200]/5'
                          : 'bg-slate-50 border-transparent opacity-80'
                          } hover:border-slate-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`}
                      >
                        {!notif.read && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#FE9200]" />
                        )}

                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-2xl ${styles.bg} ${styles.color} flex items-center justify-center flex-shrink-0 border ${styles.border}`}>
                            {styles.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`text-[15px] font-black leading-tight tracking-tight ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                {notif.title}
                              </h4>
                              <button
                                onClick={(e) => handleDelete(notif.id, e)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {formatTime(notif.created_at)}
                              </span>
                              {!notif.read && (
                                <div className="w-1.5 h-1.5 bg-[#FE9200] rounded-full animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Close/Actions Footer */}
            <div className="hidden md:flex p-6 bg-slate-50 border-t border-slate-100 items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Alerts Active</p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-black text-slate-900 hover:text-[#FE9200] transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
