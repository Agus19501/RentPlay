import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCloudUploadAlt, FaPencilAlt } from 'react-icons/fa';
import '../assets/css/subir-juego.css';
import cover1 from '../assets/images/cover1.svg';
import cover2 from '../assets/images/cover2.svg';

const INITIAL_FORM = {
  title: '',
  releaseDate: '',
  genre: '',
  duration: '',
  developers: '',
  price: ''
};

export default function SubirJuego() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [imagePreview, setImagePreview] = useState('');
  const [dateValue, setDateValue] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleDateChange = (event) => {
    const onlyDigits = event.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = onlyDigits;
    if (onlyDigits.length > 2) {
      formatted = `${onlyDigits.slice(0, 2)}/${onlyDigits.slice(2)}`;
    }
    if (onlyDigits.length > 4) {
      formatted = `${onlyDigits.slice(0, 2)}/${onlyDigits.slice(2, 4)}/${onlyDigits.slice(4)}`;
    }
    setDateValue(formatted);
    setFormData((current) => ({ ...current, releaseDate: formatted }));
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => setImagePreview(String(loadEvent.target?.result || ''));
    reader.readAsDataURL(file);
  };

  const handlePublish = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      alert('Por favor, indica al menos el título del juego.');
      return;
    }

    const payload = { ...formData, imagePreview };

    if (window.RentPlayApi && typeof window.RentPlayApi.createGame === 'function') {
      try {
        await window.RentPlayApi.createGame(payload);
      } catch (error) {
        console.warn('Backend BD warning:', error.message);
      }
    }

    localStorage.setItem('lastUploadedGame', JSON.stringify(payload));
    alert('¡Juego publicado correctamente en rentplay!');
    navigate('/home');
  };

  return (
    <div className="main-content">
      <div className="container upload-game-container">
        <div className="upload-content">
          <div className="upload-form-section">
            <div className="upload-header">
              <h1 className="upload-title">PONER UN JUEGO EN ALQUILER</h1>
              <p className="upload-subtitle">Introduce los datos del videojuego que quieras subir a rentplay.</p>
              <p className="upload-hint">Si lo conocemos, completaremos los datos por ti ;)</p>
            </div>

            <form className="upload-form" id="upload-game-form" onSubmit={handlePublish}>
              <input type="text" name="title" placeholder="TÍTULO DEL JUEGO" className="upload-input" value={formData.title} onChange={handleInputChange} required />
              <input type="text" name="releaseDate" placeholder="FECHA DE LANZAMIENTO" className="upload-input date-picker-input" title="Selecciona la fecha por día, mes y año" value={dateValue} onChange={handleDateChange} />
              <input type="text" name="genre" placeholder="GÉNERO" className="upload-input" value={formData.genre} onChange={handleInputChange} />
              <input type="text" name="duration" placeholder="DURACIÓN DE ALQUILER" className="upload-input" value={formData.duration} onChange={handleInputChange} />
              <input type="text" name="developers" placeholder="DESARROLLADORES" className="upload-input" value={formData.developers} onChange={handleInputChange} />
              <input type="text" name="price" placeholder="PRECIO" className="upload-input" value={formData.price} onChange={handleInputChange} required />
            </form>

            <button className="btn-publicar" id="btn-publish-game" type="button" onClick={handlePublish}>PUBLICAR</button>
          </div>

          <div className="upload-image-section">
            <div className="upload-image-wrapper" id="upload-image-wrapper" tabIndex={0} aria-label="Haz clic para subir la portada del juego" role="button" onClick={openFilePicker} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && openFilePicker()}>
              <button className="btn-edit-image" title="Cambiar portada" id="btn-upload-image" aria-label="Cambiar foto de portada" type="button" onClick={(event) => { event.stopPropagation(); openFilePicker(); }}>
                <FaPencilAlt />
              </button>

              <div className="upload-image-preview-container">
                {imagePreview ? (
                  <img src={imagePreview} alt="Vista previa de la portada" className="upload-image-preview" id="preview-img" />
                ) : (
                  <div className="cover-stack" id="upload-placeholder">
                    <img src={cover2} alt="portada secundaria" className="cover-stack-back" />
                    <img src={cover1} alt="portada principal" className="cover-stack-front" />
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" id="file-upload" className="hidden" accept="image/*" aria-label="Selector de archivo de imagen" onChange={handleFileChange} />
            </div>

            <div className="upload-image-nav">
              <button className="upload-nav-btn" type="button"><div className="nav-icon-circle"><FaChevronLeft /></div><span>ANTERIOR</span></button>
              <button className="upload-nav-btn" type="button"><div className="nav-icon-circle"><FaChevronRight /></div><span>SIGUIENTE</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}