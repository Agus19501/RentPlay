import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCloudUploadAlt, FaPencilAlt } from 'react-icons/fa';
import { apiRequest, getSession } from '../../../api.js';
import { notify } from '../../../utils/notify.js';
import '../assets/css/subir-juego.css';

const INITIAL_FORM = {
  title: '',
  description: '',
  releaseDate: '',
  genre: '',
  duration: '',
  developers: '',
  price: ''
};

const RAWG_API_KEY = '2fd7395ed6044fd8aa568558be497b46';
const MAX_MEDIA_FILES = 5;
const MAX_PRICE = 50;
const MAX_RENTAL_DAYS = 30;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

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
      requiredMsg: 'Por favor, indica título, precio, duración y fecha.',
      needLogin: 'Debes iniciar sesión para publicar/editar un juego.',
      updated: '¡Juego actualizado con éxito!',
      published: '¡Juego publicado correctamente!',
      saveError: 'Error al guardar el juego',
      saveErrorPrefix: 'Error al guardar:',
      maxFiles: `Solo puedes subir ${MAX_MEDIA_FILES} archivos como máximo contando la portada.`,
      durationRange: `La duración debe estar entre 1 y ${MAX_RENTAL_DAYS} días.`,
      priceRange: `El precio debe estar entre 1 y ${MAX_PRICE} EUR.`,
      daysUnit: 'DÍAS',
      eurUnit: 'EUR',
      uploadFilesHint: 'Máximo 5 archivos contando la portada.'
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
      requiredMsg: 'Please provide title, price, duration and date.',
      needLogin: 'You must log in to publish/edit a game.',
      updated: 'Game updated successfully!',
      published: 'Game published successfully!',
      saveError: 'Error while saving the game',
      saveErrorPrefix: 'Save error:',
      maxFiles: `You can upload a maximum of ${MAX_MEDIA_FILES} files including the cover.`,
      durationRange: `Rental duration must be between 1 and ${MAX_RENTAL_DAYS} days.`,
      priceRange: `Price must be between 1 and ${MAX_PRICE} EUR.`,
      daysUnit: 'DAYS',
      eurUnit: 'EUR',
      uploadFilesHint: 'Maximum 5 files including the cover.'
    }
  };
  const t = texts[lang] || texts.ES;

  useEffect(() => {
    if (editGame) {
      setFormData({
        title: editGame.title || '',
        description: editGame.description || '',
        releaseDate: editGame.releaseDate || '',
        genre: editGame.genre || '',
        duration: editGame.rentalDays || '',
        developers: editGame.developers || '',
        price: editGame.price || ''
      });
      setDateValue(editGame.releaseDate || '');
      const existingMedia = Array.isArray(editGame.media)
        ? editGame.media
          .map((item, index) => {
            if (!item || !item.data) return null;
            const rawData = String(item.data);
            const data = rawData.startsWith('data:') || rawData.startsWith('http') || rawData.startsWith('/')
              ? rawData
              : `/${rawData}`;
            return {
              id: item.id || `${Date.now()}-${index}`,
              type: item.type || (rawData.startsWith('data:video') ? 'video' : 'image'),
              name: item.name || `media-${index + 1}`,
              data
            };
          })
          .filter(Boolean)
        : [];

      if (existingMedia.length > 0) {
        setMediaFiles(existingMedia);
        setCurrentMediaIndex(0);
      } else if (editGame.image) {
        setMediaFiles([{
          id: Date.now(),
          type: 'image',
          name: 'current-cover',
          data: editGame.image.startsWith('data:') || editGame.image.startsWith('http') || editGame.image.startsWith('/')
            ? editGame.image
            : `/${editGame.image}`
        }]);
        setCurrentMediaIndex(0);
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
    let nextValue = value;

    if (name === 'duration') {
      nextValue = value.replace(/\D/g, '').slice(0, 2);
    }

    if (name === 'price') {
      nextValue = value.replace(/[^\d]/g, '').slice(0, 2);
    }

    setFormData((current) => ({ ...current, [name]: nextValue }));

    // Si es el campo del título, buscar en RAWG
    if (name === 'title') {
      if (nextValue.trim().length > 2) {
        searchRAWG(nextValue);
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

        const rawDescription = detailedGame.description_raw || (typeof detailedGame.description === 'string'
          ? detailedGame.description.replace(/<[^>]*>/g, ' ')
          : '');
        const normalizedDescription = String(rawDescription).replace(/\s+/g, ' ').trim();
        
        setFormData((current) => ({
          ...current,
          developers: developers,
          description: normalizedDescription,
        }));
      })
      .catch(error => console.error('Error fetching game details:', error));
    
    // Usar la URL de RAWG directamente (funciona en <img src>, sin CORS)
    if (game.background_image) {
      setMediaFiles([{
        id: Date.now(),
        type: 'image',
        name: `${game.name}-cover`,
        data: game.background_image,
      }]);
      setCurrentMediaIndex(0);
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
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    const acceptedFiles = files.filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    if (acceptedFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_MEDIA_FILES - mediaFiles.length;
    if (remainingSlots <= 0) {
      notify(t.maxFiles, 'info');
      event.target.value = '';
      return;
    }

    const filesToRead = acceptedFiles.slice(0, remainingSlots);
    if (filesToRead.length < acceptedFiles.length) {
      notify(t.maxFiles, 'info');
    }

    Promise.all(
      filesToRead.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              resolve({
                id: Date.now() + Math.random(),
                type: file.type.startsWith('image/') ? 'image' : 'video',
                name: file.name,
                data: String(loadEvent.target?.result || ''),
              });
            };
            reader.onerror = () => reject(new Error(`No se pudo leer el archivo: ${file.name}`));
            reader.readAsDataURL(file);
          })
      )
    )
      .then((newFiles) => {
        setMediaFiles((prev) => {
          const merged = [...prev, ...newFiles];
          if (prev.length === 0 && merged.length > 0) {
            setCurrentMediaIndex(0);
          }
          return merged;
        });
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        event.target.value = '';
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
    if (updatedMedia.length === 0) {
      setCurrentMediaIndex(0);
    } else if (currentMediaIndex >= updatedMedia.length) {
      setCurrentMediaIndex(updatedMedia.length - 1);
    }
  };

  const handlePublish = async (event) => {
    event.preventDefault();

    if (submitLockRef.current) {
      return;
    }

    if (!formData.title.trim() || !formData.price || !formData.duration || !dateValue) {
      notify(t.requiredMsg, 'info');
      return;
    }

    const numericPrice = Number(formData.price);
    const numericDuration = Number(formData.duration);

    if (!Number.isFinite(numericDuration) || numericDuration < 1 || numericDuration > MAX_RENTAL_DAYS) {
      notify(t.durationRange, 'error');
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 1 || numericPrice > MAX_PRICE) {
      notify(t.priceRange, 'error');
      return;
    }

    if (mediaFiles.length > MAX_MEDIA_FILES) {
      notify(t.maxFiles, 'error');
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const primaryImage = mediaFiles.find((m) => m.type === 'image')?.data || '';
    const payload = {
      title: formData.title,
      description: formData.description,
      releaseDate: dateValue,
      genre: formData.genre,
      rentalDays: numericDuration,
      developers: formData.developers,
      price: numericPrice,
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
        navigate('/home');
      } else {
        notify(response.message || t.saveError, 'error');
      }
    } catch (error) {
      notify(`${t.saveErrorPrefix} ${error.message}`, 'error');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
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
                <label className="upload-field-label" htmlFor="upload-title">{t.title}</label>
                <input 
                  id="upload-title"
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

              <div className="upload-field-group">
                <label className="upload-field-label" htmlFor="upload-release-date">{t.dateLaunch}</label>
                <input id="upload-release-date" type="text" name="releaseDate" placeholder={t.dateLaunch} className="upload-input date-picker-input" title={t.dateTitle} value={dateValue} onChange={handleDateChange} />
              </div>

              <div className="upload-field-group">
                <label className="upload-field-label" htmlFor="upload-genre">{t.genre}</label>
                <input id="upload-genre" type="text" name="genre" placeholder={t.genre} className="upload-input" value={formData.genre} onChange={handleInputChange} />
              </div>

              <div className="upload-field-group">
                <label className="upload-field-label" htmlFor="upload-duration">{t.duration}</label>
                <div className="upload-input-with-suffix">
                  <input id="upload-duration" type="text" inputMode="numeric" name="duration" placeholder={`1-${MAX_RENTAL_DAYS}`} className="upload-input" value={formData.duration} onChange={handleInputChange} />
                  <span className="upload-input-suffix">{t.daysUnit}</span>
                </div>
              </div>

              <div className="upload-field-group">
                <label className="upload-field-label" htmlFor="upload-developers">{t.devs}</label>
                <input id="upload-developers" type="text" name="developers" placeholder={t.devs} className="upload-input" value={formData.developers} onChange={handleInputChange} />
              </div>

              <div className="upload-field-group">
                <label className="upload-field-label" htmlFor="upload-price">{t.price}</label>
                <div className="upload-input-with-suffix">
                  <input id="upload-price" type="text" inputMode="numeric" name="price" placeholder={`1-${MAX_PRICE}`} className="upload-input" value={formData.price} onChange={handleInputChange} required />
                  <span className="upload-input-suffix">{t.eurUnit}</span>
                </div>
              </div>
            </form>

              <button
                className={`btn-publicar${isSubmitting ? ' is-loading' : ''}`}
                id="btn-publish-game"
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? t.loading : (editGame ? t.updateBtn : t.publish)}
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
                      <img src={mediaFiles[currentMediaIndex].data} alt={t.imagePreview} className="upload-image-preview" id="preview-img" />
                    ) : (
                      <video src={mediaFiles[currentMediaIndex].data} controls className="upload-image-preview" id="preview-video" />
                    )}
                    {mediaFiles.length > 1 && <div className="media-counter">{currentMediaIndex + 1} / {mediaFiles.length}</div>}
                  </>
                ) : (
                  <div className="upload-placeholder-content" id="upload-placeholder">
                    <FaCloudUploadAlt className="upload-placeholder-icon" />
                    <span>{t.changeCover}</span>
                    <small>{t.uploadFilesHint}</small>
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
                        <span>VIDEO</span>
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

            {mediaFiles.length > 1 && (
              <div className="upload-image-nav">
                <button className="upload-nav-btn" type="button" onClick={goToPreviousMedia}><div className="nav-icon-circle"><FaChevronLeft /></div><span>{t.prev}</span></button>
                <button className="upload-nav-btn" type="button" onClick={goToNextMedia}><div className="nav-icon-circle"><FaChevronRight /></div><span>{t.next}</span></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}