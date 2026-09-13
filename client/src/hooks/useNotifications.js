import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';

const POLL_MS = 60000;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      setUnreadCount(await notificationService.getUnreadCount());
    } catch {

    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const list = await notificationService.getMyNotifications();
    setNotifications(list);
  }, [user]);

  async function markRead(id) {
    await notificationService.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return { notifications, unreadCount, onOpen: loadNotifications, onMarkRead: markRead };
}