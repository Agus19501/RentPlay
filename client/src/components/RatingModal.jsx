import { useEffect, useMemo, useState } from 'react';
import { FaPaperPlane, FaStar, FaTimes, FaUserCircle } from 'react-icons/fa';
import { apiRequest, getSession } from '../api.js';
import { notify } from '../utils/notify.js';
import './RatingModal.css';

const MAX_COMMENT_LENGTH = 140;
const RATINGS_CACHE_PREFIX = 'rentplay_rating_modal_cache_v1';
const RATINGS_CACHE_TTL_MS = 5 * 60 * 1000;
const ratingsInFlight = new Map();

function getRatingsCacheKey(targetUserId) {
  const session = getSession();
  const viewerId = session?.user?.id || session?.userId || session?.sub || 'guest';
  return `${RATINGS_CACHE_PREFIX}_${targetUserId}_${viewerId}`;
}

function readRatingsCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (cached?.ts && (Date.now() - cached.ts) < RATINGS_CACHE_TTL_MS) {
      return cached;
    }
  } catch {
    return null;
  }

  return null;
}

function writeRatingsCache(key, payload) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), payload }));
  } catch {
    // cache best-effort
  }
}

async function fetchRatingsDeduped(targetUserId, cacheKey, options = {}) {
  if (ratingsInFlight.has(cacheKey)) {
    return ratingsInFlight.get(cacheKey);
  }

  const request = apiRequest(`/api/auth/${targetUserId}/ratings`, options)
    .finally(() => {
      ratingsInFlight.delete(cacheKey);
    });

  ratingsInFlight.set(cacheKey, request);
  return request;
}

function StarRow({ value }) {
  return (
    <span className="rating-modal-stars" aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar key={star} className={star <= Math.round(value) ? 'filled' : 'empty'} />
      ))}
    </span>
  );
}

