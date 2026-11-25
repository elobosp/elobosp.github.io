// Chequeos estáticos de index.html y styles.css que no cubre el render.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const html = leer('index.html');
const css = leer('css/styles.css');

test('noscript ofrece CV, correo, LinkedIn y GitHub', () => {
  const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? '';
  for (const enlace of ['assets/cv/cv-es.pdf', 'mailto:', 'linkedin.com/in/elobosp', 'github.com/elobosp']) {
    assert.ok(noscript.includes(enlace), `noscript sin ${enlace}`);
  }
});

test('el atributo hidden oculta aunque una clase fije display', () => {
  assert.match(css, /\[hidden\][^{]*\{[^}]*display:\s*none\s*!important/);
});
