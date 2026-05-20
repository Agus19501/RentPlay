import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronDown, FaPaperPlane, FaStar, FaUserCircle } from 'react-icons/fa';
import { apiRequest, getSession } from '../api.js';
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
      conversations: 'Conversaciones',
      rental: 'Alquiler',
      days: 'días',
      price: 'Precio'
    },
    EN: {
      loadingChats: 'Loading chats...',
      writeMessage: 'Write a message...',
      selectConversation: 'Select a conversation to start',
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
    async function loadData() {
      if (!session?.token) {
        navigate('/login');
        return;
      }
      try {
        const res = await apiRequest('/api/chats', { token: session.token });
        if (res.ok) {
          setConversations(res.chats || []);
          
          if (!activeChatId && res.chats?.length > 0) {
            setSearchParams({ id: res.chats[0].id });
          }
        }
      } catch (err) {
        console.error("Error loading chat data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [session?.token, activeChatId, setSearchParams, navigate]);

  // Cargar mensajes del chat activo
  useEffect(() => {
    async function loadMessages() {
      if (activeChatId && session?.token) {
        try {
          const res = await apiRequest(`/api/chats/${activeChatId}/messages`, { 
            token: session.token 
          });
          if (res.ok) {
            setMessages(res.messages || []);
          }
        } catch (err) {
          console.error("Error loading messages:", err);
        }
      }
    }
    loadMessages();
    
    // Polling opcional para nuevos mensajes
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
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
      const res = await apiRequest(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        token: session.token,
        body: { text }
      });
      
      if (res.ok) {
        // Solo añadimos el mensaje si no está ya en la lista (evita duplicados por polling)
        setMessages(prev => {
          if (prev.find(m => m.id === res.message.id)) return prev;
          return [...prev, res.message];
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
