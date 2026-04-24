# Despliegue real y funcional de RentPlay

Este proyecto ahora incluye:

- Frontend estatico en HTML/CSS/JS (Netlify)
- Backend Node.js + Express + MongoDB (Render + MongoDB Atlas)
- Autenticacion real con JWT
- Alquileres persistentes en base de datos

## 1. Preparar MongoDB Atlas

1. Crea un cluster en MongoDB Atlas.
2. Crea un usuario de base de datos.
3. En Network Access, permite acceso desde Render (temporalmente puedes usar `0.0.0.0/0` para pruebas).
4. Copia la cadena de conexion, por ejemplo:

```text
mongodb+srv://usuario:password@cluster.xyz.mongodb.net/rentplay?retryWrites=true&w=majority
```

## 2. Desplegar backend en Render

1. Sube este repo a GitHub.
2. En Render, crea un `Web Service` apuntando al repo.
3. Configuracion recomendada:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Runtime: Node 18+

4. Variables de entorno en Render:
- `PORT=4000`
- `MONGODB_URI=<tu uri de atlas>`
- `JWT_SECRET=<texto largo aleatorio>`
- `FRONTEND_URL=https://tu-sitio.netlify.app,http://localhost:8000`

5. Verifica salud del backend:

```text
https://TU_BACKEND.onrender.com/api/health
```

Debe responder con `{ "ok": true, ... }`.

## 3. Configurar frontend para usar la API real

Edita `assets/js/config.js` y reemplaza:

```js
const productionApiBaseUrl = 'https://REEMPLAZA-CON-TU-BACKEND.onrender.com/api';
```

por tu URL real de Render.

## 4. Desplegar frontend en Netlify

1. En Netlify, crea un nuevo sitio desde tu repo.
2. Configuracion:
- Build command: vacio
- Publish directory: `.`

3. Publica y abre la URL de Netlify.

## 5. Prueba funcional end-to-end

1. En Netlify, entra a `registro.html` y crea cuenta.
2. Entra a `login.html` e inicia sesion.
3. Abre `index.html` y confirma un alquiler.
4. Abre `mi-alquiler.html` y verifica que aparece el alquiler real (persistido en MongoDB).

## 6. Evidencias para entregar

Incluye estas pruebas en tu memoria:

1. URL publica del frontend (Netlify).
2. URL publica del backend (Render).
3. Captura de `/api/health` funcionando.
4. Capturas de registro, login y alquiler confirmado.
5. Captura en MongoDB Atlas mostrando documentos en colecciones `users` y `rentals`.

## 7. Ejecucion local (opcional)

Backend:

```bash
cd backend
cp .env.example .env
# Rellena variables reales en .env
npm install
npm run dev
```

Frontend (en la raiz del proyecto):

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`.
