// Conecta los datos con el DOM: idioma, render, filtros, expansión de filas y pipeline.
import { detectLang, readStoredLang, storeLang, pick, t } from './i18n.js';
import {
  escapeHtml, filterProjects, renderRow, renderDetail, renderTimeline, renderStack, cvLink,
} from './render.js';

const PERFILES = ['todos', 'backend', 'fullstack', 'devops', 'ia'];
const ETAPAS = ['commit', 'build', 'test', 'deploy'];
const PASO_MS = 350;

const estado = {
  lang: 'es',
  perfil: 'todos',
  abiertos: new Set(),
  svgs: new Map(), // slug → string SVG | null (falló)
  dicts: null,
  perfilDatos: null,
  proyectos: [],
  build: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const tr = (key) => t(estado.dicts, estado.lang, key);
const storage = () => {
  try { return globalThis.localStorage; } catch { return undefined; }
};

async function cargarJson(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`${ruta}: ${r.status}`);
  return r.json();
}

async function cargarOpcional(ruta) {
  try { return await cargarJson(ruta); } catch { return null; }
}

async function cargarSvg(p) {
  if (estado.svgs.has(p.slug)) return estado.svgs.get(p.slug);
  let svg = null;
  try {
    const r = await fetch(p.diagrama);
    if (r.ok) {
      const texto = await r.text();
      svg = texto.trimStart().startsWith('<svg') ? texto : null;
    }
  } catch { /* sin diagrama: se muestran solo los textos */ }
  estado.svgs.set(p.slug, svg);
  return svg;
}

/* ---------- render ---------- */

