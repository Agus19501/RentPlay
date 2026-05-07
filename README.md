# RentPlay

RentPlay ya está migrado a una base MERN con dos partes:

- `client/`: frontend en React con Vite.
- `server/`: API en Express conectada a MongoDB.

## Estructura nueva

- `client/src/App.jsx`: rutas y pantallas principales.
- `client/src/api.js`: cliente HTTP y manejo de sesion.
- `server/src/index.js`: arranque de la API.
- `server/src/routes/`: autenticacion, catalogo y alquileres.
- `data/games.json`: catalogo inicial que se siembra en MongoDB.

## Variables de entorno

Copiando `server/.env.example` puedes configurar:

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `CLIENT_ORIGIN`

## Comandos

- `npm install` en la raiz para instalar workspaces.
- `npm run dev` para levantar cliente y servidor.
- `npm run build` para compilar el frontend.
- `npm run start` para arrancar la API.

## Estado

La base antigua HTML/PHP, Netlify Functions y el backend local ya fueron retirados; la ruta principal del proyecto es React + Express + MongoDB.
