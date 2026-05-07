import React from 'react';
import { gamesData } from '../data/games';
import './GameGrid.css';

const GameGrid = () => {
  return (
    <section className="games-section">
      <div className="section-header">
        <h2 className="section-title">NUEVOS JUEGOS</h2>
        <p className="section-subtitle">Echa un vistazo a los últimos juegos añadidos a rentplay</p>
      </div>
      
      <div className="games-grid">
        {gamesData.map((game) => (
          <div key={game.id} className="game-card">
            <div className="image-container">
              <img src={game.image} alt={`Portada de ${game.title}`} className="game-image" />
              <div className="hover-overlay">
                <span className="view-more">Ver detalles</span>
              </div>
            </div>
            <h3 className="game-title">{game.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GameGrid;