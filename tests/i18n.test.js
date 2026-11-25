import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLang, readStoredLang, storeLang, pick, t } from '../js/i18n.js';

test('detectLang: query gana a storage', () => {
  assert.equal(detectLang('?lang=en', 'es'), 'en');
});

test('detectLang: storage si no hay query', () => {
  assert.equal(detectLang('', 'en'), 'en');
});

test('detectLang: valor desconocido → es', () => {
  assert.equal(detectLang('?lang=fr', null), 'es');
  assert.equal(detectLang('', 'de'), 'es');
});

test('detectLang: por defecto es', () => {
  assert.equal(detectLang('', null), 'es');
});

test('readStoredLang/storeLang no lanzan si storage lanza', () => {
  const roto = {
    getItem() { throw new Error('x'); },
    setItem() { throw new Error('x'); },
  };
  assert.equal(readStoredLang(roto), null);
  assert.doesNotThrow(() => storeLang(roto, 'en'));
  assert.equal(readStoredLang(undefined), null);
});

test('readStoredLang/storeLang usan la clave lang', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  storeLang(storage, 'en');
  assert.equal(readStoredLang(storage), 'en');
});

test('pick: string, objeto y fallback a es', () => {
  assert.equal(pick('Go', 'en'), 'Go');
  assert.equal(pick({ es: 'hola', en: 'hi' }, 'en'), 'hi');
  assert.equal(pick({ es: 'hola' }, 'en'), 'hola');
  assert.equal(pick({ es: 'hola', en: '' }, 'en'), 'hola');
});

test('t: clave anidada, fallback a es, nunca undefined', () => {
  const dicts = { es: { nav: { a: 'Proyectos', b: 'Solo ES' } }, en: { nav: { a: 'Projects' } } };
  assert.equal(t(dicts, 'en', 'nav.a'), 'Projects');
  assert.equal(t(dicts, 'en', 'nav.b'), 'Solo ES');
  assert.equal(t(dicts, 'en', 'nav.zzz'), '');
});
