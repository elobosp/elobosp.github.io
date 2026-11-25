# elobosp.github.io

Portafolio profesional de **Eduardo Lobos Pacheco** — Backend Engineer · Go, Kubernetes, CI/CD.

🔗 **https://elobosp.github.io** (español) · **https://elobosp.github.io/?lang=en** (English)

## Cómo está hecho

- HTML + CSS + JavaScript (ES modules), **sin build ni dependencias** en tiempo de ejecución.
- Los textos viven en `data/` (JSON bilingüe) y se renderizan con funciones puras de `js/render.js`.
- Cada push a `main` pasa por GitHub Actions: tests → validación HTML → enlaces → Lighthouse → despliegue a GitHub Pages. La cabecera del sitio muestra el commit del último despliegue.

## Desarrollo local

```bash
npx serve .          # o: python -m http.server
npm test             # tests con node --test (Node 20+)
```

## Actualizar contenido

| Qué | Dónde |
|---|---|
| Textos de interfaz | `data/i18n/es.json`, `data/i18n/en.json` |
| Perfil, trayectoria, stack, contacto | `data/perfil.json` |
| Proyectos | `data/proyectos.json` + `assets/diagramas/<slug>.svg` |
| CV descargable | `assets/cv/cv-es.pdf`, `assets/cv/cv-en.pdf` |

Los tests validan la estructura de los datos y bloquean información privada (URLs internas, teléfonos, correos de terceros).

## Licencias

- Código: [MIT](LICENSE).
- Contenido (`data/`, `assets/`): todos los derechos reservados — ver [LICENSE-CONTENT.md](LICENSE-CONTENT.md).
