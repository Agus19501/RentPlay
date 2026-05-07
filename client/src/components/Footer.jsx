import React from 'react';
import { FaPhone, FaEnvelope, FaInstagram, FaTwitter, FaFacebook, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = ({ lang }) => {
  const translations = {
    ES: {
      about: "¿Quiénes somos?",
      desc: "RentPlay es un proyecto nacido de la pasión de un par de estudiantes universitarios que queríamos aportar algo nuevo al mundo del videojuego. Nuestra idea es crear un espacio donde los jugadores puedan compartir y disfrutar de sus títulos favoritos de forma sencilla, fomentando una comunidad más colaborativa y accesible para todos.",
      contact: "Contacto",
      follow: "Síguenos",
      rights: "Proyecto creado por estudiantes universitarios."
    },
    EN: {
      about: "About Us",
      desc: "RentPlay is a project born from the passion of a couple of university students who wanted to bring something new to the gaming world. Our idea is to create a space where players can share and enjoy their favorite titles easily, fostering a more collaborative and accessible community for everyone.",
      contact: "Contact",
      follow: "Follow Us",
      rights: "Project created by university students."
    }
  };

  const t = translations[lang];

  return (
    <footer className="main-footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-section about">
          <h3>{t.about}</h3>
          <p>{t.desc}</p>
        </div>
        
        <div className="footer-section contact">
          <h4>{t.contact}</h4>
          <div className="contact-links-container">
            <a href="tel:+34965903400" aria-label="Llamar por teléfono">
              <FaPhone className="contact-icon" /> +34 965 90 34 00
            </a>
            <a href="mailto:contacto@rentplay.com" aria-label="Enviar correo electrónico">
              <FaEnvelope className="contact-icon" /> contacto@rentplay.com
            </a>
          </div>
        </div>

        <div className="footer-section social">
          <h4>{t.follow}</h4>
          <div className="social-grid">
            <a href="https://instagram.com" aria-label="Instagram"><FaInstagram /></a>
            <a href="https://facebook.com" aria-label="Facebook"><FaFacebook /></a>
            <a href="https://twitter.com" aria-label="Twitter"><FaTwitter /></a>
            <a href="https://youtube.com" aria-label="YouTube"><FaYoutube /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 RentPlay. {t.rights}</p>
      </div>
    </footer>
  );
};

export default Footer;