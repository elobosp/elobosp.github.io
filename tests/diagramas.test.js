import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const proyectos = JSON.parse(readFileSync(new URL('data/proyectos.json', raiz), 'utf8'));

for (const p of proyectos) {
  test(`diagrama ${p.slug}: existe y cumple la convención`, () => {
    const url = new URL(p.diagrama, raiz);
    assert.ok(existsSync(url), `falta ${p.diagrama}`);
    const svg = readFileSync(url, 'utf8');

    assert.match(svg, /<svg[^>]*viewBox="/);
    assert.match(svg, /<svg[^>]*role="img"/);
    assert.match(svg, new RegExp(`<svg[^>]*aria-labelledby="t-${p.slug}"`));
    assert.match(svg, new RegExp(`<title id="t-${p.slug}">[^<]+</title>`));

    // Colores solo desde CSS (paleta del sitio) y nada ejecutable o externo.
    for (const prohibido of [/fill="#/, /stroke="#/, /style=/, /<script/i, /<image/i, /href="http/i, /<foreignObject/i]) {
      assert.doesNotMatch(svg, prohibido, `${p.slug}: ${prohibido}`);
    }

    // Los ids deben incluir el slug: varios SVG conviven inline en la misma página.
    for (const [, id] of svg.matchAll(/id="([^"]+)"/g)) {
      assert.ok(id.includes(p.slug), `${p.slug}: id "${id}" sin slug`);
    }

    assert.match(svg, /class="nodo nodo--principal"/, `${p.slug}: falta nodo principal`);
  });
}
