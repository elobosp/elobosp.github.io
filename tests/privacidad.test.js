// Bloquea información privada en todo lo que se publica.
// Las reglas son genéricas a propósito: este archivo también es público,
// así que no contiene los datos reales que se quieren bloquear.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PUBLICADOS = ['index.html', 'css', 'js', 'data', 'assets'];
const EXTENSIONES = new Set(['.html', '.css', '.js', '.json', '.svg']);
const CORREO_PERMITIDO = 'eduardo.lobos03@gmail.com';

// Los servidores internos son subdominios del dominio institucional: bloquearlo los cubre a todos.
const SUBCADENAS = ['uct.cl', 'c:\\users', '\\users\\', 'begin private key'];
const CELULAR_CL = /\+?56[\s-]?9[\s-]?\d{4}[\s-]?\d{4}/;
const CORREO = /[\w.+-]+@[\w-]+\.[\w.]+/g;

export function violaciones(texto) {
  const v = [];
  const bajo = texto.toLowerCase();
  for (const s of SUBCADENAS) if (bajo.includes(s)) v.push(s);
  if (CELULAR_CL.test(texto)) v.push('celular');
  for (const m of texto.match(CORREO) ?? []) if (m.toLowerCase() !== CORREO_PERMITIDO) v.push(`correo ${m}`);
  return v;
}

function archivos(ruta) {
  if (!existsSync(ruta)) return [];
  if (statSync(ruta).isFile()) return EXTENSIONES.has(extname(ruta)) ? [ruta] : [];
  return readdirSync(ruta).flatMap((n) => archivos(join(ruta, n)));
}

test('detector: reconoce cada tipo de violación', () => {
  assert.deepEqual(violaciones('ver https://portal.' + 'uct.cl/x'), ['uct.cl']);
  assert.deepEqual(violaciones('fono +56 9 ' + '1234 5678'), ['celular']);
  assert.deepEqual(violaciones('a ' + 'alguien@' + 'ejemplo.com'), ['correo alguien@ejemplo.com']);
  assert.deepEqual(violaciones('escribe a ' + CORREO_PERMITIDO), []);
  assert.deepEqual(violaciones('pipeline con GitLab CI/CD'), []);
  assert.deepEqual(violaciones('repo en https://git.' + 'uct.cl/x'), ['uct.cl']);
  assert.deepEqual(violaciones('ruta C:\\Users\\x'), ['c:\\users', '\\users\\']);
});

test('archivos publicados sin información privada', () => {
  const encontrados = PUBLICADOS.flatMap((p) => archivos(join(RAIZ, p)));
  assert.ok(encontrados.length > 0, 'no hay archivos que revisar');
  const problemas = encontrados
    .map((f) => [f, violaciones(readFileSync(f, 'utf8'))])
    .filter(([, v]) => v.length)
    .map(([f, v]) => `${f.slice(RAIZ.length)}: ${v.join(', ')}`);
  assert.deepEqual(problemas, []);
});
