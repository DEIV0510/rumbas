/*
 * Genera las imágenes optimizadas de la landing a partir de las piezas originales.
 * Los originales no se modifican: solo se leen, se recortan (sin retocar rostros
 * ni logos) y se exportan en AVIF, WebP y JPG a los anchos que usa la página.
 *
 * Uso (necesita sharp: npm i sharp):
 *   node tools/optimizar-imagenes.cjs
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const RAIZ = path.join(__dirname, '..');
const SALIDA = path.join(RAIZ, 'assets', 'img');
const wa = (hora) => path.join(RAIZ, `WhatsApp Image 2026-10-27 at ${hora}.jpeg`);

// Recortes medidos sobre cada flyer: solo la zona fotográfica, sin los textos del cartel.
const PIEZAS = [
  // Flyer nocturno 900x1600: artistas del festival frente a la ciudad amurallada.
  { nombre: 'festival-artistas', origen: wa('1.21.38 PM'), recorte: { left: 0, top: 232, width: 900, height: 672 }, anchos: [480, 720, 900] },
  // Flyer 720x1280 con la lancha (entre la franja de fechas y la de precio).
  { nombre: 'festival-lancha', origen: wa('1.22.00 PM (2)'), recorte: { left: 0, top: 606, width: 720, height: 379 }, anchos: [480, 720] },
  // Flyer 720x1280 con el pontón.
  { nombre: 'festival-ponton', origen: wa('1.22.01 PM'), recorte: { left: 62, top: 766, width: 580, height: 200 }, anchos: [580] },
  // Flyer 720x1280 con la plataforma flotante.
  { nombre: 'remate-plataforma-flotante', origen: wa('1.22.00 PM (1)'), recorte: { left: 0, top: 708, width: 720, height: 277 }, anchos: [480, 720] },
  // Flyer del Remate 720x1280: Natalia París, Bar flotante Amarillo y Marco Lasso.
  { nombre: 'remate-natalia-paris', origen: wa('1.21.48 PM'), recorte: { left: 0, top: 212, width: 720, height: 648 }, anchos: [480, 720] },
];

async function exportar({ nombre, origen, recorte, anchos }) {
  const base = sharp(origen).extract(recorte);
  const buffer = await base.toBuffer();
  const mayor = Math.max(...anchos);
  for (const ancho of anchos) {
    const img = () => sharp(buffer).resize({ width: ancho, withoutEnlargement: true });
    await img().avif({ quality: 60, effort: 6 }).toFile(path.join(SALIDA, `${nombre}-${ancho}.avif`));
    await img().webp({ quality: 82, effort: 6 }).toFile(path.join(SALIDA, `${nombre}-${ancho}.webp`));
    if (ancho === mayor) {
      await img().jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(SALIDA, `${nombre}-${ancho}.jpg`));
    }
  }
}

async function logoYFavicons() {
  const logo = path.join(RAIZ, 'Logo Rumbasdelaciudad.png');
  await sharp(logo).webp({ quality: 90, alphaQuality: 80, effort: 6 }).toFile(path.join(SALIDA, 'logo-rumbas-de-la-ciudad.webp'));

  // La «M» naranja del logo, centrada sobre negro, como ícono del sitio.
  const m = await sharp(logo).extract({ left: 192, top: 10, width: 126, height: 88 }).toBuffer();
  // La M mide 126 px en el original: no se generan íconos más grandes para no ampliarla.
  for (const [archivo, lado] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180]]) {
    const interior = Math.round(lado * 0.84);
    const marca = await sharp(m).resize({ width: interior, height: interior, fit: 'inside' }).toBuffer();
    await sharp({ create: { width: lado, height: lado, channels: 4, background: '#08090B' } })
      .composite([{ input: marca, gravity: 'center' }])
      .png()
      .toFile(path.join(RAIZ, archivo));
  }
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  for (const pieza of PIEZAS) await exportar(pieza);
  await logoYFavicons();
  for (const f of fs.readdirSync(SALIDA)) {
    console.log(f.padEnd(44), (fs.statSync(path.join(SALIDA, f)).size / 1024).toFixed(1) + ' KB');
  }
})();
