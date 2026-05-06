import { FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Sobre RentPlay</h3>
          <ul>
            <li><a href="#">Acerca de Nosotros</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Carreras</a></li>
            <li><a href="#">Prensa</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Ayuda</h3>
          <ul>
            <li><a href="#">Centro de Ayuda</a></li>
            <li><a href="#">Preguntas Frecuentes</a></li>
            <li><a href="#">Contacto</a></li>
            <li><a href="#">Reporte de Problemas</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li><a href="#">Términos de Servicio</a></li>
            <li><a href="#">Privacidad</a></li>
            <li><a href="#">Cookies</a></li>
            <li><a href="#">Aviso Legal</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Redes Sociales</h3>
          <ul>
            <li><a href="#"><FaFacebook /> Facebook</a></li>
            <li><a href="#"><FaTwitter /> Twitter</a></li>
            <li><a href="#"><FaInstagram /> Instagram</a></li>
            <li><a href="#"><FaYoutube /> YouTube</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 - Módulo de Alquiler de Videojuegos (Trabajo Grupal). Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
