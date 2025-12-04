'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, X, ExternalLink, Trash2 } from 'lucide-react';
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

    // Subscribe to realtime notifications
    if (userId) {
      unsubscribeRef.current = subscribeToNewNotifications(userId, (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_lead':
        return '🎯';
      case 'agent_contact':
      case 'agent_interested':
        return '👤';
      case 'payment':
        return '💰';
      case 'subscription_expiry':
        return '⏰';
      case 'verification_approved':
        return '✅';
      case 'verification_rejected':
        return '❌';
      case 'system':
        return '⚙️';
      default:
        return '📬';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notif.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notif.title || notif.type}
                        </p>
                        <button
                          onClick={(e) => handleDelete(notif.id, e)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTime(notif.created_at)}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications page if needed
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
