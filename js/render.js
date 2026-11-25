// Funciones puras dato → HTML. Todo texto proveniente de datos se escapa.
//
// Tipos:
// @typedef {{es: string, en?: string}} Txt
// @typedef {{slug: string, nombre: string, perfiles: string[], estado: 'prod'|'lab',
//   stack: string[], commits: number|null, diagrama: string,
//   titulo: Txt, problema: Txt, solucion: Txt, resultado: Txt}} Project
// @typedef {{periodo: Txt, cargo: Txt, empresa: string, resumen: Txt}} Cargo
// @typedef {{grupo: Txt, items: string[]}} GrupoStack

import { pick, t } from './i18n.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

const txt = (value, lang) => escapeHtml(pick(value, lang));

export function filterProjects(projects, perfil) {
  if (perfil === 'todos') return [...projects];
  return projects.filter((p) => p.perfiles.includes(perfil));
}

export function renderRow(p, lang, dicts) {
  const slug = escapeHtml(p.slug);
  return `<tr class="proyecto" data-slug="${slug}">`
    + '<td class="col-nombre">'
    + `<button type="button" class="fila-boton" aria-expanded="false" aria-controls="det-${slug}">`
    + `<span class="caret" aria-hidden="true">▸</span> <span class="nombre">${escapeHtml(p.nombre)}</span>`
    + `<span class="titulo">${txt(p.titulo, lang)}</span></button></td>`
    + `<td class="col-stack">${escapeHtml(p.stack.join(' · '))}</td>`
    + `<td class="col-estado"><span class="estado estado--${escapeHtml(p.estado)}">● ${escapeHtml(t(dicts, lang, `estado.${p.estado}`))}</span></td>`
    + `<td class="col-commits">${p.commits ?? '—'}</td>`
    + '</tr>';
}

export function renderDetail(p, lang, dicts, svg) {
  const slug = escapeHtml(p.slug);
  const figura = svg == null ? '' : `<figure class="diagrama">${svg}</figure>`;
  const item = (key, value) =>
    `<dt>${escapeHtml(t(dicts, lang, `proyecto.${key}`))}</dt><dd>${txt(value, lang)}</dd>`;
  return `<tr class="detalle" id="det-${slug}" hidden><td colspan="4"><div class="detalle-cuerpo">`
    + figura
    + `<dl>${item('problema', p.problema)}${item('solucion', p.solucion)}${item('resultado', p.resultado)}</dl>`
    + '</div></td></tr>';
}

export function renderTimeline(items, lang) {
  const lis = items.map((c) => '<li>'
    + `<span class="periodo">${txt(c.periodo, lang)}</span>`
    + `<h3>${txt(c.cargo, lang)} <span class="empresa">· ${escapeHtml(c.empresa)}</span></h3>`
    + `<p>${txt(c.resumen, lang)}</p>`
    + '</li>').join('');
  return `<ol class="trayectoria">${lis}</ol>`;
}

export function renderStack(grupos, lang) {
  const bloques = grupos.map((g) => '<div class="stack-grupo">'
    + `<h3>${txt(g.grupo, lang)}</h3>`
    + `<ul>${g.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
    + '</div>').join('');
  return `<div class="stack">${bloques}</div>`;
}

export function cvLink(cv, lang, dicts) {
  if (!cv?.es) return null;
  if (lang === 'en' && !cv.en) return { href: cv.es, label: t(dicts, 'en', 'cv.soloEspanol') };
  return { href: cv[lang] || cv.es, label: t(dicts, lang, 'cv.descargar') };
}
