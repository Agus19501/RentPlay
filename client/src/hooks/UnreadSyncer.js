import { useEffect } from 'react';
import useUnreadMessages from '../hooks/useUnreadMessages.js';
import { getSession } from '../api.js';

export default function UnreadSyncer({ activeChatId, conversations }) {
  const session = getSession();
  const [, setUnreadCount] = useUnreadMessages(session);

  useEffect(() => {
    if (!session?.token || !activeChatId || !conversations?.length) return;
    // Marcar como leídos los mensajes de este chat
    const chat = conversations.find(c => c.id === activeChatId);
    if (!chat || !chat.unreadCount) return;
    // Aquí deberías llamar a la API para marcar como leídos
    fetch(`/api/chats/${activeChatId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      }
    }).then(() => {
      setUnreadCount(prev => prev - chat.unreadCount);
    });
  }, [activeChatId, conversations, session, setUnreadCount]);

  return null;
}
