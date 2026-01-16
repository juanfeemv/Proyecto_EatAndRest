# Eat & Rest · Murcia
## Datos de hoteles y restaurantes
- Fuente: Open Data Región de Murcia.
	- Hoteles: `https://nexo.carm.es/nexo/archivos/recursos/opendata/json/Hoteles.json`
	- Restaurantes: `https://nexo.carm.es/nexo/archivos/recursos/opendata/json/Restaurantes.json`
- Los utilizo con:
	- Categorización y rating.
	- Conversión de coordenadas: si vienen en UTM se convierten a lat/lon con la librería [`utm`](https://www.npmjs.com/package/utm); si faltan coordenadas se codifica el municipio con la API pública de Open‑Meteo.

## API del tiempo (Open‑Meteo)
- Servicio: `https://api.open-meteo.com/v1/forecast` con `current_weather=true`.
- Geocodificación de respaldo: `https://geocoding-api.open-meteo.com/v1/search` para obtener lat/lon por municipio.
- Sin API key. Se cachean resultados por coordenada y solo se consulta para los primeros 20 ítems visibles.

## Pasarela de pagos (Stripe)
- Se usa un Payment Link/Checkout URL en modo test. Configura en `.env.local`:
	VITE_STRIPE_CHECKOUT_URL=https://checkout.stripe.com/c/pay_xxx   # URL de tu Payment Link o Session de prueba

- En el modal, tras guardar la reserva en `localStorage`, se redirige a esa URL.

## Google Maps
- Embed con `<iframe>` apuntando a `https://www.google.com/maps?q=lat,lng&output=embed`.
- Prioriza lat/lon del dataset; si están en UTM se convierten con `utm`; si no hay coordenadas válidas, usa el texto de la dirección/nombre para que Google Maps busque la ubicación.

## Variables de entorno
Crea `.env.local` en la raíz con la URL de Stripe:
```
VITE_STRIPE_CHECKOUT_URL=https://checkout.stripe.com/c/pay_xxx
```

## Notas
- No es necesario API key para Open‑Meteo ni para el embed de Google Maps.
- Si quieres pasar a un checkout dinámico con importes variables, necesitarás un backend que cree sesiones de Stripe con la clave secreta.
