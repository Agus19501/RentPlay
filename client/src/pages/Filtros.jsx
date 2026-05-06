import { useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Filtros.css';

const Filtros = ({ lang }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [precio, setPrecio] = useState({ min: 1, max: 15 });
  const [alquiler, setAlquiler] = useState({ min: 1, max: 30 });
  const [lanzamiento, setLanzamiento] = useState({ min: 1970, max: 2026 });
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [selectedDev, setSelectedDev] = useState(null);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    let active = true;

    apiRequest('/api/games')
      .then((data) => {
        if (!active) {
          return;
        }

        setCatalog(data.games || []);

        const prices = (data.games || []).map((game) => Number(game.price)).filter((value) => Number.isFinite(value));
        const years = (data.games || []).map((game) => {
          const match = String(game.title || '').match(/(19\d{2}|20\d{2})/);
          return match ? Number(match[1]) : null;
        }).filter((value) => Number.isFinite(value));

        if (prices.length > 0) {
          setPrecio({ min: Math.max(1, Math.floor(Math.min(...prices))), max: Math.ceil(Math.max(...prices)) });
        }

        if (years.length > 0) {
          setLanzamiento({ min: Math.min(...years), max: Math.max(...years) });
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const t = {
    ES: {
      title: 'FILTROS DE BÚSQUEDA',
      subtitle: 'Establece los parámetros de búsqueda para encontrar la oferta ideal en RentPlay',
      precio: 'PRECIO',
      alquiler: 'ALQUILER',
      año: 'AÑO DE LANZAMIENTO',
      val: 'VALORACIONES',
      gen: 'Género',
      dev: 'Desarrolladores',
      userVal: 'Usuarios mejor valorados',
      gameVal: 'Juegos mejor valorados',
      day: 'DIA',
      days: 'DIAS',
      eur: 'EUR',
      ejemplo: 'Ejemplo'
    },
    EN: {
      title: 'SEARCH FILTERS',
      subtitle: 'Set the search parameters to find the ideal deal on RentPlay',
      precio: 'PRICE',
      alquiler: 'RENTAL',
      año: 'RELEASE YEAR',
      val: 'RATINGS',
      gen: 'Genre',
      dev: 'Developers',
      userVal: 'Top rated users',
      gameVal: 'Top rated games',
      day: 'DAY',
      days: 'DAYS',
      eur: 'EUR',
      ejemplo: 'Example'
    }
  }[lang] || {
    title: 'FILTROS DE BÚSQUEDA'
  };

  const handleRange = (event, type, edge) => {
    const value = parseInt(event.target.value, 10);
    const setter = type === 'precio' ? setPrecio : type === 'alquiler' ? setAlquiler : setLanzamiento;
    const state = type === 'precio' ? precio : type === 'alquiler' ? alquiler : lanzamiento;

    if (edge === 'min') {
      if (value <= state.max) setter({ ...state, min: value });
    } else if (value >= state.min) {
      setter({ ...state, max: value });
    }
  };

  const formatPrecio = () => (precio.min === precio.max ? `${precio.min} ${t.eur}` : `${precio.min} ${t.eur} - ${precio.max} ${t.eur}`);
  const formatAlquiler = () => {
    const minText = `${alquiler.min} ${alquiler.min === 1 ? t.day : t.days}`;
    const maxText = `${alquiler.max} ${t.days}`;
    return alquiler.min === alquiler.max ? minText : `${minText} - ${maxText}`;
  };
  const formatLanzamiento = () => (lanzamiento.min === lanzamiento.max ? `${lanzamiento.min}` : `${lanzamiento.min} - ${lanzamiento.max}`);

  const platformOptions = Array.from(new Set(catalog.map((game) => game.platform).filter(Boolean)));
  const sellerOptions = Array.from(new Set(catalog.map((game) => game.seller?.name).filter(Boolean)));

  return (
    <div className="filtros-page">
      <div className="filtros-container">
        <div className="section-header">
          <div>
            <h1 className="section-title">{t.title}</h1>
            <p className="section-subtitle">{t.subtitle}</p>
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label">{t.precio}</h3>
              <p className="range-result-text">{formatPrecio()}</p>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{ left: `${((precio.min - 1) / 49) * 100}%`, right: `${100 - ((precio.max - 1) / 49) * 100}%` }} />
              <div className="thumb-container" style={{ left: `${((precio.min - 1) / 49) * 100}%` }}><div className="thumb-circle" /></div>
              <div className="thumb-container" style={{ left: `${((precio.max - 1) / 49) * 100}%` }}><div className="thumb-circle" /></div>
              <input type="range" min="1" max="50" value={precio.min} onChange={(event) => handleRange(event, 'precio', 'min')} className="thumb-input" style={{ zIndex: precio.min > 25 ? 22 : 21 }} />
              <input type="range" min="1" max="50" value={precio.max} onChange={(event) => handleRange(event, 'precio', 'max')} className="thumb-input" style={{ zIndex: precio.min > 25 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label">{t.val}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="toggle-group">
                <div className="toggle-item">
                  <span>{t.userVal}</span>
                  <label className="switch"><input type="checkbox" /><span className="slider-round" /></label>
                </div>
                <div className="toggle-item">
                  <span>{t.gameVal}</span>
                  <label className="switch"><input type="checkbox" defaultChecked /><span className="slider-round" /></label>
                </div>
              </div>
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label uppercase">{lang === 'ES' ? 'GÉNERO' : 'GENRE'}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="custom-select" onClick={() => setOpenDropdown(openDropdown === 'gen' ? null : 'gen')} role="button" tabIndex={0}>
                <span className={`selected-text ${!selectedGenreId ? 'placeholder' : ''}`}>
                  {selectedGenreId ? `${t.ejemplo} ${selectedGenreId}` : (platformOptions[0] || t.gen)}
                </span>
                <FaChevronDown className={`arrow ${openDropdown === 'gen' ? 'up' : ''}`} />
                {openDropdown === 'gen' && (
                  <div className="options-panel">
                    {platformOptions.map((name, index) => (
                      <div key={name} className="option" onClick={() => setSelectedGenreId(index + 1)} role="button" tabIndex={0}>{name}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label">{t.alquiler}</h3>
              <p className="range-result-text">{formatAlquiler()}</p>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{ left: `${((alquiler.min - 1) / 29) * 100}%`, right: `${100 - ((alquiler.max - 1) / 29) * 100}%` }} />
              <div className="thumb-container" style={{ left: `${((alquiler.min - 1) / 29) * 100}%` }}><div className="thumb-circle" /></div>
              <div className="thumb-container" style={{ left: `${((alquiler.max - 1) / 29) * 100}%` }}><div className="thumb-circle" /></div>
              <input type="range" min="1" max="30" value={alquiler.min} onChange={(event) => handleRange(event, 'alquiler', 'min')} className="thumb-input" style={{ zIndex: alquiler.min > 15 ? 22 : 21 }} />
              <input type="range" min="1" max="30" value={alquiler.max} onChange={(event) => handleRange(event, 'alquiler', 'max')} className="thumb-input" style={{ zIndex: alquiler.min > 15 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label">{t.año}</h3>
              <p className="range-result-text">{formatLanzamiento()}</p>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{ left: `${((lanzamiento.min - 1970) / 56) * 100}%`, right: `${100 - ((lanzamiento.max - 1970) / 56) * 100}%` }} />
              <div className="thumb-container" style={{ left: `${((lanzamiento.min - 1970) / 56) * 100}%` }}><div className="thumb-circle" /></div>
              <div className="thumb-container" style={{ left: `${((lanzamiento.max - 1970) / 56) * 100}%` }}><div className="thumb-circle" /></div>
              <input type="range" min="1970" max="2026" value={lanzamiento.min} onChange={(event) => handleRange(event, 'lanzamiento', 'min')} className="thumb-input" style={{ zIndex: lanzamiento.min > 1998 ? 22 : 21 }} />
              <input type="range" min="1970" max="2026" value={lanzamiento.max} onChange={(event) => handleRange(event, 'lanzamiento', 'max')} className="thumb-input" style={{ zIndex: lanzamiento.min > 1998 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label uppercase">{lang === 'ES' ? 'DESARROLLADORES' : 'DEVELOPERS'}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="custom-select" onClick={() => setOpenDropdown(openDropdown === 'dev' ? null : 'dev')} role="button" tabIndex={0}>
                <span className={`selected-text ${!selectedDev ? 'placeholder' : ''}`}>{selectedDev || (sellerOptions[0] || t.dev)}</span>
                <FaChevronDown className={`arrow ${openDropdown === 'dev' ? 'up' : ''}`} />
                {openDropdown === 'dev' && (
                  <div className="options-panel">
                    {sellerOptions.map((name) => <div key={name} className="option" onClick={() => setSelectedDev(name)} role="button" tabIndex={0}>{name}</div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filtros;
