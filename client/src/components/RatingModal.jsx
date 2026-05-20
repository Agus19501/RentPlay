import { useEffect, useMemo, useState } from 'react';
import { FaPaperPlane, FaStar, FaTimes, FaUserCircle } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import { notify } from '../utils/notify.js';
import './RatingModal.css';

const MAX_COMMENT_LENGTH = 140;

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
    if (!isOpen || !targetUserId) return;

    let cancelled = false;
    async function loadRatings() {
      setLoadingRatings(true);
      try {
        const response = await apiRequest(`/api/auth/${targetUserId}/ratings`);
        if (!cancelled) {
          setRatings(response.ratings || []);
          setCanRate(response.canRate || false);
        }
      } catch (error) {
        if (!cancelled) {
          setRatings([]);
          notify(error.message || 'Error al cargar valoraciones.', 'error');
        }
      } finally {
        if (!cancelled) setLoadingRatings(false);
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

      const listResponse = await apiRequest(`/api/auth/${targetUserId}/ratings`);
      setRatings(listResponse.ratings || []);
      setCanRate(false); // ya valoró, ocultar form
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
