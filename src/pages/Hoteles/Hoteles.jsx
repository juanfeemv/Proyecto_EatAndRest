import React, { useState, useEffect } from 'react';
import * as utm from 'utm';
import './Hoteles.css';
import ReservaModal from '../../components/ReservaModal/ReservaModal';

const weatherCacheHotels = new Map();
const cityCacheHotels = new Map();

const weatherCodeLabels = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla helada',
  51: 'Llovizna ligera',
  53: 'Llovizna',
  55: 'Llovizna intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  71: 'Nieve ligera',
  73: 'Nieve',
  75: 'Nieve intensa',
  80: 'Chubascos ligeros',
  81: 'Chubascos',
  82: 'Chubascos fuertes',
  95: 'Tormenta',
  96: 'Tormenta ligera',
  99: 'Tormenta fuerte'
};

const toLatLonSafe = (north, east) => {
  try {
    if (Number.isNaN(north) || Number.isNaN(east)) return null;
    const res = utm.toLatLon(east, north, 30, 'N');
    if (Math.abs(res.latitude) <= 90 && Math.abs(res.longitude) <= 180) {
      return { lat: res.latitude, lng: res.longitude };
    }
    return null;
  } catch (err) {
    return null;
  }
};

const parseCoords = (item) => {
  const rawLat = item?.Latitud || item?.latitud || item?.LATITUD;
  const rawLng = item?.Longitud || item?.longitud || item?.LONGITUD;

  if (!rawLat || !rawLng) return null;

  const numLat = parseFloat(String(rawLat).replace(',', '.'));
  const numLng = parseFloat(String(rawLng).replace(',', '.'));

  const looksLikeLatLng = !Number.isNaN(numLat) && !Number.isNaN(numLng) && Math.abs(numLat) <= 90 && Math.abs(numLng) <= 180;
  if (looksLikeLatLng) {
    return { lat: numLat, lng: numLng };
  }

  const looksLikeUTM = (!Number.isNaN(numLat) && Math.abs(numLat) > 180) || (!Number.isNaN(numLng) && Math.abs(numLng) > 180);
  if (looksLikeUTM) {
    const first = toLatLonSafe(numLat, numLng);
    if (first) return first;
    const swapped = toLatLonSafe(numLng, numLat);
    if (swapped) return swapped;
  }

  return null;
};

