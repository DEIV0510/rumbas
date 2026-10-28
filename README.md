# Rumbas de la Ciudad · Festival Náutico Cartagena 2026

Landing de una sola página para reservar el Festival Náutico (13 y 14 de noviembre) y el Remate Ultra Privado (15 de noviembre). Todas las reservas abren WhatsApp (310 400 1919) con el mensaje ya escrito.

HTML, CSS y JS sin dependencias: se publica tal cual (Vercel, Netlify, GitHub Pages o cualquier hosting estático).

## Estructura

- `index.html`: la página.
- `assets/css/styles.css`, `assets/js/main.js`: estilos e interacción (mensajes de WhatsApp, selector de fechas, armador de reserva y animaciones).
- `assets/img/`: recortes optimizados (AVIF, WebP y JPG) de los flyers originales, el logo y la imagen para compartir.
- `assets/fonts/`: Archivo variable (licencia OFL).
- Los flyers y el logo originales están en la raíz, sin modificar.

## Herramientas

- `node tools/servidor-local.cjs`: sirve la página en http://localhost:5540.
- `node tools/optimizar-imagenes.cjs`: vuelve a generar las imágenes desde los originales (necesita `npm i sharp`).
- `node tools/generar-og.mjs`: vuelve a generar la imagen para compartir desde `tools/og.html` (necesita el servidor local, `playwright-core` y `sharp`).

## Pendiente al publicar

Cuando haya dominio definitivo, poner la URL absoluta en `og:image` y agregar `og:url` y `canonical` en el `<head>`.
