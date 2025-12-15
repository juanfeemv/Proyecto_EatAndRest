import React, { useState, useEffect } from 'react';
import './Hoteles.css';
import ReservaModal from './ReservaModal';

function Hoteles({ onBack }) {
  const [allHotels, setAllHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

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

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const applyFilters = () => {
    let filtered = allHotels.filter(hotel => {
      if (filters.categoria && hotel.category != filters.categoria) return false;
      if (filters.ubicacion && hotel.Municipio !== filters.ubicacion) return false;
      if (parseFloat(filters.valoracion) && hotel.rating < parseFloat(filters.valoracion)) return false;
      if (filters.disponibilidad !== 'todos' && hotel.availability !== filters.disponibilidad) return false;
      return true;
    });
    setFilteredHotels(filtered);
  };

  const resetFilters = () => {
    setFilters({
      categoria: '',
      ubicacion: '',
      valoracion: '0',
      disponibilidad: 'todos'
    });
    setFilteredHotels(allHotels);
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

  const availabilityLabels = {
    'disponible': '✓ Disponible',
    'reserva': '⏰ Bajo reserva'
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
          filteredHotels.map(hotel => (
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
                </div>
                <button className="reservar-btn" onClick={() => handleReservaClick(hotel)}>RESERVAR</button>
              </div>
            </div>
          ))
        )}
      </div>

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
