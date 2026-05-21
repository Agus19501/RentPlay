import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronDown, FaPaperPlane, FaStar, FaUserCircle } from 'react-icons/fa';
import { apiRequest, clearSession, getSession } from '../api.js';
import cover1 from '../integrations/MAIN_Iker/assets/images/cover1.svg';
import './Chats.css';
import UnreadSyncer from '../hooks/UnreadSyncer.js';

function getMessageDateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMessageDateLabel(value, lang = 'ES') {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (left, right) => left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();

  if (isSameDay(date, today)) {
    return lang === 'EN' ? 'Today' : 'Hoy';
  }

  if (isSameDay(date, yesterday)) {
    return lang === 'EN' ? 'Yesterday' : 'Ayer';
  }

  return date.toLocaleDateString(lang === 'EN' ? 'en-US' : 'es-ES', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric'
  });
}

const CHATS_CACHE_KEY = 'rentplay_chats_cache_v1';
const CHATS_CACHE_TTL_MS = 15000;
const CHAT_MESSAGES_REFRESH_MS = 30000;
const CHAT_THREAD_CACHE_PREFIX = 'rentplay_chat_thread_cache_v1';

function readChatsCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (cached?.ts && Array.isArray(cached.chats) && (Date.now() - cached.ts) < CHATS_CACHE_TTL_MS) {
      return cached.chats;
    }
  } catch {
    return null;
  }

  return null;
}

function readChatsCacheStale(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(cached?.chats)) {
      return cached.chats;
    }
  } catch {
    return null;
  }

  return null;
}

function writeChatsCache(key, chats) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), chats }));
  } catch {
    // cache best-effort
  }
}

function readThreadCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (cached?.ts && Array.isArray(cached.messages) && (Date.now() - cached.ts) < CHATS_CACHE_TTL_MS) {
      return cached.messages;
    }
  } catch {
    return null;
  }

  return null;
}

function writeThreadCache(key, messages) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), messages }));
  } catch {
    // cache best-effort
  }
}

