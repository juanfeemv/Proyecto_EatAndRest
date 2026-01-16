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

## Pasarela de pagos (Stripe)
- Usa un Payment Link/Checkout URL de prueba configurado en `.env.local` (señalado en [src/components/ReservaModal/ReservaModal.jsx](src/components/ReservaModal/ReservaModal.jsx)):
	VITE_STRIPE_CHECKOUT_URL=https://checkout.stripe.com/c/pay_xxx
- Tras guardar la reserva en `localStorage`, el modal redirige a esa URL (misma sección de líneas arriba).

## Google Maps
- Embed vía `<iframe>` con `https://www.google.com/maps?q=lat,lng&output=embed`, priorizando coords válidas; si no, búsqueda textual con el nombre/dirección. Implementado en [src/components/ReservaModal/ReservaModal.jsx](src/components/ReservaModal/ReservaModal.jsx).

## Variables de entorno
Crea `.env.local` en la raíz con la URL de Stripe:
```
VITE_STRIPE_CHECKOUT_URL=https://checkout.stripe.com/c/pay_xxx
```

## Notas
- No es necesario API key para Open‑Meteo ni para el embed de Google Maps.
- Para un checkout dinámico necesitarás backend que cree sesiones de Stripe con la clave secreta.
