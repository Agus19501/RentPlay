import React, { useState, useEffect } from 'react';
import '../assets/css/style.css';

export default function VerJuego() {
  const [isRentalModalOpen, setRentalModalOpen] = useState(false);
  const [isRatingModalOpen, setRatingModalOpen] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  
  const [dbRatings, setDbRatings] = useState([]);
  const sellerName = "Alba_222";

  useEffect(() => {
    if (isRatingModalOpen && window.RentPlayApi) {
      window.RentPlayApi.getSellerRatings(sellerName)
        .then(res => {
          if (res && res.ratings) setDbRatings(res.ratings);
        })
        .catch(err => console.warn("Error BD Modal:", err));
    }
  }, [isRatingModalOpen]);

  const handleConfirmRental = async () => {
    const rentalData = {
      game: "Grand Theft Auto: Vice City",
      price: "19.99",
      payment: paymentMethod,
      durationDays: 6
    };

    if (window.RentPlayApi) {
      try {
        await window.RentPlayApi.createRental(rentalData);
        alert('¡Alquiler confirmado y guardado en BD!');
      } catch (error) {
        console.warn("Backend:", error.message);
      }
    }
    setRentalModalOpen(false);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert('⚠️ Por favor selecciona una puntuación');
      return;
    }

    if (window.RentPlayApi) {
      try {
        await window.RentPlayApi.createRating({
          toSeller: "Alba_222",
          score: rating,
          comment: comment
        });
        alert('Valoración guardada en BD');
      } catch (error) {
        console.warn("Error BD:", error.message);
      }
    }
    setRatingModalOpen(false);
  };

  return (
    <div className="product-container">
      <h1 className="product-title">GRAND THEFT AUTO: VICE CITY</h1>
      
      <button 
        className="btn-rent" 
        onClick={() => setRentalModalOpen(true)}
      >
        ALQUILAR
      </button>

      <button 
        className="btn-valorar" 
        onClick={() => setRatingModalOpen(true)}
      >
        VALORAR
      </button>

      {(isRentalModalOpen || isRatingModalOpen) && (
        <div 
          className="modal-overlay active" 
          onClick={() => {
            setRentalModalOpen(false);
            setRatingModalOpen(false);
          }}
        />
      )}

      {isRentalModalOpen && (
        <div className="modal active" id="modal-rental">
          <div className="modal-content">
            <span className="modal-close" onClick={() => setRentalModalOpen(false)}>&times;</span>
            <h2>CONFIRMAR ALQUILER</h2>
            <div className="payment-methods">
              <label>
                <input type="radio" value="paypal" checked={paymentMethod === 'paypal'} onChange={(e) => setPaymentMethod(e.target.value)} /> PayPal
              </label>
              <label>
                <input type="radio" value="credit-card" checked={paymentMethod === 'credit-card'} onChange={(e) => setPaymentMethod(e.target.value)} /> Tarjeta
              </label>
            </div>
            <button className="btn-rent" onClick={handleConfirmRental}>CONFIRMAR PAGO</button>
          </div>
        </div>
      )}

      {isRatingModalOpen && (
        <div className="modal active" id="modal-ratings">
          <div className="modal-content">
             <span className="modal-close" onClick={() => setRatingModalOpen(false)}>&times;</span>
             <h3>TU VALORACIÓN</h3>
             <input 
               type="text" 
               className="rating-comment-input" 
               placeholder="Escribe un comentario..."
               value={comment}
               onChange={(e) => setComment(e.target.value)} 
             />
             <input 
               type="number" 
               min="1" max="5" 
               placeholder="Nota (1-5)"
               value={rating}
               onChange={(e) => setRating(Number(e.target.value))} 
             />
             <button className="btn-submit-rating" onClick={handleSubmitRating}>ENVIAR</button>
          </div>
        </div>
      )}
    </div>
  );
}