function mergeChatsById(currentChats, incomingChats) {
  if (!Array.isArray(incomingChats) || incomingChats.length === 0) {
    return Array.isArray(currentChats) ? currentChats : [];
  }

  const byId = new Map((Array.isArray(currentChats) ? currentChats : []).map((chat) => [chat.id, chat]));
  for (const chat of incomingChats) {
    const previous = byId.get(chat.id);
    byId.set(chat.id, previous ? { ...previous, ...chat, user: { ...(previous.user || {}), ...(chat.user || {}) }, game: { ...(previous.game || {}), ...(chat.game || {}) } } : chat);
  }

  return Array.from(byId.values()).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

function isUnauthorizedError(error) {
  return Number(error?.status) === 401;
}

function pickBestInitialChatId(chats) {
  if (!Array.isArray(chats) || chats.length === 0) {
    return null;
  }

  const withMessage = chats.find((chat) => String(chat?.lastMessage || '').trim().length > 0);
  return withMessage?.id || chats[0]?.id || null;
}

function toLegacyChat(conversation) {
  const counterpartId = conversation?.counterpartId;
  return {
    id: `legacy-${counterpartId}`,
    counterpartId,
    participants: [],
    gameId: null,
    lastMessage: conversation?.lastMessage?.text || '',
    updatedAt: conversation?.lastMessage?.createdAt || new Date().toISOString(),
    user: {
      id: conversation?.counterpart?.id || counterpartId,
      name: conversation?.counterpart?.name || 'Usuario',
      avatar: null,
      rating: 0
    },
    game: null
  };
}

function isLegacyChatId(chatId) {
  return String(chatId || '').startsWith('legacy-');
}

function getLegacyCounterpartId(chat) {
  if (!chat) {
    return null;
  }

  if (chat.counterpartId) {
    return chat.counterpartId;
  }

  if (isLegacyChatId(chat.id)) {
    return String(chat.id).replace('legacy-', '');
  }

  return chat?.user?.id || null;
}

export default function Chats({ lang }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get('id');
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const session = getSession();
  const currentUserId = session?.userId || session?.user?.id || session?.sub;

  const texts = {
    ES: {
      loadingChats: 'Cargando chats...',
      writeMessage: 'Escribe un mensaje...',
      selectConversation: 'Selecciona una conversación para empezar',
      emptyThread: 'Aun no hay mensajes en esta conversacion',
      conversations: 'Conversaciones',
      rental: 'Alquiler',
      days: 'días',
      price: 'Precio'
    },
    EN: {
      loadingChats: 'Loading chats...',
      writeMessage: 'Write a message...',
      selectConversation: 'Select a conversation to start',
      emptyThread: 'No messages yet in this conversation',
      conversations: 'Conversations',
      rental: 'Rental',
      days: 'days',
      price: 'Price'
    }
  };
  const t = texts[lang] || texts.ES;

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsMobileListOpen(false);
  }, [activeChatId]);

  // Cargar conversaciones desde la API
  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!session?.token) {
        navigate('/login');
        return;
      }

      const userKey = session?.user?.id || session?.userId || session?.sub || 'guest';
      const chatsCacheKey = `${CHATS_CACHE_KEY}_${userKey}`;
      let hydratedFromCache = false;

      try {
        const cachedChats = readChatsCache(chatsCacheKey);
        if (Array.isArray(cachedChats) && cachedChats.length > 0) {
          setConversations(cachedChats);
          hydratedFromCache = true;
          if (!activeChatId) {
            const bestId = pickBestInitialChatId(cachedChats);
            if (bestId) {
              setSearchParams({ id: bestId });
            }
          }
          setLoading(false);
        }
      } catch {
        // Ignore cache parse failures.
      }

      // If fresh cache is not available, allow stale cache so the inbox is never blank.
      if (!hydratedFromCache) {
        const staleChats = readChatsCacheStale(chatsCacheKey);
        if (Array.isArray(staleChats) && staleChats.length > 0) {
          setConversations(staleChats);
          hydratedFromCache = true;
          if (!activeChatId) {
            const bestId = pickBestInitialChatId(staleChats);
            if (bestId) {
              setSearchParams({ id: bestId });
            }
          }
          setLoading(false);
        }
      }

      // Never block the page on a slow network response.
      if (!hydratedFromCache) {
        setLoading(false);
      }

      try {
        // First pass: lightweight payload for instant inbox paint.
        try {
          const compactRes = await apiRequest('/api/chats?compact=1', { token: session.token });
          if (active && compactRes.ok) {
            const compactChats = compactRes.chats || [];
            setConversations((prev) => mergeChatsById(prev, compactChats));

            if (!activeChatId && compactChats.length > 0) {
              const bestId = pickBestInitialChatId(compactChats);
              if (bestId) {
                setSearchParams({ id: bestId });
              }
            }
          }
        } catch (compactErr) {
          if (isUnauthorizedError(compactErr)) {
            clearSession();
            navigate('/login');
            return;
          }

          // Compact fetch is best-effort.
        }

        // Second pass: full payload with user/game enrichment in background (same strategy as Home).
        const res = await apiRequest('/api/chats', { token: session.token });

        if (active && res.ok) {
          const nextChats = res.chats || [];
          if (nextChats.length > 0) {
            setConversations((prev) => mergeChatsById(prev, nextChats));
            writeChatsCache(chatsCacheKey, nextChats);
          } else {
            try {
              const inboxRes = await apiRequest('/api/messages/inbox', { token: session.token });
              if (active && inboxRes?.ok && Array.isArray(inboxRes.conversations) && inboxRes.conversations.length > 0) {
                const legacyChats = inboxRes.conversations.map((conversation) => toLegacyChat(conversation));
                setConversations((prev) => mergeChatsById(prev, legacyChats));
                writeChatsCache(chatsCacheKey, legacyChats);

                if (!activeChatId) {
                  const bestId = pickBestInitialChatId(legacyChats);
                  if (bestId) {
                    setSearchParams({ id: bestId });
                  }
                }
              }
            } catch {
              // Keep UI responsive even if legacy fallback fails.
            }
          }
          
          if (!activeChatId && nextChats.length > 0) {
            const bestId = pickBestInitialChatId(nextChats);
            if (bestId) {
              setSearchParams({ id: bestId });
            }
          }
        }
      } catch (err) {
        if (!active) {
          return;
        }

        if (isUnauthorizedError(err)) {
          clearSession();
          navigate('/login');
          return;
        }

        const message = String(err?.message || '');
        if (message.includes('Failed to fetch')) {
          return;
        }

        console.error("Error loading chat data:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadData();

    return () => {
      active = false;
    };
  }, [session?.token, setSearchParams, navigate]);

  // Cargar mensajes del chat activo
  useEffect(() => {
    let active = true;
    let timerId = null;

    const userKey = session?.user?.id || session?.userId || session?.sub || 'guest';
    const threadCacheKey = `${CHAT_THREAD_CACHE_PREFIX}_${userKey}_${activeChatId}`;

    const cachedThread = readThreadCache(threadCacheKey);
    if (Array.isArray(cachedThread)) {
      setMessages(cachedThread);
    }

    async function loadMessages() {
      if (activeChatId && session?.token) {
        try {
          const currentChat = conversations.find((chat) => chat.id === activeChatId) || null;
          let nextMessages = [];

          if (isLegacyChatId(activeChatId)) {
            const counterpartId = getLegacyCounterpartId(currentChat);
            if (counterpartId) {
              const legacyRes = await apiRequest(`/api/messages/${counterpartId}`, { token: session.token });
              if (legacyRes.ok && Array.isArray(legacyRes.messages)) {
                nextMessages = legacyRes.messages.map((message) => ({
                  id: message.id,
                  text: message.text,
                  senderId: message.senderId,
                  createdAt: message.createdAt
                }));
              }
            }
          } else {
            const res = await apiRequest(`/api/chats/${activeChatId}/messages`, {
              token: session.token
            });
            if (res.ok) {
              nextMessages = res.messages || [];

              // Fallback for legacy threads that store data in /api/messages/:counterpartId.
              if (nextMessages.length === 0) {
                const counterpartId = currentChat?.user?.id || currentChat?.userId || currentChat?.counterpartId;
                if (counterpartId) {
                  try {
                    const legacyRes = await apiRequest(`/api/messages/${counterpartId}`, { token: session.token });
                    if (legacyRes?.ok && Array.isArray(legacyRes.messages) && legacyRes.messages.length > 0) {
                      nextMessages = legacyRes.messages.map((message) => ({
                        id: message.id,
                        text: message.text,
                        senderId: message.senderId,
                        createdAt: message.createdAt
                      }));
                    }
                  } catch {
                    // Best-effort fallback.
                  }
                }
              }
            }
          }

          if (active) {
            setMessages(nextMessages);
            writeThreadCache(threadCacheKey, nextMessages);
          }
        } catch (err) {
          if (!active) {
            return;
          }

          if (isUnauthorizedError(err)) {
            clearSession();
            navigate('/login');
            return;
          }

          const message = String(err?.message || '');
          if (message.includes('Failed to fetch')) {
            return;
          }

          console.error("Error loading messages:", err);
        }
      }

      if (active) {
        timerId = setTimeout(loadMessages, CHAT_MESSAGES_REFRESH_MS);
      }
    }

    if (activeChatId && session?.token) {
      loadMessages();
    }

    return () => {
      active = false;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [activeChatId, session?.token]);

  const activeChat = useMemo(() => {
    return conversations.find(c => c.id === activeChatId) || null;
  }, [conversations, activeChatId]);

  const groupedMessages = useMemo(() => messages.reduce((groups, message) => {
    const dateKey = getMessageDateKey(message.createdAt);
    const lastGroup = groups[groups.length - 1];

    if (!lastGroup || lastGroup.dateKey !== dateKey) {
      groups.push({
        dateKey,
        dateLabel: formatMessageDateLabel(message.createdAt, lang),
        messages: [message]
      });
      return groups;
    }

    lastGroup.messages.push(message);
    return groups;
  }, []), [messages, lang]);

  const openActiveProfile = () => {
    const userId = activeChat?.user?.id || activeChat?.userId || activeChat?.counterpartId;
    if (!userId) return;
    navigate(`/perfil-otro?id=${userId}`);
  };

  const openActiveGame = () => {
    const gameId = activeChat?.game?.id || activeChat?.gameId;
    if (!gameId) return;
    navigate(`/ver-juego/${gameId}`);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !session?.token) return;
    
    const text = newMessage;
    setNewMessage(''); // Limpiar input inmediatamente

    try {
      const currentChat = conversations.find((chat) => chat.id === activeChatId) || null;
      let res;

      if (isLegacyChatId(activeChatId)) {
        const counterpartId = getLegacyCounterpartId(currentChat);
        if (!counterpartId) {
          return;
        }

        res = await apiRequest('/api/messages', {
          method: 'POST',
          token: session.token,
          body: { counterpartId, text }
        });
      } else {
        res = await apiRequest(`/api/chats/${activeChatId}/messages`, {
          method: 'POST',
          token: session.token,
          body: { text }
        });
      }
      
      if (res.ok) {
        const outgoingMessage = res.message || res.conversation;

        // Solo añadimos el mensaje si no está ya en la lista (evita duplicados por polling)
        setMessages(prev => {
          if (!outgoingMessage) return prev;
          if (prev.find(m => m.id === outgoingMessage.id)) return prev;
          return [...prev, outgoingMessage];
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleSelectChat = (chatId) => {
    setSearchParams({ id: chatId });
  };

  if (loading) return <div className="chats-container loading">{t.loadingChats}</div>;

  return (
    <div className="chats-page">
      <UnreadSyncer activeChatId={activeChatId} conversations={conversations} />
      <div className="chats-layout">
        <section className="chats-mobile-switcher" aria-label={t.conversations}>
          <button
            type="button"
            className={`chats-mobile-trigger${isMobileListOpen ? ' is-open' : ''}`}
            onClick={() => setIsMobileListOpen((current) => !current)}
          >
            <span className="chats-mobile-trigger-copy">
              <span className="chats-mobile-label">{t.conversations}</span>
              <span className="chats-mobile-name">{activeChat?.user?.name || t.selectConversation}</span>
              {activeChat?.lastMessage && <span className="chats-mobile-last">{activeChat.lastMessage}</span>}
            </span>
            <FaChevronDown className="chats-mobile-icon" />
          </button>

          {isMobileListOpen && (
            <div className="chats-mobile-list" role="list">
              {conversations.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={`chats-mobile-item${activeChatId === chat.id ? ' is-active' : ''}`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <span className="chat-item-avatar">
                    {chat.user.avatar ? <img src={chat.user.avatar} alt="" /> : <FaUserCircle />}
                  </span>
                  <span className="chat-item-info">
                    <span className="chat-item-name">{chat.user.name}</span>
                    <span className="chat-item-last">{chat.lastMessage}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
        
        {/* Columna Izquierda: Lista de Conversaciones */}
        <aside className="chats-sidebar">
          {conversations.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <div className="chat-item-avatar">
                {chat.user.avatar ? <img src={chat.user.avatar} alt="" /> : <FaUserCircle />}
              </div>
              <div className="chat-item-info">
                <div className="chat-item-name">{chat.user.name}</div>
                <div className="chat-item-last">{chat.lastMessage}</div>
              </div>
            </div>
          ))}
        </aside>

        {/* Columna Central: Chat */}
        <main className="chat-main">
          {activeChat ? (
            <>
              <header className="chat-header">
                <div 
                  className="chat-header-user" 
                  onClick={openActiveProfile}
                  onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && openActiveProfile()}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="user-avatar">
                    {activeChat.user.avatar ? <img src={activeChat.user.avatar} alt="" /> : <FaUserCircle />}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{activeChat.user.name}</span>
                    <div className="user-rating">
                      {[1, 2, 3, 4, 5].map(s => (
                        <FaStar key={s} className={s <= Math.floor(activeChat.user.rating) ? 'star-filled' : 'star-empty'} />
                      ))}
                      <span className="rating-text">{activeChat.user.rating}</span>
                    </div>
                  </div>
                </div>
              </header>

              <div className="chat-messages">
                {groupedMessages.length === 0 && (
                  <div className="no-chat-selected">{t.emptyThread}</div>
                )}
                {groupedMessages.map((group) => (
                  <React.Fragment key={group.dateKey}>
                    <div className="chat-date-separator">
                      <span>{group.dateLabel}</span>
                    </div>
                    {group.messages.map((msg) => (
                      <div key={msg.id} className={`message-bubble-wrapper ${String(msg.senderId) === String(currentUserId) ? 'sent' : 'received'}`}>
                        <div className="message-bubble">
                          <div className="message-text">{msg.text}</div>
                          <div className="message-meta">
                            <span className="message-time">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            </span>
                            {String(msg.senderId) === String(currentUserId) && <span className="message-status">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    placeholder={t.writeMessage}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="send-btn">
                    <FaPaperPlane />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">{t.selectConversation}</div>
          )}
        </main>

        {/* Columna Derecha: Info del Juego */}
        <aside className="chat-game-info">
          {activeChat && (
            <div className="game-card-mini" onClick={openActiveGame} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && openActiveGame()} role="button" tabIndex={0} style={{ cursor: activeChat?.game?.id || activeChat?.gameId ? 'pointer' : 'default' }}>
              <div className="game-card-image">
                {activeChat.game?.image ? (
                  <img src={activeChat.game.image.startsWith('data:') || activeChat.game.image.startsWith('http') || activeChat.game.image.startsWith('/') ? activeChat.game.image : `/${activeChat.game.image}`} alt={activeChat.game.title} />
                ) : (
                  <div className="image-placeholder"><img src={cover1} alt="game" /></div>
                )}
              </div>
              <div className="game-card-copy">
                <h3 className="game-card-title">{activeChat.game?.title}</h3>
                <div className="game-card-details">
                  <div className="game-detail-row">
                    <span className="label">{t.rental}</span>
                    <span className="value highlight">{activeChat.game?.rentalDays} {t.days}</span>
                  </div>
                  <div className="game-detail-row">
                    <span className="label">{t.price}</span>
                    <span className="value highlight">{typeof activeChat.game?.price === 'number' ? activeChat.game.price.toFixed(2) : activeChat.game?.price} €</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
