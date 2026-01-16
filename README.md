# Eat & Rest · Murcia
## Datos de hoteles y restaurantes
- Fuente Open Data Región de Murcia:
	- Hoteles: https://nexo.carm.es/nexo/archivos/recursos/opendata/json/Hoteles.json (descarga y enriquecimiento en [src/pages/Hoteles/Hoteles.jsx](src/pages/Hoteles/Hoteles.jsx))
	- Restaurantes: https://nexo.carm.es/nexo/archivos/recursos/opendata/json/Restaurantes.json (descarga y enriquecimiento en [src/pages/Restaurantes/Restaurantes.jsx](src/pages/Restaurantes/Restaurantes.jsx))
- Coordenadas: intento de UTM→lat/lon con `utm` en [Hoteles](src/pages/Hoteles/Hoteles.jsx) y [Restaurantes](src/pages/Restaurantes/Restaurantes.jsx);
  si faltan coords, geocodificación por municipio con Open‑Meteo en [Hoteles](src/pages/Hoteles/Hoteles.jsx) y [Restaurantes](src/pages/Restaurantes/Restaurantes.jsx).

## API del tiempo (Open‑Meteo)
- Endpoint forecast: https://api.open-meteo.com/v1/forecast con `current_weather=true`, cacheado por coordenada, en [Hoteles](src/pages/Hoteles/Hoteles.jsx) y [Restaurantes](src/pages/Restaurantes/Restaurantes.jsx).
- Geocoding de respaldo: https://geocoding-api.open-meteo.com/v1/search para obtener lat/lon a partir del municipio (ver arriba).
- Se limita a los primeros 20 ítems visibles mediante `visibleCount` en [Hoteles](src/pages/Hoteles/Hoteles.jsx) y [Restaurantes](src/pages/Restaurantes/Restaurantes.jsx).

## Google Maps
- Embed vía `<iframe>` con `https://www.google.com/maps?q=lat,lng&output=embed`, priorizando coords válidas; si no, búsqueda textual con el nombre/dirección. Implementado en [src/components/ReservaModal/ReservaModal.jsx](src/components/ReservaModal/ReservaModal.jsx).

## Notas
- No es necesario API key para Open‑Meteo ni para el embed de Google Maps.
