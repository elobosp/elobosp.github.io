import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const leer = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));

const es = leer('data/i18n/es.json');
const en = leer('data/i18n/en.json');
const perfil = leer('data/perfil.json');
const proyectos = leer('data/proyectos.json');

const PERFILES = ['backend', 'fullstack', 'devops', 'ia'];
const ESTADOS = ['prod', 'lab'];

function aplanar(obj, prefijo = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? aplanar(v, `${prefijo}${k}.`) : [[`${prefijo}${k}`, v]]);
}

const bilingue = (v) => v && typeof v.es === 'string' && v.es.trim() && typeof v.en === 'string' && v.en.trim();

test('i18n: es y en tienen las mismas claves, sin valores vacíos', () => {
  const kEs = aplanar(es);
  const kEn = aplanar(en);
  assert.deepEqual(kEs.map(([k]) => k).sort(), kEn.map(([k]) => k).sort());
  for (const [k, v] of [...kEs, ...kEn]) assert.ok(typeof v === 'string' && v.trim(), `vacío: ${k}`);
});

test('i18n: contiene las claves que usa la página', () => {
  const claves = new Set(aplanar(es).map(([k]) => k));
  const requeridas = [
    'nav.proyectos', 'nav.trayectoria', 'nav.stack', 'nav.contacto',
    'hero.disponible', 'hero.github', 'hero.linkedin', 'hero.deploy',
    'pipeline.commit', 'pipeline.build', 'pipeline.test', 'pipeline.deploy',
    'proyectos.titulo', 'proyectos.comando', 'proyectos.filtro.todos', 'proyectos.filtro.backend',
    'proyectos.filtro.fullstack', 'proyectos.filtro.devops', 'proyectos.filtro.ia',
    'proyectos.col.nombre', 'proyectos.col.stack', 'proyectos.col.estado', 'proyectos.col.commits',
    'estado.prod', 'estado.lab', 'proyecto.problema', 'proyecto.solucion', 'proyecto.resultado',
    'trayectoria.titulo', 'stack.titulo', 'formacion.titulo', 'formacion.publicacion',
    'contacto.titulo', 'contacto.texto', 'cv.descargar', 'cv.soloEspanol',
    'meta.title', 'meta.description', 'noscript',
  ];
  for (const k of requeridas) assert.ok(claves.has(k), `falta ${k}`);
});

test('proyectos: 16, slugs únicos y válidos', () => {
  assert.equal(proyectos.length, 16);
  const slugs = proyectos.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);
});

test('proyectos: campos obligatorios y valores permitidos', () => {
  for (const p of proyectos) {
    assert.ok(ESTADOS.includes(p.estado), `${p.slug} estado`);
    assert.ok(p.perfiles.length > 0, `${p.slug} perfiles`);
    for (const x of p.perfiles) assert.ok(PERFILES.includes(x), `${p.slug} perfil ${x}`);
    assert.ok(Array.isArray(p.stack) && p.stack.length > 0, `${p.slug} stack`);
    assert.ok(p.commits === null || (Number.isInteger(p.commits) && p.commits >= 0), `${p.slug} commits`);
    assert.equal(p.diagrama, `assets/diagramas/${p.slug}.svg`);
    assert.ok(typeof p.nombre === 'string' && p.nombre.trim(), `${p.slug} nombre`);
    for (const campo of ['titulo', 'problema', 'solucion', 'resultado']) {
      assert.ok(bilingue(p[campo]), `${p.slug}.${campo} debe tener es y en`);
    }
  }
});

test('proyectos: cada filtro de perfil tiene al menos 2', () => {
  for (const perfilX of PERFILES) {
    assert.ok(proyectos.filter((p) => p.perfiles.includes(perfilX)).length >= 2, perfilX);
  }
});

test('proyectos: ninguno enlaza a repositorio', () => {
  for (const p of proyectos) {
    for (const k of ['repo', 'url', 'link', 'enlace']) assert.ok(!(k in p), `${p.slug} tiene ${k}`);
  }
});

test('perfil: contacto exacto, 4 cargos, DOI, sin teléfono ni foto', () => {
  assert.equal(perfil.contacto.email, 'eduardo.lobos03@gmail.com');
  assert.equal(perfil.contacto.linkedin, 'https://linkedin.com/in/elobosp');
  assert.equal(perfil.contacto.github, 'https://github.com/elobosp');
  assert.equal(perfil.trayectoria.length, 4);
  for (const c of perfil.trayectoria) {
    assert.ok(bilingue(c.periodo) && bilingue(c.cargo) && bilingue(c.resumen) && c.empresa);
  }
  assert.equal(perfil.publicacion.doi, '10.1109/SCCC59417.2023.10315747');
  assert.ok(perfil.titular);
  for (const k of ['telefono', 'phone', 'foto', 'photo']) assert.ok(!(k in perfil), k);
  for (const g of perfil.stack) assert.ok(bilingue(g.grupo) && g.items.length > 0);
});

test('perfil: los CV declarados existen', () => {
  for (const lang of ['es', 'en']) {
    const ruta = perfil.cv[lang];
    if (ruta !== null) assert.ok(existe(ruta), `no existe ${ruta}`);
  }
});
