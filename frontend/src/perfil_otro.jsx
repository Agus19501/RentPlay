import React, { useEffect, useState } from 'react';
import './perfil_otro.css';

const usuarioOtroFallback = {
  apodo: 'Pepe_gom01',
  nombre: 'Pepe Gómez García',
  fechaUnion: '5 de Agosto de 2001',
  rating: 4.1,
  avatar: '🐶',
  juegosSubidos: 4
};

export default function PerfilOtro() {
  const [usuarioOtro, setUsuarioOtro] = useState(usuarioOtroFallback);

  useEffect(() => {
    async function cargarOtro() {
      try {
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email');
        if (!email) return; // fallback to static

        const body = new URLSearchParams({ email });
        const res = await fetch('/.netlify/functions/getUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body
        });
        const data = await res.json();
        if (data.ok && data.user) {
          setUsuarioOtro((prev) => ({
            apodo: data.user.apodo || data.user.name || prev.apodo,
            nombre: data.user.name || prev.nombre,
            fechaUnion: data.user.created_at || prev.fechaUnion,
            rating: data.user.rating || prev.rating,
            avatar: prev.avatar,
            juegosSubidos: data.user.juegosSubidos || prev.juegosSubidos
          }));
        }
      } catch (e) {
        console.error('Error cargando perfil otro:', e);
      }
    }

    cargarOtro();
  }, []);
  return (
    <div className="perfil-otro-page">
      <section className="perfil-otro-shell">
        <aside className="otro-left">
          <div className="otro-stack">
            <div className="otro-avatar">{usuarioOtro.avatar}</div>

            <h2 className="otro-apodo">{usuarioOtro.apodo}</h2>

            <div className="otro-rating">
              <span className="otro-stars">★★★★☆</span>
              <span className="otro-rating-value">{usuarioOtro.rating}</span>
            </div>

            <button className="btn-valorar" type="button">Valorar</button>

            <div className="otro-joined">Se unió el {usuarioOtro.fechaUnion}</div>

            <button className="btn-contactar" type="button">Contactar</button>
          </div>
        </aside>

        <section className="otro-right">
          <div className="otro-right-header">
            <h3 className="otro-right-title">JUEGOS PUESTOS EN ALQUILER</h3>
            <div className="otro-right-count">{usuarioOtro.juegosSubidos} JUEGOS SUBIDOS</div>
          </div>
          <div className="otro-right-body">
            <div className="perfil-games-grid">
              {/* If usuarioOtro has juegosSubidos data, render placeholders; otherwise keep a small sample */}
              {(usuarioOtro.juegosSubidos && usuarioOtro.juegosSubidos > 0)
                ? Array.from({ length: usuarioOtro.juegosSubidos }).map((_, i) => (
                  <article key={i} className="juego-card">
                    <div className={`juego-cover cover-vice-city`}>
                      <span className="juego-cover-text">J{i + 1}</span>
                    </div>
                  </article>
                ))
                : [
                  { id: 1, cover: 'VC', className: 'cover-vice-city' },
                  { id: 2, cover: 'TR', className: 'cover-terraria' },
                  { id: 3, cover: 'SV', className: 'cover-stardew' },
                  { id: 4, cover: 'DS', className: 'cover-dark-souls' }
                ].map((j) => (
                  <article key={j.id} className="juego-card">
                    <div className={`juego-cover ${j.className}`}>
                      <span className="juego-cover-text">{j.cover}</span>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
