import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FaPaperPlane, FaSearch, FaUserCircle, FaDotCircle, FaChevronRight } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Mensajes.css';

function formatTime(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export default function Mensajes({ session }) {
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

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const loadInbox = async () => {
      setInboxLoading(true);
      try {
        const [inboxResponse, rentalsResponse] = await Promise.allSettled([
          apiRequest('/api/messages/inbox', { token: session.token }),
          apiRequest('/api/rentals/mine', { token: session.token })
        ]);

        if (inboxResponse.status === 'fulfilled') {
          const list = inboxResponse.value.conversations || [];
          setConversations(list);
          if (list.length > 0) {
            setSelectedId((current) => current || list[0].counterpartId);
          }
        } else {
          setStatus(inboxResponse.reason.message);
        }

        if (rentalsResponse.status === 'fulfilled') {
          setSelectedRental(rentalsResponse.value.rentals?.[0] || null);
        }
      } catch (error) {
        setStatus(error.message);
      } finally {
        setInboxLoading(false);
      }
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
      setStatus(response.message || 'Mensaje enviado');

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

  return (
    <div className="messages-page container">
      <section className="messages-shell">
        <aside className="messages-sidebar">
          <div className="messages-brand">
            <p className="messages-eyebrow">Mensajes</p>
            <h1>Tu bandeja</h1>
            <p>Conversaciones reales sincronizadas con MongoDB Atlas.</p>
          </div>

          <label className="messages-search">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuario por nombre o email"
            />
          </label>

          <div className="messages-list" role="list">
            {inboxLoading && <p className="messages-muted">Cargando conversaciones...</p>}

            {!inboxLoading && conversations.map((conversation) => (
              <button
                key={conversation.counterpartId}
                type="button"
                className={`conversation-item${conversation.counterpartId === selectedId ? ' is-active' : ''}`}
                onClick={() => selectConversation(conversation.counterpartId)}
              >
                <span className="conversation-avatar"><FaUserCircle /></span>
                <span className="conversation-copy">
                  <strong>{conversation.counterpart?.name || 'Usuario'}</strong>
                  <span>{conversation.lastMessage?.text || 'Sin mensajes'}</span>
                </span>
                <span className="conversation-meta">
                  <span>{formatDate(conversation.lastMessage?.createdAt)}</span>
                  {conversation.unreadCount > 0 && <span className="conversation-badge">{conversation.unreadCount}</span>}
                </span>
              </button>
            ))}

            {!inboxLoading && results.length > 0 && (
              <div className="conversation-results">
                <p className="messages-section-label">Resultados</p>
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
                <p>No tienes conversaciones todavía.</p>
                <span>Busca un usuario para iniciar un chat real.</span>
              </div>
            )}

            {searchBusy && <p className="messages-muted">Buscando usuarios...</p>}
          </div>
        </aside>

        <section className="messages-thread">
          <header className="thread-header">
            <div>
              <p className="messages-eyebrow">Chat</p>
              <h2>{counterpart?.name || 'Selecciona una conversación'}</h2>
              <p>{counterpart?.email || 'Usa la barra lateral para abrir o crear un chat.'}</p>
            </div>
            {status && <span className="thread-status">{status}</span>}
          </header>

          <div className="thread-body">
            {threadLoading && <p className="messages-muted">Cargando chat...</p>}

            {!threadLoading && messages.length === 0 && (
              <div className="thread-empty-state">
                <FaDotCircle />
                <p>Sin mensajes en esta conversación.</p>
                <span>Escribe el primer mensaje para arrancar el hilo.</span>
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.senderId === session.user?.id;
              return (
                <article key={message.id} className={`message-bubble${isMine ? ' is-own' : ''}`}>
                  <p>{message.text}</p>
                  <span>{formatTime(message.createdAt)}</span>
                </article>
              );
            })}
          </div>

          <form className="thread-composer" onSubmit={sendMessage}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedId ? 'Escribe un mensaje...' : 'Selecciona un usuario para responder'}
              disabled={!selectedId}
              rows={3}
            />
            <button type="submit" disabled={!selectedId || !draft.trim()}>
              <FaPaperPlane />
            </button>
          </form>
        </section>

        <aside className="messages-context">
          <div className="context-card context-rental">
            <p className="messages-eyebrow">Contexto</p>
            <h3>Alquiler activo</h3>
            {selectedRental ? (
              <>
                <strong>{selectedRental.game?.title || 'Juego'}</strong>
                <p>{selectedRental.game?.price ? `Precio ${selectedRental.game.price}` : 'Precio no disponible'}</p>
                <p>{selectedRental.game?.rentalDays ? `${selectedRental.game.rentalDays} días` : 'Duración no disponible'}</p>
              </>
            ) : (
              <p>No hay un alquiler activo cargado desde Atlas.</p>
            )}
          </div>

          <div className="context-card context-note">
            <p className="messages-eyebrow">Notas</p>
            <h3>Estado del chat</h3>
            <p>Los mensajes salen de MongoDB y puedes iniciar conversaciones buscando usuarios reales.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}