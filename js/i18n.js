// Idioma: detección, persistencia y lectura de textos traducibles.

export const LANGS = ['es', 'en'];
const DEFAULT_LANG = 'es';
const STORAGE_KEY = 'lang';

const valid = (lang) => LANGS.includes(lang);

/** Prioridad: ?lang= > storage > 'es'. Valores desconocidos se ignoran. */
export function detectLang(search, stored) {
  const fromQuery = new URLSearchParams(search || '').get('lang');
  if (valid(fromQuery)) return fromQuery;
  if (valid(stored)) return stored;
  return DEFAULT_LANG;
}

/** Lee el idioma guardado; nunca lanza (storage bloqueado o ausente → null). */
export function readStoredLang(storage) {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/** Guarda el idioma; ignora errores de storage. */
export function storeLang(storage, lang) {
  try {
    storage?.setItem(STORAGE_KEY, lang);
  } catch {
    // modo privado / storage bloqueado: el idioma vive solo en la sesión
  }
}

/** Texto en el idioma pedido; un objeto {es, en} sin traducción cae a es. */
export function pick(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.es || '';
}

const lookup = (dict, key) =>
  key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);

/** Texto de interfaz por clave con puntos; fallback a es y luego ''. */
export function t(dicts, lang, key) {
  const value = lookup(dicts?.[lang], key) ?? lookup(dicts?.es, key);
  return typeof value === 'string' ? value : '';
}
