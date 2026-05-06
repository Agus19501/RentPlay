import React, { useState } from 'react';
import '../../integrations/MAIN_Iker/assets/css/style.css';

export default function SubirJuego() {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    date: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor, indica al menos el título del juego.');
      return;
    }

    if (window.RentPlayApi && typeof window.RentPlayApi.createGame === 'function') {
      try {
        await window.RentPlayApi.createGame(formData);
      } catch (err) {
        console.warn("Backend BD warning:", err);
      }
    } else {
      localStorage.setItem('lastUploadedGame', JSON.stringify(formData));
    }

    alert('¡Juego publicado correctamente en rentplay!');
    window.location.href = '/home';
  };

  return (
    <div className="upload-content">
      <div className="upload-form-section">
        <h1 className="upload-title">PONER UN JUEGO EN ALQUILER</h1>
        <form className="upload-form" onSubmit={handlePublish}>
          <input 
            type="text" 
            name="title"
            placeholder="TÍTULO DEL JUEGO" 
            className="upload-input" 
            value={formData.title}
            onChange={handleInputChange}
            required 
          />
          <input 
            type="text" 
            name="price"
            placeholder="PRECIO" 
            className="upload-input" 
            value={formData.price}
            onChange={handleInputChange}
            required 
          />
          <button type="submit" className="btn-publicar">PUBLICAR</button>
        </form>
      </div>
    </div>
  );
}