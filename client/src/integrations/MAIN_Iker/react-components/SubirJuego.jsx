import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCloudUploadAlt, FaPencilAlt } from 'react-icons/fa';
import { apiRequest } from '../../../api.js';
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

const RAWG_API_KEY = '2fd7395ed6044fd8aa568558be497b46';

export default function SubirJuego() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [dateValue, setDateValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    setFormData(INITIAL_FORM);
    setMediaFiles([]);
    setCurrentMediaIndex(0);
    setDateValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    // Si es el campo del título, buscar en RAWG
    if (name === 'title') {
      if (value.trim().length > 2) {
        searchRAWG(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const searchRAWG = async (gameName) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(gameName)}&page_size=5`
      );
      const data = await response.json();
      
      if (data.results) {
        setSuggestions(data.results);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching RAWG:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const selectGameFromSuggestions = (game) => {
    // Llenar los campos básicos con información de RAWG
    const genres = game.genres?.map(g => g.name).join(', ') || '';
    const releaseDate = game.released ? new Date(game.released).toLocaleDateString('es-ES') : '';

    setFormData((current) => ({
      ...current,
      title: game.name,
      genre: genres,
      releaseDate: releaseDate,
    }));

    setDateValue(releaseDate);
    
    // Obtener información detallada del juego (incluyendo desarrolladores)
    fetch(`https://api.rawg.io/api/games/${game.id}?key=${RAWG_API_KEY}`)
      .then(res => res.json())
      .then(detailedGame => {
        // Actualizar desarrolladores desde la respuesta detallada
        const developers = detailedGame.developers?.length > 0
          ? detailedGame.developers.map(d => d.name).join(', ')
          : '';
        
        setFormData((current) => ({
          ...current,
          developers: developers,
        }));
      })
      .catch(error => console.error('Error fetching game details:', error));
    
    // Cargar la imagen de RAWG si existe
    if (game.background_image) {
      // Usar el backend para descargar la imagen (evita CORS issues)
      fetch('/api/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: game.background_image }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.imageData) {
            const newMedia = {
              id: Date.now(),
              type: 'image',
              name: `${game.name}-cover`,
              data: data.imageData,
            };
            setMediaFiles([newMedia]);
            setCurrentMediaIndex(0);
          }
        })
        .catch(error => console.error('Error loading image:', error));
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
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
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const newFiles = [];
    let loadedCount = 0;

    Array.from(files).forEach((file) => {
      // Aceptar imágenes y videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          newFiles.push({
            id: Date.now() + Math.random(),
            type: file.type.startsWith('image/') ? 'image' : 'video',
            name: file.name,
            data: String(loadEvent.target?.result || ''),
          });
          loadedCount++;

          if (loadedCount === files.length) {
            setMediaFiles((prev) => [...prev, ...newFiles]);
            if (mediaFiles.length === 0) {
              setCurrentMediaIndex(0);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const goToPreviousMedia = () => {
    if (mediaFiles.length > 0) {
      setCurrentMediaIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
    }
  };

  const goToNextMedia = () => {
    if (mediaFiles.length > 0) {
      setCurrentMediaIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
    }
  };

  const removeMedia = (id) => {
    const updatedMedia = mediaFiles.filter((m) => m.id !== id);
    setMediaFiles(updatedMedia);
    if (updatedMedia.length > 0 && currentMediaIndex >= updatedMedia.length) {
      setCurrentMediaIndex(updatedMedia.length - 1);
    }
  };

  const handlePublish = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      alert('Por favor, indica al menos el título del juego.');
      return;
    }

    const primaryImage = mediaFiles.find((m) => m.type === 'image')?.data || '';
    const payload = {
      title: formData.title,
      releaseDate: formData.releaseDate,
      genre: formData.genre,
      duration: formData.duration,
      developers: formData.developers,
      price: formData.price,
      imagePreview: primaryImage,
    };

    try {
      await apiRequest('/api/games', { method: 'POST', body: payload });
      alert('¡Juego publicado correctamente!');
      navigate('/home');
    } catch (error) {
      if (error.message === 'No autorizado.' || error.message === 'Sesion invalida.') {
        alert('Debes iniciar sesión para publicar un juego.');
      } else {
        alert(`Error al publicar: ${error.message}`);
      }
    }
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

            <form className="upload-form" id="upload-game-form" onSubmit={handlePublish} autoComplete="off">
              <div className="title-input-wrapper">
                <input 
                  type="text" 
                  name="title" 
                  placeholder="TÍTULO DEL JUEGO" 
                  className="upload-input" 
                  autoComplete="off"
                  value={formData.title} 
                  onChange={handleInputChange} 
                  required 
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {isLoadingSuggestions ? (
                      <div className="suggestion-item loading">Cargando...</div>
                    ) : (
                      suggestions.map((game) => (
                        <div
                          key={game.id}
                          className="suggestion-item"
                          onClick={() => selectGameFromSuggestions(game)}
                          role="option"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') selectGameFromSuggestions(game);
                          }}
                        >
                          <div className="suggestion-content">
                            <div className="suggestion-title">{game.name}</div>
                            <div className="suggestion-meta">
                              {game.released && <span>{new Date(game.released).getFullYear()}</span>}
                              {game.platforms?.length > 0 && (
                                <span>{game.platforms.slice(0, 2).map(p => p.platform.name).join(', ')}</span>
                              )}
                            </div>
                          </div>
                          {game.background_image && (
                            <img src={game.background_image} alt={game.name} className="suggestion-image" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
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
                {mediaFiles.length > 0 ? (
                  <>
                    {mediaFiles[currentMediaIndex]?.type === 'image' ? (
                      <img src={mediaFiles[currentMediaIndex].data} alt="Vista previa" className="upload-image-preview" id="preview-img" crossOrigin="anonymous" />
                    ) : (
                      <video src={mediaFiles[currentMediaIndex].data} controls className="upload-image-preview" id="preview-video" />
                    )}
                    {mediaFiles.length > 1 && <div className="media-counter">{currentMediaIndex + 1} / {mediaFiles.length}</div>}
                  </>
                ) : (
                  <div className="cover-stack" id="upload-placeholder">
                    <img src={cover2} alt="portada secundaria" className="cover-stack-back" />
                    <img src={cover1} alt="portada principal" className="cover-stack-front" />
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" id="file-upload" className="hidden" hidden accept="image/*,video/*" multiple aria-label="Selector de archivo de imagen y video" onChange={handleFileChange} />
            </div>

            {mediaFiles.length > 0 && (
              <div className="media-list">
                {mediaFiles.map((media, index) => (
                  <div
                    key={media.id}
                    className={`media-thumbnail ${index === currentMediaIndex ? 'active' : ''}`}
                    onClick={() => setCurrentMediaIndex(index)}
                  >
                    {media.type === 'image' ? (
                      <img src={media.data} alt={`Media ${index + 1}`} />
                    ) : (
                      <div className="video-thumbnail">
                        <span>🎥</span>
                      </div>
                    )}
                    <button
                      className="remove-media-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMedia(media.id);
                      }}
                      type="button"
                      title="Eliminar archivo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="upload-image-nav">
              <button className="upload-nav-btn" type="button" onClick={goToPreviousMedia}><div className="nav-icon-circle"><FaChevronLeft /></div><span>ANTERIOR</span></button>
              <button className="upload-nav-btn" type="button" onClick={goToNextMedia}><div className="nav-icon-circle"><FaChevronRight /></div><span>SIGUIENTE</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}