const geocodeCity = async (municipio) => {
  if (!municipio) return null;
  const key = municipio.toLowerCase();
  if (cityCacheHotels.has(key)) return cityCacheHotels.get(key);

  const query = encodeURIComponent(`${municipio}, Murcia, España`);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=es&format=json&country=ES`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const first = data?.results?.[0];
  if (first?.latitude && first?.longitude) {
    const coords = { lat: first.latitude, lng: first.longitude };
    cityCacheHotels.set(key, coords);
    return coords;
  }
  return null;
};

const DEFAULT_COORDS = { lat: 37.9922, lng: -1.1307 }; // Murcia centro

const fetchCurrentWeather = async (lat, lng) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const cw = data?.current_weather;
  if (!cw) return null;
  return {
    temperature: cw.temperature,
    windspeed: cw.windspeed,
    code: cw.weathercode,
    label: weatherCodeLabels[cw.weathercode] || 'Tiempo actual'
  };
};

function Hoteles({ onBack }) {
  // Estado principal: datos, selección y paginado
  const [allHotels, setAllHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  // Estado loading eliminado (no se usaba)
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [weatherById, setWeatherById] = useState({});
  const [visibleCount, setVisibleCount] = useState(20);

  const [filters, setFilters] = useState({
    categoria: '',
    ubicacion: '',
    valoracion: '0',
    disponibilidad: 'todos'
  });

  const API_URL = 'https://nexo.carm.es/nexo/archivos/recursos/opendata/json/Hoteles.json';

  const getHotelCategory = (hotel) => {
    const nombre = hotel.Nombre.toLowerCase();
    if (nombre.includes('resort') || nombre.includes('spa') || nombre.includes('palace') ||
      nombre.includes('royal') || nombre.includes('luxury')) {
      return 5;
    } else if (nombre.includes('hotel') && (nombre.includes('boutique') || nombre.includes('premium'))) {
      return 4;
    } else if (nombre.includes('hotel')) {
      return 3;
    } else {
      return 2;
    }
  };

  const getHotelRating = (hotel) => {
    const code = parseInt(hotel.Código) || 0;
    const rating = 6.5 + ((code % 33) / 10);
    return Math.min(9.8, rating).toFixed(1);
  };

  const getAvailability = (hotel) => {
    const code = parseInt(hotel.Código) || 0;
    return code % 3 === 0 ? 'reserva' : 'disponible';
  };

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        // Descarga y enriquece catálogo de hoteles
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const cleanText = text.replace(/^\uFEFF/, '');
        const data = JSON.parse(cleanText);

        const enrichedData = data.map(hotel => ({
          ...hotel,
          category: getHotelCategory(hotel),
          rating: parseFloat(getHotelRating(hotel)),
          availability: getAvailability(hotel)
        }));

        setAllHotels(enrichedData);
        setFilteredHotels(enrichedData);

        const uniqueLocations = [...new Set(enrichedData.map(h => h.Municipio))].sort();
        setLocations(uniqueLocations);

      } catch (err) {
        setError(err.message);
      }
    };

    fetchHotels();
  }, []);

  useEffect(() => {
    const fetchWeatherForFiltered = async () => {
      if (!filteredHotels.length) return;

      const subset = filteredHotels.slice(0, visibleCount);
      const updates = {};

      await Promise.all(subset.map(async (hotel) => {
        // Prioriza coords del dataset; si no hay, geocodifica municipio
        let coords = parseCoords(hotel);
        if (!coords) {
          coords = await geocodeCity(hotel.Municipio);
        }
        if (!coords) {
          coords = DEFAULT_COORDS;
        }
        if (!coords) return;

        const cacheKey = `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;

        if (weatherCacheHotels.has(cacheKey)) {
          updates[hotel.Código] = weatherCacheHotels.get(cacheKey);
          return;
        }

        try {
          const weather = await fetchCurrentWeather(coords.lat, coords.lng);
          if (weather) {
            weatherCacheHotels.set(cacheKey, weather);
            updates[hotel.Código] = weather;
          } else {
            updates[hotel.Código] = { label: 'Sin datos', temperature: null };
          }
        } catch (err) {
          console.error('Error obteniendo el tiempo:', err);
          updates[hotel.Código] = { label: 'Sin datos', temperature: null };
        }
      }));

      if (Object.keys(updates).length) {
        setWeatherById((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchWeatherForFiltered();
  }, [filteredHotels, visibleCount]);

  const applyFilters = () => {
    let filtered = allHotels.filter(hotel => {
      if (filters.categoria && hotel.category != filters.categoria) return false;
      if (filters.ubicacion && hotel.Municipio !== filters.ubicacion) return false;
      if (parseFloat(filters.valoracion) && hotel.rating < parseFloat(filters.valoracion)) return false;
      if (filters.disponibilidad !== 'todos' && hotel.availability !== filters.disponibilidad) return false;
      return true;
    });
    setFilteredHotels(filtered);
    setVisibleCount(20);
  };

  const resetFilters = () => {
    setFilters({
      categoria: '',
      ubicacion: '',
      valoracion: '0',
      disponibilidad: 'todos'
    });
    setFilteredHotels(allHotels);
    setVisibleCount(20);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleReservaClick = (hotel) => {
    setSelectedHotel(hotel);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedHotel(null);
  };

  const categoryLabels = {
    5: 'LUJO',
    4: 'SUPERIOR',
    3: 'ESTÁNDAR',
    2: 'ECONÓMICO'
  };

  if (error) {
    return <div className="error">Error al cargar los hoteles: {error}</div>;
  }

  return (
    <div className="hoteles-page">
      <button className="back-button" onClick={onBack}>← Volver</button>

      <div className="header-section">
        <h1>Hoteles de Murcia</h1>
      </div>

      <div className="filters-container">
        <h3>Personaliza tu búsqueda</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              name="categoria"
              value={filters.categoria}
              onChange={handleFilterChange}
            >
              <option value="">Todas las categorías</option>
              <option value="5">Lujo</option>
              <option value="4">Superior</option>
              <option value="3">Estándar</option>
              <option value="2">Económico</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="ubicacion">Ubicación</label>
            <select
              id="ubicacion"
              name="ubicacion"
              value={filters.ubicacion}
              onChange={handleFilterChange}
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="valoracion">Valoración</label>
            <select
              id="valoracion"
              name="valoracion"
              value={filters.valoracion}
              onChange={handleFilterChange}
            >
              <option value="0">Todas</option>
              <option value="9">9+ Excepcional</option>
              <option value="8">8+ Muy bueno</option>
              <option value="7">7+ Bueno</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="disponibilidad">Disponibilidad</label>
            <select
              id="disponibilidad"
              name="disponibilidad"
              value={filters.disponibilidad}
              onChange={handleFilterChange}
            >
              <option value="todos">Todos</option>
              <option value="disponible">Disponible</option>
              <option value="reserva">Bajo reserva</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn-apply" onClick={applyFilters}>Buscar</button>
          <button className="btn-reset" onClick={resetFilters}>Limpiar</button>
        </div>
      </div>

      <div className="stats">
        {filteredHotels.length} alojamiento{filteredHotels.length !== 1 ? 's' : ''} encontrado{filteredHotels.length !== 1 ? 's' : ''}
      </div>

      <div className="container">
        {filteredHotels.length === 0 ? (
          <div className="no-results">No se encontraron hoteles con los filtros seleccionados</div>
        ) : (
          filteredHotels.slice(0, visibleCount).map(hotel => (
            <div key={hotel.Código} className="hotel-card">
              <div className="hotel-image-container">
                <img
                  src={hotel['Foto 1'] || 'https://via.placeholder.com/600x400?text=Sin+imagen'}
                  alt={hotel.Nombre}
                  className="hotel-image"
                />
                <div className="category-badge">{categoryLabels[hotel.category]}</div>
              </div>
              <div className="hotel-details">
                <h2 className="hotel-title">{hotel.Nombre}</h2>
                <div className="hotel-meta">
                  <span className="hotel-location">📍 {hotel.Municipio}</span>
                  <span className="hotel-rating">⭐ {hotel.rating}</span>
                  <span className="weather-badge">
                    {weatherById[hotel.Código]
                      ? (
                        <>
                          🌤️ {weatherById[hotel.Código].temperature !== null && weatherById[hotel.Código].temperature !== undefined
                            ? `${Math.round(weatherById[hotel.Código].temperature)}°C`
                            : '--'}
                          {` · ${weatherById[hotel.Código].label || 'Tiempo'}`}
                        </>
                      )
                      : '🌤️ Cargando tiempo...'}
                  </span>
                </div>
                <button className="reservar-btn" onClick={() => handleReservaClick(hotel)}>RESERVAR</button>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredHotels.length > visibleCount && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={() => setVisibleCount((v) => v + 20)}>
            Cargar más
          </button>
        </div>
      )}

      {selectedHotel && (
        <ReservaModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          item={selectedHotel}
          tipo="hotel"
        />
      )}
    </div>
  );
}

export default Hoteles;
