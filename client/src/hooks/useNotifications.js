import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

const POLL_MS = 60000;

function getNotificationError(err) {
  return err.response?.data?.message || 'Could not load notifications. Please try again.';
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState('');

  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      setUnreadCount(await notificationService.getUnreadCount());
      setNotificationError('');
    } catch (err) {
      setNotificationError(getNotificationError(err));
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setNotifications(await notificationService.getMyNotifications());
      setNotificationError('');
    } catch (err) {
      setNotificationError(getNotificationError(err));
    }
  }, [user]);

  async function markRead(id) {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotificationError('');
    } catch (err) {
      setNotificationError(getNotificationError(err));
    }
  }

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return { notifications, unreadCount, onOpen: loadNotifications, onMarkRead: markRead, notificationError };
}