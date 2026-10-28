/*
 * Captura tools/og.html a 1200x630 y la guarda como assets/img/og-festival-nautico.jpg.
 * Requiere el servidor local encendido (node tools/servidor-local.cjs) y playwright-core + sharp.
 * Uso: node tools/generar-og.mjs [ruta-de-chrome]
 */
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.argv[2] || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('http://localhost:5540/tools/og.html');
await page.evaluate(() => document.fonts.load('820 100px Archivo'));
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
const png = await page.screenshot();
await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(raiz, 'assets', 'img', 'og-festival-nautico.jpg'));
await browser.close();
console.log('og-festival-nautico.jpg lista');