export default function RatingModal({ isOpen, onClose, targetUserId, targetUserName, lang = 'ES', onRated }) {
  const [ratings, setRatings] = useState([]);
  const [canRate, setCanRate] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const texts = useMemo(() => ({
    ES: {
      title: 'VALORACIONES DE OTROS USUARIOS',
      yourRating: 'TU VALORACION',
      commentPlaceholder: 'Escribe un comentario...',
      send: 'ENVIAR',
      noRatings: 'Aun no hay valoraciones.',
      needComment: 'El comentario es obligatorio.',
      commentMax: `Maximo ${MAX_COMMENT_LENGTH} caracteres.`,
      ratedOk: 'Valoracion enviada correctamente.',
      cantRate: 'Solo puedes valorar a usuarios cuyo juego hayas alquilado.'
    },
    EN: {
      title: 'OTHER USER RATINGS',
      yourRating: 'YOUR RATING',
      commentPlaceholder: 'Write a comment...',
      send: 'SEND',
      noRatings: 'There are no ratings yet.',
      needComment: 'Comment is required.',
      commentMax: `Maximum ${MAX_COMMENT_LENGTH} characters.`,
      ratedOk: 'Rating sent successfully.',
      cantRate: 'You can only rate users whose game you have rented.'
    }
  })[lang] || ({
    title: 'VALORACIONES DE OTROS USUARIOS',
    yourRating: 'TU VALORACION',
    commentPlaceholder: 'Escribe un comentario...',
    send: 'ENVIAR',
    noRatings: 'Aun no hay valoraciones.',
    needComment: 'El comentario es obligatorio.',
    commentMax: `Maximo ${MAX_COMMENT_LENGTH} caracteres.`,
    ratedOk: 'Valoracion enviada correctamente.',
    cantRate: 'Solo puedes valorar a usuarios cuyo juego hayas alquilado.'
  }), [lang]);

  useEffect(() => {
    if (!targetUserId) return;

    let cancelled = false;
    const cacheKey = getRatingsCacheKey(targetUserId);

    const cached = readRatingsCache(cacheKey);
    if (cached?.payload && isOpen) {
      setRatings(cached.payload.ratings || []);
      setCanRate(cached.payload.canRate || false);
      setLoadingRatings(false);
    }

    const shouldFetch = !cached?.payload;
    if (!shouldFetch) {
      return () => {
        cancelled = true;
      };
    }

    async function loadRatings() {
      if (isOpen) {
        setLoadingRatings(true);
      }
      try {
        const response = await fetchRatingsDeduped(targetUserId, cacheKey, { timeoutMs: 5000 });
        if (!cancelled) {
          writeRatingsCache(cacheKey, response);
          if (isOpen) {
            setRatings(response.ratings || []);
            setCanRate(response.canRate || false);
          }
        }
      } catch (error) {
        if (!cancelled && isOpen) {
          setRatings([]);
          if (error.message !== 'Request timeout') {
            notify(error.message || 'Error al cargar valoraciones.', 'error');
          }
        }
      } finally {
        if (!cancelled && isOpen) setLoadingRatings(false);
      }
    }

    loadRatings();
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUserId]);

  const closeAndReset = () => {
    setSelectedRating(0);
    setHoverRating(0);
    setComment('');
    onClose?.();
  };

  const sendRating = async () => {
    const trimmed = comment.trim();
    if (!selectedRating) return;
    if (!trimmed) {
      notify(texts.needComment, 'info');
      return;
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      notify(texts.commentMax, 'info');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiRequest(`/api/auth/${targetUserId}/rate`, {
        method: 'POST',
        body: {
          rating: selectedRating,
          comment: trimmed
        }
      });

      notify(texts.ratedOk, 'success');
      setComment('');
      setSelectedRating(0);
      setHoverRating(0);
      onRated?.({ rating: response.rating, reviews: response.reviews });

      const listResponse = await apiRequest(`/api/auth/${targetUserId}/ratings`, { timeoutMs: 5000 });
      setRatings(listResponse.ratings || []);
      setCanRate(false); // ya valoró, ocultar form
      writeRatingsCache(getRatingsCacheKey(targetUserId), { ...listResponse, canRate: false });
    } catch (error) {
      notify(error.message || 'Error al enviar valoracion.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rating-modal-overlay" onClick={closeAndReset}>
      <section className="rating-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Ratings for ${targetUserName || 'user'}`}>
        <button type="button" className="rating-modal-close" onClick={closeAndReset}>
          <FaTimes />
        </button>

        <h2 className="rating-modal-title">{texts.title}</h2>

        <div className="rating-modal-list">
          {loadingRatings && <p className="rating-modal-empty">...</p>}
          {!loadingRatings && ratings.length === 0 && <p className="rating-modal-empty">{texts.noRatings}</p>}

          {!loadingRatings && ratings.map((item) => (
            <article key={item.id} className="rating-modal-item">
              <div className="rating-modal-item-avatar">
                {item.reviewerAvatar ? (
                  <img
                    src={item.reviewerAvatar.startsWith('data:') || item.reviewerAvatar.startsWith('http') || item.reviewerAvatar.startsWith('/')
                      ? item.reviewerAvatar
                      : `/${item.reviewerAvatar}`}
                    alt={item.reviewerName}
                  />
                ) : (
                  <FaUserCircle />
                )}
              </div>
              <div className="rating-modal-item-content">
                <div className="rating-modal-item-header">
                  <strong>{item.reviewerName}</strong>
                  <StarRow value={item.rating} />
                </div>
                <p>{item.comment}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="rating-modal-separator" />

        <div className="rating-modal-form">
          {!canRate ? (
            <p className="rating-modal-cant-rate">{texts.cantRate}</p>
          ) : (
            <>
              <h3>{texts.yourRating}</h3>
              <div className="rating-modal-input-row">
                <div className="rating-modal-stars-input">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="rating-star-button"
                      onClick={() => setSelectedRating(num)}
                      onMouseEnter={() => setHoverRating(num)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <FaStar className={num <= (hoverRating || selectedRating) ? 'filled' : 'empty'} />
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={comment}
                  onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  placeholder={texts.commentPlaceholder}
                  maxLength={MAX_COMMENT_LENGTH}
                />

                <button type="button" className="rating-modal-submit" onClick={sendRating} disabled={submitting || !selectedRating || !comment.trim()}>
                  <span>{texts.send}</span>
                  <FaPaperPlane />
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
