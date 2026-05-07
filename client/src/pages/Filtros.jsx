import { useEffect, useMemo, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { apiRequest } from '../api.js';
import './Filtros.css';

const Filtros = ({ lang }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [games, setGames] = useState([]);
  const [precio, setPrecio] = useState({ min: 1, max: 15 });
  const [alquiler, setAlquiler] = useState({ min: 1, max: 30 });
  const [rating, setRating] = useState({ min: 0, max: 5 });
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const t = {
    ES: {
      title: 'FILTROS DE BÚSQUEDA',
      subtitle: 'Usa los filtros disponibles para encontrar exactamente lo que buscas',
      precio: 'PRECIO',
      alquiler: 'ALQUILER',
      rating: 'VALORACIÓN',
      platform: 'PLATAFORMA',
      seller: 'VENDEDOR',
      day: 'DIA',
      days: 'DIAS',
      eur: 'EUR',
      all: 'Todos'
    },
    EN: {
      title: 'SEARCH FILTERS',
      subtitle: 'Use the available filters to find exactly what you are looking for',
      precio: 'PRICE',
      alquiler: 'RENTAL',
      rating: 'RATING',
      platform: 'PLATFORM',
      seller: 'SELLER',
      day: 'DAY',
      days: 'DAYS',
      eur: 'EUR',
      all: 'All'
    }
  }[lang];

  useEffect(() => {
    apiRequest('/api/games')
      .then((response) => setGames(response.games || []))
      .catch(() => setGames([]));
  }, []);

  const minPrice = useMemo(() => Math.floor(Math.min(...games.map((game) => Number(game.price) || 0), 15)), [games]);
  const maxPrice = useMemo(() => Math.ceil(Math.max(...games.map((game) => Number(game.price) || 0), 15)), [games]);
  const minRental = useMemo(() => Math.floor(Math.min(...games.map((game) => Number(game.rentalDays) || 1), 30)), [games]);
  const maxRental = useMemo(() => Math.ceil(Math.max(...games.map((game) => Number(game.rentalDays) || 1), 30)), [games]);
  const platforms = useMemo(() => Array.from(new Set(games.map((game) => game.platform).filter(Boolean))), [games]);
  const sellers = useMemo(() => Array.from(new Set(games.map((game) => game.seller?.name || game.seller).filter(Boolean))), [games]);

  useEffect(() => {
    setPrecio({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setAlquiler({ min: minRental, max: maxRental });
  }, [minRental, maxRental]);

  const handleRange = (event, type, edge) => {
    const value = parseFloat(event.target.value);
    const setter = type === 'precio' ? setPrecio : type === 'alquiler' ? setAlquiler : setRating;
    const current = type === 'precio' ? precio : type === 'alquiler' ? alquiler : rating;

    if (edge === 'min') {
      if (value <= current.max) {
        setter({ ...current, min: value });
      }
    } else if (value >= current.min) {
      setter({ ...current, max: value });
    }
  };

  const formatPrecio = () => (precio.min === precio.max ? `${precio.min} ${t.eur}` : `${precio.min} ${t.eur} - ${precio.max} ${t.eur}`);
  const formatAlquiler = () => {
    const minText = `${alquiler.min} ${alquiler.min === 1 ? t.day : t.days}`;
    const maxText = `${alquiler.max} ${t.days}`;
    return alquiler.min === alquiler.max ? minText : `${minText} - ${maxText}`;
  };
  const formatRating = () => (rating.min === rating.max ? `${rating.min.toFixed(1)} ★` : `${rating.min.toFixed(1)} ★ - ${rating.max.toFixed(1)} ★`);

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
              <h3 className="box-label">{t.precio}</h3>
              <p className="range-result-text">{formatPrecio()}</p>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{ left: `${((precio.min - 1) / 49) * 100}%`, right: `${100 - ((precio.max - 1) / 49) * 100}%` }}></div>
              <div className="thumb-container" style={{ left: `${((precio.min - 1) / 49) * 100}%` }}><div className="thumb-circle"></div></div>
              <div className="thumb-container" style={{ left: `${((precio.max - 1) / 49) * 100}%` }}><div className="thumb-circle"></div></div>
              <input type="range" min="1" max="50" value={precio.min} onChange={(event) => handleRange(event, 'precio', 'min')} className="thumb-input" style={{ zIndex: precio.min > 25 ? 22 : 21 }} />
              <input type="range" min="1" max="50" value={precio.max} onChange={(event) => handleRange(event, 'precio', 'max')} className="thumb-input" style={{ zIndex: precio.min > 25 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label">{t.rating}</h3>
              <p className="range-result-text">{formatRating()}</p>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{ left: `${(rating.min / 5) * 100}%`, right: `${100 - (rating.max / 5) * 100}%` }}></div>
              <div className="thumb-container" style={{ left: `${(rating.min / 5) * 100}%` }}><div className="thumb-circle"></div></div>
              <div className="thumb-container" style={{ left: `${(rating.max / 5) * 100}%` }}><div className="thumb-circle"></div></div>
              <input type="range" min="0" max="5" step="0.1" value={rating.min} onChange={(event) => handleRange(event, 'rating', 'min')} className="thumb-input" style={{ zIndex: rating.min > 2.5 ? 22 : 21 }} />
              <input type="range" min="0" max="5" step="0.1" value={rating.max} onChange={(event) => handleRange(event, 'rating', 'max')} className="thumb-input" style={{ zIndex: rating.min > 2.5 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label uppercase">{t.platform}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="custom-select" onClick={() => setOpenDropdown(openDropdown === 'platform' ? null : 'platform')}>
                <span className={`selected-text ${!selectedPlatform ? 'placeholder' : ''}`}>{selectedPlatform || t.all}</span>
                <FaChevronDown className={`arrow ${openDropdown === 'platform' ? 'up' : ''}`} />
                {openDropdown === 'platform' && (
                  <div className="options-panel">
                    <div className="option" onClick={() => setSelectedPlatform(null)}>{t.all}</div>
                    {platforms.map((platform) => (
                      <div key={platform} className="option" onClick={() => setSelectedPlatform(platform)}>{platform}</div>
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
              <div className="slider-track" style={{ left: `${((alquiler.min - 1) / 29) * 100}%`, right: `${100 - ((alquiler.max - 1) / 29) * 100}%` }}></div>
              <div className="thumb-container" style={{ left: `${((alquiler.min - 1) / 29) * 100}%` }}><div className="thumb-circle"></div></div>
              <div className="thumb-container" style={{ left: `${((alquiler.max - 1) / 29) * 100}%` }}><div className="thumb-circle"></div></div>
              <input type="range" min="1" max="30" value={alquiler.min} onChange={(event) => handleRange(event, 'alquiler', 'min')} className="thumb-input" style={{ zIndex: alquiler.min > 15 ? 22 : 21 }} />
              <input type="range" min="1" max="30" value={alquiler.max} onChange={(event) => handleRange(event, 'alquiler', 'max')} className="thumb-input" style={{ zIndex: alquiler.min > 15 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label uppercase">{t.seller}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="custom-select" onClick={() => setOpenDropdown(openDropdown === 'seller' ? null : 'seller')}>
                <span className={`selected-text ${!selectedSeller ? 'placeholder' : ''}`}>{selectedSeller || t.all}</span>
                <FaChevronDown className={`arrow ${openDropdown === 'seller' ? 'up' : ''}`} />
                {openDropdown === 'seller' && (
                  <div className="options-panel">
                    <div className="option" onClick={() => setSelectedSeller(null)}>{t.all}</div>
                    {sellers.map((seller) => (
                      <div key={seller} className="option" onClick={() => setSelectedSeller(seller)}>{seller}</div>
                    ))}
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