function renderTextos() {
  for (const el of $$('[data-i18n]')) el.textContent = tr(el.dataset.i18n);
  for (const el of $$('[data-i18n-aria]')) el.setAttribute('aria-label', tr(el.dataset.i18nAria));
  $('[data-perfil="titular"]').textContent = estado.perfilDatos.titular;
  document.documentElement.lang = estado.lang;
  document.title = tr('meta.title');
  $('meta[name="description"]').setAttribute('content', tr('meta.description'));
  for (const b of $$('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === estado.lang));
}

function renderCv() {
  const a = $('#cv');
  const cv = cvLink(estado.perfilDatos.cv, estado.lang, estado.dicts);
  a.hidden = !cv;
  if (cv) {
    a.href = cv.href;
    a.textContent = cv.label;
  }
}

function renderDeploy() {
  const el = $('.deploy-info');
  const b = estado.build;
  el.hidden = !(b && b.sha && b.fecha);
  if (!el.hidden) el.textContent = `${tr('hero.deploy')} ${b.sha} · ${b.fecha}`;
}

function renderFiltros() {
  $('.filtros').innerHTML = PERFILES.map((p) =>
    `<button type="button" data-filtro="${p}" aria-pressed="${p === estado.perfil}">${escapeHtml(tr(`proyectos.filtro.${p}`))}</button>`,
  ).join('');
}

function renderProyectos() {
  const visibles = new Set(filterProjects(estado.proyectos, estado.perfil).map((p) => p.slug));
  $('#filas').innerHTML = estado.proyectos.map((p) => {
    const svg = estado.svgs.get(p.slug) ?? null;
    return renderRow(p, estado.lang, estado.dicts) + renderDetail(p, estado.lang, estado.dicts, svg);
  }).join('');
  for (const p of estado.proyectos) {
    const fila = $(`tr.proyecto[data-slug="${p.slug}"]`);
    const detalle = $(`#det-${p.slug}`);
    const visible = visibles.has(p.slug);
    const abierto = visible && estado.abiertos.has(p.slug);
    fila.hidden = !visible;
    marcarFila(fila, abierto);
    detalle.hidden = !abierto;
  }
}

/** Estado abierto/cerrado: aria-expanded en el botón (accesible) y clase en la fila (estilo). */
function marcarFila(fila, abierto) {
  fila.classList.toggle('abierto', abierto);
  fila.querySelector('.fila-boton').setAttribute('aria-expanded', String(abierto));
}

function renderFormacion() {
  const f = estado.perfilDatos.formacion;
  const pub = estado.perfilDatos.publicacion;
  const lang = estado.lang;
  $('#contenido-formacion').innerHTML = '<div class="formacion">'
    + `<div><h3>${escapeHtml(pick(f.titulo, lang))}</h3>`
    + `<p class="empresa">${escapeHtml(f.institucion)} · ${escapeHtml(f.periodo)}</p>`
    + `<p>${escapeHtml(pick(f.tesis, lang))}</p></div>`
    + `<div><h3>${escapeHtml(tr('formacion.publicacion'))}</h3>`
    + `<p>${escapeHtml(pub.cita)}</p>`
    + `<p><a href="https://doi.org/${escapeHtml(pub.doi)}" rel="noopener">doi:${escapeHtml(pub.doi)}</a></p></div>`
    + '</div>';
}

function renderTodo() {
  renderTextos();
  renderCv();
  renderDeploy();
  renderFiltros();
  renderProyectos();
  $('#contenido-trayectoria').innerHTML = renderTimeline(estado.perfilDatos.trayectoria, estado.lang);
  $('#contenido-stack').innerHTML = renderStack(estado.perfilDatos.stack, estado.lang);
  renderFormacion();
}

/* ---------- interacción ---------- */

function cambiarIdioma(lang) {
  if (lang === estado.lang) return;
  estado.lang = lang;
  storeLang(storage(), lang);
  const url = new URL(location.href);
  if (lang === 'es') url.searchParams.delete('lang');
  else url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
  renderTodo();
}

async function alternarFila(slug) {
  const p = estado.proyectos.find((x) => x.slug === slug);
  if (!p) return;
  if (estado.abiertos.has(slug)) {
    estado.abiertos.delete(slug);
  } else {
    estado.abiertos.add(slug);
    if (!estado.svgs.has(slug)) await cargarSvg(p);
  }
  const fila = $(`tr.proyecto[data-slug="${slug}"]`);
  const nuevoDetalle = document.createElement('tbody');
  nuevoDetalle.innerHTML = renderDetail(p, estado.lang, estado.dicts, estado.svgs.get(slug) ?? null);
  const detalle = nuevoDetalle.firstElementChild;
  const abierto = estado.abiertos.has(slug);
  detalle.hidden = !abierto;
  $(`#det-${slug}`).replaceWith(detalle);
  marcarFila(fila, abierto);
}

function conectarEventos() {
  $('.idiomas').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (b) cambiarIdioma(b.dataset.lang);
  });
  $('.filtros').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filtro]');
    if (!b) return;
    estado.perfil = b.dataset.filtro;
    // Solo se actualiza aria-pressed: re-renderizar los botones destruiría el que tiene el foco.
    for (const f of $$('[data-filtro]')) f.setAttribute('aria-pressed', String(f === b));
    renderProyectos();
  });
  const filas = $('#filas');
  // Clic en cualquier parte de la fila; con teclado, Enter/Espacio en el botón disparan este mismo click.
  filas.addEventListener('click', (e) => {
    const fila = e.target.closest('tr.proyecto');
    if (fila) alternarFila(fila.dataset.slug);
  });
}

function animarPipeline() {
  const etapas = ETAPAS.map((n) => $(`.etapa[data-etapa="${n}"]`));
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducido) {
    for (const el of etapas) el.classList.add('is-done');
    return;
  }
  etapas.forEach((el, i) => {
    setTimeout(() => el.classList.add(i === etapas.length - 1 ? 'is-running' : 'is-done'), PASO_MS * (i + 1));
  });
  const ultima = etapas.at(-1);
  setTimeout(() => ultima.classList.replace('is-running', 'is-done'), PASO_MS * (etapas.length + 2));
}

async function init() {
  estado.lang = detectLang(location.search, readStoredLang(storage()));
  const [es, en, perfil, proyectos, build] = await Promise.all([
    cargarJson('data/i18n/es.json'),
    cargarJson('data/i18n/en.json'),
    cargarJson('data/perfil.json'),
    cargarJson('data/proyectos.json'),
    cargarOpcional('build.json'),
  ]);
  Object.assign(estado, { dicts: { es, en }, perfilDatos: perfil, proyectos, build });
  renderTodo();
  conectarEventos();
  animarPipeline();
}

init().catch((err) => {
  console.error(err);
  document.body.classList.add('error-carga');
});
