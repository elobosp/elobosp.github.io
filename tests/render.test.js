import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml, filterProjects, renderRow, renderDetail, renderTimeline, renderStack, cvLink,
} from '../js/render.js';

const dicts = {
  es: {
    estado: { prod: 'prod', lab: 'lab' },
    proyecto: { problema: 'Problema', solucion: 'Qué hice', resultado: 'Resultado' },
    cv: { descargar: 'Descargar CV', soloEspanol: 'CV (español)' },
  },
  en: {
    estado: { prod: 'prod', lab: 'lab' },
    proyecto: { problema: 'Problem', solucion: 'What I did', resultado: 'Outcome' },
    cv: { descargar: 'Download CV', soloEspanol: 'CV (Spanish)' },
  },
};

const proyecto = (over = {}) => ({
  slug: 'demo',
  nombre: 'demo-api',
  perfiles: ['backend'],
  estado: 'prod',
  stack: ['go', 'docker'],
  commits: 12,
  diagrama: 'assets/diagramas/demo.svg',
  titulo: { es: 'Demo', en: 'Demo' },
  problema: { es: 'Problema ES', en: 'Problem EN' },
  solucion: { es: 'Solución ES', en: 'Solution EN' },
  resultado: { es: 'Resultado ES' },
  ...over,
});

test('escapeHtml escapa & < > " \'', () => {
  assert.equal(escapeHtml('<a href="x">&\''), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('filterProjects: todos devuelve todo en orden', () => {
  const ps = [proyecto({ slug: 'a' }), proyecto({ slug: 'b' })];
  assert.deepEqual(filterProjects(ps, 'todos').map((p) => p.slug), ['a', 'b']);
});

test('filterProjects: por perfil conserva orden', () => {
  const ps = [
    proyecto({ slug: 'a', perfiles: ['devops'] }),
    proyecto({ slug: 'b', perfiles: ['backend'] }),
    proyecto({ slug: 'c', perfiles: ['backend', 'devops'] }),
  ];
  assert.deepEqual(filterProjects(ps, 'devops').map((p) => p.slug), ['a', 'c']);
});

test('renderRow: estado prod y commits null → —', () => {
  const html = renderRow(proyecto({ commits: null }), 'es', dicts);
  assert.match(html, /estado--prod/);
  assert.match(html, />—</);
  assert.match(html, /data-slug="demo"/);
});

test('renderRow: el control accesible es un button, no el tr', () => {
  const html = renderRow(proyecto(), 'es', dicts);
  assert.match(html, /<button type="button" class="fila-boton" aria-expanded="false" aria-controls="det-demo">/);
  const tr = html.match(/<tr[^>]*>/)[0];
  assert.doesNotMatch(tr, /aria-expanded|tabindex/);
});

test('renderRow: stack unido con ·', () => {
  assert.match(renderRow(proyecto(), 'es', dicts), /go · docker/);
});

test('renderRow escapa el nombre', () => {
  const html = renderRow(proyecto({ nombre: '<x>' }), 'es', dicts);
  assert.match(html, /&lt;x&gt;/);
  assert.doesNotMatch(html, /<x>/);
});

test('renderDetail con svg lo incluye en figure', () => {
  const html = renderDetail(proyecto(), 'es', dicts, '<svg id="s"></svg>');
  assert.match(html, /<figure class="diagrama"><svg id="s"><\/svg><\/figure>/);
  assert.match(html, /id="det-demo"/);
  assert.match(html, /hidden/);
});

test('renderDetail con svg null no tiene figure pero sí los 3 textos', () => {
  const html = renderDetail(proyecto(), 'es', dicts, null);
  assert.doesNotMatch(html, /<figure/);
  for (const s of ['Problema ES', 'Solución ES', 'Resultado ES']) assert.ok(html.includes(s), s);
});

test('renderDetail usa en y cae a es si falta', () => {
  const html = renderDetail(proyecto(), 'en', dicts, null);
  assert.ok(html.includes('Problem EN'));
  assert.ok(html.includes('What I did'));
  assert.ok(html.includes('Resultado ES'));
});

test('renderDetail no contiene enlaces', () => {
  assert.doesNotMatch(renderDetail(proyecto(), 'es', dicts, '<svg></svg>'), /<a[\s>]/);
});

test('cvLink: es → cv-es', () => {
  const cv = { es: 'assets/cv/cv-es.pdf', en: 'assets/cv/cv-en.pdf' };
  assert.deepEqual(cvLink(cv, 'es', dicts), { href: 'assets/cv/cv-es.pdf', label: 'Descargar CV' });
  assert.deepEqual(cvLink(cv, 'en', dicts), { href: 'assets/cv/cv-en.pdf', label: 'Download CV' });
});

test('cvLink: en sin cv-en → cv-es con etiqueta CV (Spanish)', () => {
  assert.deepEqual(cvLink({ es: 'assets/cv/cv-es.pdf', en: null }, 'en', dicts), {
    href: 'assets/cv/cv-es.pdf', label: 'CV (Spanish)',
  });
});

test('cvLink: sin cv-es → null', () => {
  assert.equal(cvLink({ es: null, en: null }, 'es', dicts), null);
  assert.equal(cvLink({ es: null, en: 'x.pdf' }, 'en', dicts), null);
});

test('renderTimeline conserva orden y traduce', () => {
  const items = [
    { periodo: { es: '2024 – hoy', en: '2024 – now' }, cargo: { es: 'Uno', en: 'One' }, empresa: 'A', resumen: { es: 'r1', en: 'r1' } },
    { periodo: { es: '2022', en: '2022' }, cargo: { es: 'Dos', en: 'Two' }, empresa: 'B', resumen: { es: 'r2' } },
  ];
  const html = renderTimeline(items, 'en');
  assert.match(html, /^<ol class="trayectoria">/);
  assert.ok(html.indexOf('One') < html.indexOf('Two'));
  assert.ok(html.includes('2024 – now'));
});

test('renderStack lista grupos e items', () => {
  const html = renderStack([{ grupo: { es: 'Lenguajes', en: 'Languages' }, items: ['Go', 'C++'] }], 'en');
  assert.ok(html.includes('Languages'));
  assert.ok(html.includes('Go') && html.includes('C++'));
});
