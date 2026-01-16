import React, { useState, useEffect } from 'react';
import * as utm from 'utm';
import './Restaurantes.css';
import ReservaModal from '../../components/ReservaModal/ReservaModal';

const weatherCacheRestaurants = new Map();
const cityCacheRestaurants = new Map();

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
  if (cityCacheRestaurants.has(key)) return cityCacheRestaurants.get(key);

  const query = encodeURIComponent(`${municipio}, Murcia, España`);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=es&format=json&country=ES`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const first = data?.results?.[0];
  if (first?.latitude && first?.longitude) {
    const coords = { lat: first.latitude, lng: first.longitude };
    cityCacheRestaurants.set(key, coords);
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

function Restaurantes({ onBack }) {
  // Estado principal: datos, selección y paginado
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  // Estado loading eliminado (no se usaba)
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [weatherById, setWeatherById] = useState({});
  const [visibleCount, setVisibleCount] = useState(20);

  const [filters, setFilters] = useState({
    tipo: '',
    ubicacion: '',
    valoracion: '0',
    disponibilidad: 'todos'
  });

  const API_URL = 'https://nexo.carm.es/nexo/archivos/recursos/opendata/json/Restaurantes.json';

  const getRestaurantCategory = (restaurant) => {
    const nombre = restaurant.Nombre.toLowerCase();
    // Ejemplo de categorización arbitraria:
    if (nombre.includes('gourmet') || nombre.includes('chef') || nombre.includes('premium')) {
      return 5;
    } else if (nombre.includes('restaurante') && (nombre.includes('típico') || nombre.includes('tradicional'))) {
      return 4;
    } else if (nombre.includes('restaurante')) {
      return 3;
    } else {
      return 2;
    }
  };

  const getRestaurantRating = (restaurant) => {
    const code = parseInt(restaurant.Código) || 0;
    const rating = 6.0 + ((code % 30) / 10);
    return Math.min(9.5, rating).toFixed(1);
  };

  // Por ejemplo, disponibilidad según código % 3
  const getAvailability = (restaurant) => {
    const code = parseInt(restaurant.Código) || 0;
    return code % 3 === 0 ? 'reservado' : 'disponible';
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Descarga y enriquece catálogo de restaurantes
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const cleanText = text.replace(/^\uFEFF/, '');
        const data = JSON.parse(cleanText);

        const enrichedData = data.map(restaurant => ({
          ...restaurant,
          category: getRestaurantCategory(restaurant),
          rating: parseFloat(getRestaurantRating(restaurant)),
          availability: getAvailability(restaurant)
        }));

        setAllRestaurants(enrichedData);
        setFilteredRestaurants(enrichedData);

        const uniqueLocations = [...new Set(enrichedData.map(r => r.Municipio))].sort();
        setLocations(uniqueLocations);

      } catch (err) {
        setError(err.message);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const fetchWeatherForFiltered = async () => {
      if (!filteredRestaurants.length) return;

      const subset = filteredRestaurants.slice(0, visibleCount);
      const updates = {};

      await Promise.all(subset.map(async (restaurant) => {
        // Prioriza coords del dataset; si no hay, geocodifica municipio
        let coords = parseCoords(restaurant);
        if (!coords) {
          coords = await geocodeCity(restaurant.Municipio);
        }
        if (!coords) {
          coords = DEFAULT_COORDS;
        }
        if (!coords) return;

        const cacheKey = `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;

        if (weatherCacheRestaurants.has(cacheKey)) {
          updates[restaurant.Código] = weatherCacheRestaurants.get(cacheKey);
          return;
        }

        try {
          const weather = await fetchCurrentWeather(coords.lat, coords.lng);
          if (weather) {
            weatherCacheRestaurants.set(cacheKey, weather);
            updates[restaurant.Código] = weather;
          } else {
            updates[restaurant.Código] = { label: 'Sin datos', temperature: null };
          }
        } catch (err) {
          console.error('Error obteniendo el tiempo:', err);
          updates[restaurant.Código] = { label: 'Sin datos', temperature: null };
        }
      }));

      if (Object.keys(updates).length) {
        setWeatherById((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchWeatherForFiltered();
  }, [filteredRestaurants, visibleCount]);

  const applyFilters = () => {
    let filtered = allRestaurants.filter(restaurant => {
      if (filters.tipo && restaurant.category != filters.tipo) return false;
      if (filters.ubicacion && restaurant.Municipio !== filters.ubicacion) return false;
      if (parseFloat(filters.valoracion) && restaurant.rating < parseFloat(filters.valoracion)) return false;
      if (filters.disponibilidad !== 'todos' && restaurant.availability !== filters.disponibilidad) return false;
      return true;
    });
    setFilteredRestaurants(filtered);
    setVisibleCount(20);
  };

  const resetFilters = () => {
    setFilters({
      tipo: '',
      ubicacion: '',
      valoracion: '0',
      disponibilidad: 'todos'
    });
    setFilteredRestaurants(allRestaurants);
    setVisibleCount(20);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleReservaClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRestaurant(null);
  };

  const categoryLabels = {
    5: 'GOURMET',
    4: 'TRADICIONAL',
    3: 'ESTÁNDAR',
    2: 'ECONÓMICO'
  };

  if (error) {
    return <div className="error">Error al cargar los restaurantes: {error}</div>;
  }

  return (
    <div className="restaurantes-page">
      <button className="back-button" onClick={onBack}>← Volver</button>

      <div className="header-section">
        <h1>Restaurantes de Murcia</h1>
      </div>

      <div className="filters-container">
        <h3>Personaliza tu búsqueda</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              name="tipo"
              value={filters.tipo}
              onChange={handleFilterChange}
            >
              <option value="">Todos los tipos</option>
              <option value="5">Gourmet</option>
              <option value="4">Tradicional</option>
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
              <option value="reservado">Reservado</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn-apply" onClick={applyFilters}>Buscar</button>
          <button className="btn-reset" onClick={resetFilters}>Limpiar</button>
        </div>
      </div>

      <div className="stats">
        {filteredRestaurants.length} restaurante{filteredRestaurants.length !== 1 ? 's' : ''} encontrado{filteredRestaurants.length !== 1 ? 's' : ''}
      </div>

      <div className="container">
        {filteredRestaurants.length === 0 ? (
          <div className="no-results">No se encontraron restaurantes con los filtros seleccionados</div>
        ) : (
          filteredRestaurants.slice(0, visibleCount).map(restaurant => (
            <div key={restaurant.Código} className="restaurant-card">
              <div className="restaurant-image-container">
                <img
                  src={restaurant['Foto 1'] || 'https://via.placeholder.com/600x400?text=Sin+imagen'}
                  alt={restaurant.Nombre}
                  className="restaurant-image"
                />
                <div className="category-badge">{categoryLabels[restaurant.category]}</div>
              </div>
              <div className="restaurant-details">
                <h2 className="restaurant-title">{restaurant.Nombre}</h2>
                <div className="restaurant-meta">
                  <span className="restaurant-location">📍 {restaurant.Municipio}</span>
                  <span className="restaurant-rating">⭐ {restaurant.rating}</span>
                  <span className="weather-badge">
                    {weatherById[restaurant.Código]
                      ? (
                        <>
                          🌤️ {weatherById[restaurant.Código].temperature !== null && weatherById[restaurant.Código].temperature !== undefined
                            ? `${Math.round(weatherById[restaurant.Código].temperature)}°C`
                            : '--'}
                          {` · ${weatherById[restaurant.Código].label || 'Tiempo'}`}
                        </>
                      )
                      : '🌤️ Cargando tiempo...'}
                  </span>
                </div>
                <button className="reservar-btn" onClick={() => handleReservaClick(restaurant)}>RESERVAR</button>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredRestaurants.length > visibleCount && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={() => setVisibleCount((v) => v + 20)}>
            Cargar más
          </button>
        </div>
      )}

      {selectedRestaurant && (
        <ReservaModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          item={selectedRestaurant}
          tipo="restaurante"
        />
      )}
    </div>
  );
}

export default Restaurantes;
