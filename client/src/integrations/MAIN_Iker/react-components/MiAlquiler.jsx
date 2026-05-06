import React, { useState, useEffect } from 'react';
import '../assets/css/style.css';

export default function MiAlquiler() {
  const [latestRental, setLatestRental] = useState(null);

  useEffect(() => {
    const loadRentals = async () => {
      const api = window.RentPlayApi;
      let token = localStorage.getItem('rentplayToken');

      if (api && !token) {
        try {
          await api.register({
            username: "UserTest_" + Math.random().toString(36).substr(2, 5),
            email: "test@rentplay.com",
            password: "password123"
          });
          token = localStorage.getItem('rentplayToken');
        } catch (e) {
          // Ya existe
        }
      }

      if (api && token) {
        try {
          const response = await api.getMyRentals();
          if (response?.rentals?.length > 0) {
            setLatestRental(response.rentals[0]);
          }
        } catch (error) {
          console.error('Error BD:', error.message);
        }
      }
    };

    loadRentals();
  }, []);

  return (
    <div className="main-content">
      <h2 className="section-title">MI ALQUILER:</h2>

      <div className="product-container">
        {latestRental ? (
          <>
            <h1 className="product-title">{latestRental.game.toUpperCase()}</h1>
            <div className="rental-details">
              <div className="detail-item">
                <span className="detail-label">TIEMPO RESTANTE</span>
                <span className="detail-value time-left" id="countdown">
                  Calculando...
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">DÍAS CONTRATADOS</span>
                <span className="detail-value">{latestRental.durationDays} DÍAS</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">MÉTODO DE PAGO</span>
                <span className="detail-value">{latestRental.payment}</span>
              </div>
            </div>
          </>
        ) : (
          <p>No tienes ningún alquiler activo cargado de la Base de Datos.</p>
        )}
      </div>
    </div>
  );
}