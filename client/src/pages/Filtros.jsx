import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Filtros.css';

const Filtros = ({ lang }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [games, setGames] = useState([]);
  
  // Filtros
  const [year, setYear] = useState({ min: 1970, max: 2026 });
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);

  const currentSearch = searchParams.get('search') || '';

  const t = {
    ES: {
      title: 'FILTROS DE BÚSQUEDA',
      subtitle: 'Usa los filtros disponibles para encontrar exactamente lo que buscas',
      year: 'AÑO DE LANZAMIENTO',
      genre: 'GÉNERO',
      developer: 'DESARROLLADORES',
      all: 'Todos',
      apply: 'APLICAR FILTROS'
    },
    EN: {
      title: 'SEARCH FILTERS',
      subtitle: 'Use the available filters to find exactly what you are looking for',
      year: 'RELEASE YEAR',
      genre: 'GENRE',
      developer: 'DEVELOPERS',
      all: 'All',
      apply: 'APPLY FILTERS'
    }
  }[lang] || {
    title: 'FILTROS DE BÚSQUEDA',
    subtitle: 'Usa los filtros disponibles para encontrar exactamente lo que buscas',
    year: 'AÑO DE LANZAMIENTO',
    genre: 'GÉNERO',
    developer: 'DESARROLLADORES',
    all: 'Todos',
    apply: 'APLICAR FILTROS'
  };

  useEffect(() => {
    // 1. Cargamos TODOS los juegos para sacar Géneros/Desarrolladores únicos para los dropdowns
    apiRequest('/api/games')
      .then((response) => setGames(response.games || []))
      .catch(() => setGames([]));

    // 2. Sincronizamos los estados visuales con la URL actual
    const minParam = searchParams.get('minYear');
    const maxParam = searchParams.get('maxYear');
    const genreParam = searchParams.get('genre');
    const devParam = searchParams.get('developer');

    if (minParam) setYear(y => ({ ...y, min: parseInt(minParam) }));
    if (maxParam) setYear(y => ({ ...y, max: parseInt(maxParam) }));
    if (genreParam) setSelectedGenre(genreParam);
    if (devParam) setSelectedDeveloper(devParam);
  }, [searchParams]);

  const genres = useMemo(() => 
    Array.from(new Set(games.map((game) => game.genre).filter(Boolean))).sort()
  , [games]);
  
  const developers = useMemo(() => 
    Array.from(new Set(games.map((game) => game.developers).filter(Boolean))).sort()
  , [games]);

  const handleRange = (event, type, edge) => {
    const value = parseFloat(event.target.value);
    if (edge === 'min') {
      if (value <= year.max) setYear((prev) => ({ ...prev, min: value }));
    } else {
      if (value >= year.min) setYear((prev) => ({ ...prev, max: value }));
    }
  };

  const formatYear = () => (year.min === year.max ? `${year.min}` : `${year.min} - ${year.max}`);

  const handleApply = () => {
    // CREAMOS UNA URL LIMPIA PERO MANTENEMOS EL SEARCH OBLIGATORIAMENTE
    const params = new URLSearchParams();
    
    // Si veníamos de una búsqueda por texto (ej: "Fortnite"), la mantenemos como base obligatoria
    if (currentSearch) {
      params.set('search', currentSearch);
    }
    
    // Aplicamos los filtros adicionales sobre esa búsqueda
    if (selectedGenre && selectedGenre !== t.all) params.set('genre', selectedGenre);
    if (selectedDeveloper && selectedDeveloper !== t.all) params.set('developer', selectedDeveloper);
    if (year.min > 1970) params.set('minYear', year.min);
    if (year.max < 2026) params.set('maxYear', year.max);
    
    navigate(`/resultados?${params.toString()}`);
  };

  return (
    <div className="filtros-page">
      <div className="filtros-container">
        <div className="section-header">
          <h1 className="section-title">{t.title}</h1>
          <p className="section-subtitle">{t.subtitle}</p>
        </div>

        <div className="filters-grid">
          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label">{t.year}</h3>
              <p className="range-result-text">{formatYear()}</p>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{ left: `${((year.min - 1970) / 56) * 100}%`, right: `${100 - ((year.max - 1970) / 56) * 100}%` }}></div>
              <div className="thumb-container" style={{ left: `${((year.min - 1970) / 56) * 100}%` }}><div className="thumb-circle"></div></div>
              <div className="thumb-container" style={{ left: `${((year.max - 1970) / 56) * 100}%` }}><div className="thumb-circle"></div></div>
              <input type="range" min="1970" max="2026" step="1" value={year.min} onChange={(event) => handleRange(event, 'year', 'min')} className="thumb-input" style={{ zIndex: year.min > 1998 ? 22 : 21 }} />
              <input type="range" min="1970" max="2026" step="1" value={year.max} onChange={(event) => handleRange(event, 'year', 'max')} className="thumb-input" style={{ zIndex: year.min > 1998 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label uppercase">{t.genre}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="custom-select" onClick={() => setOpenDropdown(openDropdown === 'genre' ? null : 'genre')}>
                <span className={`selected-text ${!selectedGenre ? 'placeholder' : ''}`}>{selectedGenre || t.all}</span>
                <FaChevronDown className={`arrow ${openDropdown === 'genre' ? 'up' : ''}`} />
                {openDropdown === 'genre' && (
                  <div className="options-panel">
                    <div className="option" onClick={() => setSelectedGenre(null)}>{t.all}</div>
                    {genres.map((genre) => (
                      <div key={genre} className="option" onClick={() => setSelectedGenre(genre)}>{genre}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label uppercase">{t.developer}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="custom-select" onClick={() => setOpenDropdown(openDropdown === 'developer' ? null : 'developer')}>
                <span className={`selected-text ${!selectedDeveloper ? 'placeholder' : ''}`}>{selectedDeveloper || t.all}</span>
                <FaChevronDown className={`arrow ${openDropdown === 'developer' ? 'up' : ''}`} />
                {openDropdown === 'developer' && (
                  <div className="options-panel">
                    <div className="option" onClick={() => setSelectedDeveloper(null)}>{t.all}</div>
                    {developers.map((dev) => (
                      <div key={dev} className="option" onClick={() => setSelectedDeveloper(dev)}>{dev}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <button 
          className="btn-apply-filters"
          onClick={handleApply}
          style={{
            marginTop: '40px',
            background: '#FF6100',
            color: 'white',
            border: 'none',
            padding: '15px 40px',
            borderRadius: '4px',
            fontSize: '18px',
            fontWeight: '800',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          {t.apply}
        </button>
      </div>
    </div>
  );
};

export default Filtros;
