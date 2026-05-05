# RentPlay
Repositorio asignatura Usabilidad y Accesibilidad UA 2026

Proyecto web de alquiler de videojuegos con interfaz responsive, autenticación y persistencia de datos.

## Funcionalidades

- Home con catálogo y navegación principal.
- Login y registro con header unificado.
- Integración con MongoDB para autenticación.
- Preparado para despliegue en Netlify con Functions.

## Estructura

- `index.html`, `home.html`, `login.html`, `registro.html`, `mi-alquiler.html`
- `assets/css/style.css`
- `assets/js/`
- `data/games.json`
- `api/` para backend local PHP
- `functions/` para Netlify Functions

## Desarrollo local

Abre el proyecto con XAMPP y sirve la carpeta `RentPlay` desde `htdocs`.

## Despliegue

- Sube el proyecto a GitHub.
- Conecta el repo a Netlify.
- Define la variable de entorno `MONGODB_URI` con la cadena de MongoDB Atlas.

## Estado

Este repositorio contiene tanto la versión local PHP como la versión serverless para producción.
