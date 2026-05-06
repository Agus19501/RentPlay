import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import './Filtros.css';

const Filtros = ({ lang }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [precio, setPrecio] = useState({ min: 1, max: 15 });
  const [alquiler, setAlquiler] = useState({ min: 1, max: 30 });
  const [lanzamiento, setLanzamiento] = useState({ min: 1970, max: 2026 });
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [selectedDev, setSelectedDev] = useState(null);

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
  }[lang];

  const handleRange = (e, type, edge) => {
    const val = parseInt(e.target.value, 10);
    const setter = (type === 'precio' ? setPrecio : type === 'alquiler' ? setAlquiler : setLanzamiento);
    const state = (type === 'precio' ? precio : type === 'alquiler' ? alquiler : lanzamiento);

    if (edge === 'min') {
      if (val <= state.max) {
        setter({ ...state, min: val });
      }
    } else {
      if (val >= state.min) {
        setter({ ...state, max: val });
      }
    }
  };

  const formatPrecio = () => (precio.min === precio.max ? `${precio.min} ${t.eur}` : `${precio.min} ${t.eur} - ${precio.max} ${t.eur}`);
  const formatAlquiler = () => {
    const minText = `${alquiler.min} ${alquiler.min === 1 ? t.day : t.days}`;
    const maxText = `${alquiler.max} ${t.days}`;
    return alquiler.min === alquiler.max ? minText : `${minText} - ${maxText}`;
  };
  const formatLanzamiento = () => (lanzamiento.min === lanzamiento.max ? `${lanzamiento.min}` : `${lanzamiento.min} - ${lanzamiento.max}`);

  const genreNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
  const devNames = Array.from({ length: 20 }, (_, i) => `Ejemplo ${i + 1}`);

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
              <input type="range" min="1" max="50" value={precio.min} onChange={(e) => handleRange(e, 'precio', 'min')} className="thumb-input" style={{ zIndex: precio.min > 25 ? 22 : 21 }} />
              <input type="range" min="1" max="50" value={precio.max} onChange={(e) => handleRange(e, 'precio', 'max')} className="thumb-input" style={{ zIndex: precio.min > 25 ? 21 : 22 }} />
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
                  <label className="switch"><input type="checkbox" /><span className="slider-round"></span></label>
                </div>
                <div className="toggle-item">
                  <span>{t.gameVal}</span>
                  <label className="switch"><input type="checkbox" defaultChecked /><span className="slider-round"></span></label>
                </div>
              </div>
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label uppercase">{lang === 'ES' ? 'GÉNERO' : 'GENRE'}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="custom-select" onClick={() => setOpenDropdown(openDropdown === 'gen' ? null : 'gen')}>
                <span className={`selected-text ${!selectedGenreId ? 'placeholder' : ''}`}>
                  {selectedGenreId ? `${t.ejemplo} ${selectedGenreId}` : t.gen}
                </span>
                <FaChevronDown className={`arrow ${openDropdown === 'gen' ? 'up' : ''}`} />
                {openDropdown === 'gen' && (
                  <div className="options-panel">
                    {genreNumbers.map((num) => (
                      <div key={num} className="option" onClick={() => setSelectedGenreId(num)}>{t.ejemplo} {num}</div>
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
              <input type="range" min="1" max="30" value={alquiler.min} onChange={(e) => handleRange(e, 'alquiler', 'min')} className="thumb-input" style={{ zIndex: alquiler.min > 15 ? 22 : 21 }} />
              <input type="range" min="1" max="30" value={alquiler.max} onChange={(e) => handleRange(e, 'alquiler', 'max')} className="thumb-input" style={{ zIndex: alquiler.min > 15 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label">{t.año}</h3>
              <p className="range-result-text">{formatLanzamiento()}</p>
            </div>
            <div className="dual-slider-container">
              <div className="slider-track" style={{ left: `${((lanzamiento.min - 1970) / 56) * 100}%`, right: `${100 - ((lanzamiento.max - 1970) / 56) * 100}%` }}></div>
              <div className="thumb-container" style={{ left: `${((lanzamiento.min - 1970) / 56) * 100}%` }}><div className="thumb-circle"></div></div>
              <div className="thumb-container" style={{ left: `${((lanzamiento.max - 1970) / 56) * 100}%` }}><div className="thumb-circle"></div></div>
              <input type="range" min="1970" max="2026" value={lanzamiento.min} onChange={(e) => handleRange(e, 'lanzamiento', 'min')} className="thumb-input" style={{ zIndex: lanzamiento.min > 1998 ? 22 : 21 }} />
              <input type="range" min="1970" max="2026" value={lanzamiento.max} onChange={(e) => handleRange(e, 'lanzamiento', 'max')} className="thumb-input" style={{ zIndex: lanzamiento.min > 1998 ? 21 : 22 }} />
            </div>
          </div>

          <div className="filter-box">
            <div className="box-header-group">
              <h3 className="box-label uppercase">{lang === 'ES' ? 'DESARROLLADORES' : 'DEVELOPERS'}</h3>
            </div>
            <div className="centered-select-wrapper">
              <div className="custom-select" onClick={() => setOpenDropdown(openDropdown === 'dev' ? null : 'dev')}>
                <span className={`selected-text ${!selectedDev ? 'placeholder' : ''}`}>{selectedDev || t.dev}</span>
                <FaChevronDown className={`arrow ${openDropdown === 'dev' ? 'up' : ''}`} />
                {openDropdown === 'dev' && (
                  <div className="options-panel">
                    {devNames.map((name, i) => <div key={i} className="option" onClick={() => setSelectedDev(name)}>{name}</div>)}
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
