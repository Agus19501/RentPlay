import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCloudUploadAlt, FaPencilAlt } from 'react-icons/fa';
import { apiRequest, getSession } from '../../../api.js';
import { notify } from '../../../utils/notify.js';
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

export default function SubirJuego({ lang = 'ES' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editGame = location.state?.editGame;
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [dateValue, setDateValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const texts = {
    ES: {
      editSale: 'EDITAR VENTA',
      putRent: 'PONER UN JUEGO EN ALQUILER',
      editDesc: 'Actualiza los datos de tu videojuego.',
      uploadDesc: 'Introduce los datos del videojuego que quieras subir a rentplay.',
      hint: 'Si lo conocemos, completaremos los datos por ti ;)',
      title: 'TÍTULO DEL JUEGO',
      releaseDate: 'AÑO DE LANZAMIENTO',
      genre: 'GÉNERO',
      duration: 'DURACIÓN DE ALQUILER',
      devs: 'DESARROLLADORES',
      price: 'PRECIO',
      loading: 'Cargando...',
      publish: 'PUBLICAR',
      update: 'GUARDAR CAMBIOS',
      updateBtn: 'ACTUALIZAR',
      prev: 'ANTERIOR',
      next: 'SIGUIENTE',
      dateLaunch: 'FECHA DE LANZAMIENTO',
      dateTitle: 'Selecciona la fecha por día, mes y año',
      uploadCoverAria: 'Haz clic para subir la portada del juego',
      changeCover: 'Cambiar portada',
      changeCoverAria: 'Cambiar foto de portada',
      imagePreview: 'Vista previa',
      secondaryCover: 'portada secundaria',
      mainCover: 'portada principal',
      mediaSelectorAria: 'Selector de archivo de imagen y video',
      removeFile: 'Eliminar archivo',
      requiredMsg: 'Por favor, indica título, precio y fecha.',
      needLogin: 'Debes iniciar sesión para publicar/editar un juego.',
      updated: '¡Juego actualizado con éxito!',
      published: '¡Juego publicado correctamente!',
      saveError: 'Error al guardar el juego',
      saveErrorPrefix: 'Error al guardar:'
    },
    EN: {
      editSale: 'EDIT LISTING',
      putRent: 'LIST A GAME FOR RENT',
      editDesc: 'Update your game information.',
      uploadDesc: 'Enter the game information you want to upload to rentplay.',
      hint: 'If we know it, we will complete the data for you ;)',
      title: 'GAME TITLE',
      releaseDate: 'RELEASE YEAR',
      genre: 'GENRE',
      duration: 'RENTAL DURATION',
      devs: 'DEVELOPERS',
      price: 'PRICE',
      loading: 'Loading...',
      publish: 'PUBLISH',
      update: 'SAVE CHANGES',
      updateBtn: 'UPDATE',
      prev: 'PREVIOUS',
      next: 'NEXT',
      dateLaunch: 'RELEASE DATE',
      dateTitle: 'Select the date by day, month and year',
      uploadCoverAria: 'Click to upload game cover',
      changeCover: 'Change cover',
      changeCoverAria: 'Change cover photo',
      imagePreview: 'Preview',
      secondaryCover: 'secondary cover',
      mainCover: 'main cover',
      mediaSelectorAria: 'Image and video file selector',
      removeFile: 'Remove file',
      requiredMsg: 'Please provide title, price and date.',
      needLogin: 'You must log in to publish/edit a game.',
      updated: 'Game updated successfully!',
      published: 'Game published successfully!',
      saveError: 'Error while saving the game',
      saveErrorPrefix: 'Save error:'
    }
  };
  const t = texts[lang] || texts.ES;

  useEffect(() => {
    if (editGame) {
      setFormData({
        title: editGame.title || '',
        releaseDate: editGame.releaseDate || '',
        genre: editGame.genre || '',
        duration: editGame.rentalDays || '',
        developers: editGame.developers || '',
        price: editGame.price || ''
      });
      setDateValue(editGame.releaseDate || '');
      if (editGame.image) {
        setMediaFiles([{
          id: Date.now(),
          type: 'image',
          name: 'current-cover',
          data: editGame.image.startsWith('data:') ? editGame.image : `/${editGame.image}`
        }]);
      }
    } else {
      setFormData(INITIAL_FORM);
      setMediaFiles([]);
      setCurrentMediaIndex(0);
      setDateValue('');
    }
    setSuggestions([]);
    setShowSuggestions(false);
  }, [editGame]);

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
      apiRequest('/api/download-image', {
        method: 'POST',
        body: { url: game.background_image },
      })
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

    if (!formData.title.trim() || !formData.price || !dateValue) {
      notify(t.requiredMsg, 'info');
      return;
    }

    const primaryImage = mediaFiles.find((m) => m.type === 'image')?.data || '';
    const payload = {
      title: formData.title,
      releaseDate: dateValue,
      genre: formData.genre,
      rentalDays: Number(formData.duration),
      developers: formData.developers,
      price: Number(formData.price),
      image: primaryImage,
      media: mediaFiles.map((media) => ({
        type: media.type,
        name: media.name,
        data: media.data
      }))
    };

    try {
      const session = await getSession();
      if (!session) {
        notify(t.needLogin, 'info');
        return;
      }

      const endpoint = editGame ? `/api/games/${editGame.id}` : '/api/games';
      const method = editGame ? 'PUT' : 'POST';

      const response = await apiRequest(endpoint, { 
        method, 
        body: payload,
        token: session.token
      });

      if (response.ok) {
        notify(editGame ? t.updated : t.published, 'success');
        navigate('/perfil-propio');
      } else {
        notify(response.message || t.saveError, 'error');
      }
    } catch (error) {
      notify(`${t.saveErrorPrefix} ${error.message}`, 'error');
    }
  };

  return (
    <div className="main-content">
      <div className="container upload-game-container">
        <div className="upload-content">
          <div className="upload-form-section">
            <div className="upload-header">
              <h1 className="upload-title">{editGame ? t.editSale : t.putRent}</h1>
              <p className="upload-subtitle">
                {editGame 
                  ? t.editDesc 
                  : t.uploadDesc}
              </p>
              <p className="upload-hint">{t.hint}</p>
            </div>

            <form className="upload-form" id="upload-game-form" onSubmit={handlePublish} autoComplete="off">
              <div className="title-input-wrapper">
                <input 
                  type="text" 
                  name="title" 
                  placeholder={t.title} 
                  className="upload-input" 
                  autoComplete="off"
                  value={formData.title} 
                  onChange={handleInputChange} 
                  required 
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {isLoadingSuggestions ? (
                      <div className="suggestion-item loading">{t.loading}</div>
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
              <input type="text" name="releaseDate" placeholder={t.dateLaunch} className="upload-input date-picker-input" title={t.dateTitle} value={dateValue} onChange={handleDateChange} />
              <input type="text" name="genre" placeholder={t.genre} className="upload-input" value={formData.genre} onChange={handleInputChange} />
              <input type="text" name="duration" placeholder={t.duration} className="upload-input" value={formData.duration} onChange={handleInputChange} />
              <input type="text" name="developers" placeholder={t.devs} className="upload-input" value={formData.developers} onChange={handleInputChange} />
              <input type="text" name="price" placeholder={t.price} className="upload-input" value={formData.price} onChange={handleInputChange} required />
            </form>

              <button className="btn-publicar" id="btn-publish-game" type="button" onClick={handlePublish}>
                {editGame ? t.updateBtn : t.publish}
              </button>
          </div>

          <div className="upload-image-section">
            <div className="upload-image-wrapper" id="upload-image-wrapper" tabIndex={0} aria-label={t.uploadCoverAria} role="button" onClick={openFilePicker} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && openFilePicker()}>
              <button className="btn-edit-image" title={t.changeCover} id="btn-upload-image" aria-label={t.changeCoverAria} type="button" onClick={(event) => { event.stopPropagation(); openFilePicker(); }}>
                <FaPencilAlt />
              </button>

              <div className="upload-image-preview-container">
                {mediaFiles.length > 0 ? (
                  <>
                    {mediaFiles[currentMediaIndex]?.type === 'image' ? (
                      <img src={mediaFiles[currentMediaIndex].data} alt={t.imagePreview} className="upload-image-preview" id="preview-img" crossOrigin="anonymous" />
                    ) : (
                      <video src={mediaFiles[currentMediaIndex].data} controls className="upload-image-preview" id="preview-video" />
                    )}
                    {mediaFiles.length > 1 && <div className="media-counter">{currentMediaIndex + 1} / {mediaFiles.length}</div>}
                  </>
                ) : (
                  <div className="cover-stack" id="upload-placeholder">
                    <img src={cover2} alt={t.secondaryCover} className="cover-stack-back" />
                    <img src={cover1} alt={t.mainCover} className="cover-stack-front" />
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" id="file-upload" className="hidden" hidden accept="image/*,video/*" multiple aria-label={t.mediaSelectorAria} onChange={handleFileChange} />
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
                      title={t.removeFile}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="upload-image-nav">
              <button className="upload-nav-btn" type="button" onClick={goToPreviousMedia}><div className="nav-icon-circle"><FaChevronLeft /></div><span>{t.prev}</span></button>
              <button className="upload-nav-btn" type="button" onClick={goToNextMedia}><div className="nav-icon-circle"><FaChevronRight /></div><span>{t.next}</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}