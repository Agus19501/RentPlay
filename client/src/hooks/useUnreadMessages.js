import { useState, useEffect } from 'react';
import { apiRequest } from '../api.js';

export default function useUnreadMessages(session) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.token) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    async function fetchUnread() {
      try {
        const res = await apiRequest('/api/messages/inbox', { token: session.token });
        if (res.ok && Array.isArray(res.conversations)) {
          const total = res.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          if (!cancelled) setUnreadCount(total);
        }
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // refresca cada 30s
    return () => { cancelled = true; clearInterval(interval); };
  }, [session?.token]);

  return [unreadCount, setUnreadCount];
}
