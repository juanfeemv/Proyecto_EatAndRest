import React, { useState, useEffect } from 'react';
import './Restaurantes.css';

function Restaurantes({ onBack }) {
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);

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

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const applyFilters = () => {
    let filtered = allRestaurants.filter(restaurant => {
      if (filters.tipo && restaurant.category != filters.tipo) return false;
      if (filters.ubicacion && restaurant.Municipio !== filters.ubicacion) return false;
      if (parseFloat(filters.valoracion) && restaurant.rating < parseFloat(filters.valoracion)) return false;
      if (filters.disponibilidad !== 'todos' && restaurant.availability !== filters.disponibilidad) return false;
      return true;
    });
    setFilteredRestaurants(filtered);
  };

  const resetFilters = () => {
    setFilters({
      tipo: '',
      ubicacion: '',
      valoracion: '0',
      disponibilidad: 'todos'
    });
    setFilteredRestaurants(allRestaurants);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const categoryLabels = {
    5: 'GOURMET',
    4: 'TRADICIONAL',
    3: 'ESTÁNDAR',
    2: 'ECONÓMICO'
  };

  const availabilityLabels = {
    'disponible': '✓ Disponible',
    'reservado': '⏰ Reservado'
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
          filteredRestaurants.map(restaurant => (
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
                </div>
                <button className="reservar-btn">RESERVAR</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Restaurantes;
