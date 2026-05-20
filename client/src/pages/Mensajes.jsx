import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaSearch, FaUserCircle, FaDotCircle, FaChevronRight } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Mensajes.css';

function formatTime(value, lang = 'ES') {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleTimeString(lang === 'EN' ? 'en-US' : 'es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value, lang = 'ES') {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString(lang === 'EN' ? 'en-US' : 'es-ES', { day: '2-digit', month: 'short' });
}

function groupMessagesByDate(messageList, lang = 'ES') {
  return messageList.reduce((groups, message) => {
    const dateLabel = formatDate(message.createdAt, lang);
    const lastGroup = groups[groups.length - 1];

    if (!lastGroup || lastGroup.dateLabel !== dateLabel) {
      groups.push({
        dateLabel,
        messages: [message]
      });
      return groups;
    }

    lastGroup.messages.push(message);
    return groups;
  }, []);
}

export default function Mensajes({ session, lang = 'ES' }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [counterpart, setCounterpart] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [inboxLoading, setInboxLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedRental, setSelectedRental] = useState(null);

  const texts = {
    ES: {
      loginToView: 'Inicia sesión para ver tus mensajes.',
      brand: 'Mensajes',
      inbox: 'Tu bandeja',
      startChatHint: 'Selecciona una conversación para empezar a chatear.',
      searchPlaceholder: 'Buscar usuario por nombre o email',
      loadingConversations: 'Cargando conversaciones...',
      userFallback: 'Usuario',
      noMessages: 'Sin mensajes',
      results: 'Resultados',
      noConversations: 'No tienes conversaciones todavía.',
      searchUserHint: 'Busca un usuario para iniciar un chat real.',
      searchingUsers: 'Buscando usuarios...',
      chat: 'Chat',
      selectConversation: 'Selecciona una conversación',
      sidebarHint: 'Usa la barra lateral para abrir o crear un chat.',
      loadingChat: 'Cargando chat...',
      emptyConversation: 'Sin mensajes en esta conversación.',
      writeFirstMessage: 'Escribe el primer mensaje para arrancar el hilo.',
      writeMessage: 'Escribe un mensaje...',
      selectUserToReply: 'Selecciona un usuario para responder',
      context: 'Contexto',
      activeRental: 'Alquiler activo',
      gameFallback: 'Juego',
      price: 'Precio',
      noPrice: 'Precio no disponible',
      durationUnavailable: 'Duración no disponible',
      noActiveRental: 'No hay alquiler activo.',
      notes: 'Notas',
      chatStatus: 'Estado del chat',
      chatStatusHint: 'Mantén conversaciones con otros usuarios sobre alquileres.',
      sent: 'Mensaje enviado'
    },
    EN: {
      loginToView: 'Log in to view your messages.',
      brand: 'Messages',
      inbox: 'Your inbox',
      startChatHint: 'Select a conversation to start chatting.',
      searchPlaceholder: 'Search user by name or email',
      loadingConversations: 'Loading conversations...',
      userFallback: 'User',
      noMessages: 'No messages',
      results: 'Results',
      noConversations: 'You have no conversations yet.',
      searchUserHint: 'Search a user to start a real chat.',
      searchingUsers: 'Searching users...',
      chat: 'Chat',
      selectConversation: 'Select a conversation',
      sidebarHint: 'Use the sidebar to open or create a chat.',
      loadingChat: 'Loading chat...',
      emptyConversation: 'No messages in this conversation.',
      writeFirstMessage: 'Write the first message to start the thread.',
      writeMessage: 'Write a message...',
      selectUserToReply: 'Select a user to reply',
      context: 'Context',
      activeRental: 'Active rental',
      gameFallback: 'Game',
      price: 'Price',
      noPrice: 'Price unavailable',
      durationUnavailable: 'Duration unavailable',
      noActiveRental: 'No active rental.',
      notes: 'Notes',
      chatStatus: 'Chat status',
      chatStatusHint: 'Keep conversations with other users about rentals.',
      sent: 'Message sent'
    }
  };
  const t = texts[lang] || texts.ES;

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const loadInbox = async () => {
      setInboxLoading(true);
      try {
        const inboxResponse = await apiRequest('/api/messages/inbox', { token: session.token });
        const list = inboxResponse.conversations || [];
        setConversations(list);
        if (list.length > 0) {
          setSelectedId((current) => current || list[0].counterpartId);
        }
      } catch (error) {
        setStatus(error.message);
      } finally {
        setInboxLoading(false);
      }

      // Cargar contexto de alquileres en paralelo, sin bloquear bandeja
      apiRequest('/api/rentals/mine', { token: session.token })
        .then((rentalsResponse) => {
          setSelectedRental(rentalsResponse.rentals?.[0] || null);
        })
        .catch(() => {
          setSelectedRental(null);
        });
    };

    loadInbox();
  }, [session]);

  useEffect(() => {
    if (!session?.token || !selectedId) {
      setMessages([]);
      setCounterpart(null);
      return;
    }

    const loadThread = async () => {
      setThreadLoading(true);
      try {
        const response = await apiRequest(`/api/messages/${selectedId}`, { token: session.token });
        setCounterpart(response.counterpart || null);
        setMessages(response.messages || []);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setThreadLoading(false);
      }
    };

    loadThread();
  }, [session, selectedId]);

  useEffect(() => {
    if (!session?.token) {
      setResults([]);
      return;
    }

    const query = search.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }

    let active = true;
    setSearchBusy(true);

    const timer = setTimeout(async () => {
      try {
        const response = await apiRequest(`/api/messages/users/search?query=${encodeURIComponent(query)}`, { token: session.token });
        if (active) {
          setResults(response.users || []);
        }
      } catch (error) {
        if (active) {
          setStatus(error.message);
        }
      } finally {
        if (active) {
          setSearchBusy(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, session]);

  const selectConversation = (counterpartId) => {
    setSelectedId(counterpartId);
    setSearch('');
    setResults([]);
  };

  const startConversation = (user) => {
    setSelectedId(user.id);
    setCounterpart(user);
    setMessages([]);
    setSearch('');
    setResults([]);
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    const trimmedDraft = draft.trim();
    if (!trimmedDraft || !selectedId) {
      return;
    }

    try {
      const response = await apiRequest('/api/messages', {
        method: 'POST',
        token: session.token,
        body: {
          counterpartId: selectedId,
          text: trimmedDraft
        }
      });

      setDraft('');
      setStatus(response.message || t.sent);

      const refreshedThread = await apiRequest(`/api/messages/${selectedId}`, { token: session.token });
      setCounterpart(refreshedThread.counterpart || counterpart);
      setMessages(refreshedThread.messages || []);

      const refreshedInbox = await apiRequest('/api/messages/inbox', { token: session.token });
      setConversations(refreshedInbox.conversations || []);
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const openCounterpartProfile = () => {
    if (!selectedId) return;
    navigate(`/perfil-otro?id=${selectedId}`);
  };

  const openRentalGame = () => {
    const gameId = selectedRental?.game?.id || selectedRental?.gameId;
    if (!gameId) return;
    navigate(`/ver-juego/${gameId}`);
  };

  const groupedMessages = groupMessagesByDate(messages, lang);

  return (
    <div className="messages-page container">
      <section className="messages-shell">
        <aside className="messages-sidebar">
          <div className="messages-brand">
            <p className="messages-eyebrow">{t.brand}</p>
            <h1>{t.inbox}</h1>
            <p>{t.startChatHint}</p>
          </div>

          <label className="messages-search">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </label>

          <div className="messages-list" role="list">
            {inboxLoading && <p className="messages-muted">{t.loadingConversations}</p>}

            {!inboxLoading && conversations.map((conversation) => (
              <button
                key={conversation.counterpartId}
                type="button"
                className={`conversation-item${conversation.counterpartId === selectedId ? ' is-active' : ''}`}
                onClick={() => selectConversation(conversation.counterpartId)}
              >
                <span className="conversation-avatar"><FaUserCircle /></span>
                <span className="conversation-copy">
                  <strong>{conversation.counterpart?.name || t.userFallback}</strong>
                  <span>{conversation.lastMessage?.text || t.noMessages}</span>
                </span>
                <span className="conversation-meta">
                  <span>{formatDate(conversation.lastMessage?.createdAt, lang)}</span>
                  {conversation.unreadCount > 0 && <span className="conversation-badge">{conversation.unreadCount}</span>}
                </span>
              </button>
            ))}

            {!inboxLoading && results.length > 0 && (
              <div className="conversation-results">
                <p className="messages-section-label">{t.results}</p>
                {results.map((user) => (
                  <button key={user.id} type="button" className="conversation-item result-item" onClick={() => startConversation(user)}>
                    <span className="conversation-avatar"><FaUserCircle /></span>
                    <span className="conversation-copy">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </span>
                    <FaChevronRight />
                  </button>
                ))}
              </div>
            )}

            {!inboxLoading && conversations.length === 0 && results.length === 0 && (
              <div className="messages-empty-search">
                <FaPaperPlane />
                <p>{t.noConversations}</p>
                <span>{t.searchUserHint}</span>
              </div>
            )}

            {searchBusy && <p className="messages-muted">{t.searchingUsers}</p>}
          </div>
        </aside>

        <section className="messages-thread">
          <header className="thread-header">
            <div onClick={openCounterpartProfile} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && openCounterpartProfile()} role={selectedId ? 'button' : undefined} tabIndex={selectedId ? 0 : undefined} style={{ cursor: selectedId ? 'pointer' : 'default' }}>
              <p className="messages-eyebrow">{t.chat}</p>
              <h2>{counterpart?.name || t.selectConversation}</h2>
              <p>{counterpart?.email || t.sidebarHint}</p>
            </div>
            {status && <span className="thread-status">{status}</span>}
          </header>

          <div className="thread-body">
            {threadLoading && <p className="messages-muted">{t.loadingChat}</p>}

            {!threadLoading && messages.length === 0 && (
              <div className="thread-empty-state">
                <FaDotCircle />
                <p>{t.emptyConversation}</p>
                <span>{t.writeFirstMessage}</span>
              </div>
            )}

            {groupedMessages.map((group) => (
              <div key={group.dateLabel} className="message-date-group">
                <div className="message-date-header">{group.dateLabel}</div>
                {group.messages.map((message) => {
                  const isMine = message.senderId === session.user?.id;
                  return (
                    <article key={message.id} className={`message-bubble${isMine ? ' is-own' : ''}`}>
                      <p>{message.text}</p>
                      <span>{formatTime(message.createdAt, lang)}</span>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>

          <form className="thread-composer" onSubmit={sendMessage}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedId ? t.writeMessage : t.selectUserToReply}
              disabled={!selectedId}
              rows={3}
            />
            <button type="submit" disabled={!selectedId || !draft.trim()}>
              <FaPaperPlane />
            </button>
          </form>
        </section>

        <aside className="messages-context">
          <div className="context-card context-rental" onClick={openRentalGame} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && openRentalGame()} role={selectedRental?.game?.id || selectedRental?.gameId ? 'button' : undefined} tabIndex={selectedRental?.game?.id || selectedRental?.gameId ? 0 : undefined} style={{ cursor: selectedRental?.game?.id || selectedRental?.gameId ? 'pointer' : 'default' }}>
            <p className="messages-eyebrow">{t.context}</p>
            <h3>{t.activeRental}</h3>
            {selectedRental ? (
              <>
                <strong>{selectedRental.game?.title || t.gameFallback}</strong>
                <p>{selectedRental.game?.price ? `${t.price} ${selectedRental.game.price}` : t.noPrice}</p>
                <p>{selectedRental.game?.rentalDays ? `${selectedRental.game.rentalDays} ${lang === 'EN' ? 'days' : 'días'}` : t.durationUnavailable}</p>
              </>
            ) : (
              <p>{t.noActiveRental}</p>
            )}
          </div>

          <div className="context-card context-note">
            <p className="messages-eyebrow">{t.notes}</p>
            <h3>{t.chatStatus}</h3>
            <p>{t.chatStatusHint}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}