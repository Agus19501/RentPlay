# Módulo de Alquiler de Videojuegos

## Despliegue real (Netlify + Render + MongoDB Atlas)

Este repositorio ya permite funcionamiento real con backend y base de datos:

- Frontend estatico en Netlify
- API Node/Express en Render
- Persistencia en MongoDB Atlas

Consulta la guia paso a paso en `DEPLOY_REAL.md`.

Parte del trabajo grupal - Sistema web de alquiler de videojuegos

Módulo responsable de la interfaz y funcionalidades de alquiler de videojuegos, con diseño responsive y moderno.

## 📋 Características

✅ **Diseño Responsive** - Se adapta a todos los tamaños de pantalla (desktop, tablet, móvil)
✅ **Interfaz Intuitiva** - Experiencia de usuario limpia y moderna
✅ **Sistema de Favoritos** - Guarda tus juegos favoritos en localStorage
✅ **Búsqueda Funcional** - Busca videojuegos en tiempo real
✅ **Historial de Alquileres** - Registro local de tus alquileres
✅ **Galería de Imágenes** - Espacios preparados para imágenes
✅ **Sistema de Calificaciones** - Visualización de puntuaciones y reseñas
✅ **Información del Propietario** - Perfil y contacto con vendedores

## 🎨 Paleta de Colores

- **Naranja Primario**: `#ff6100`
- **Naranja Hover**: `#d45000`
- **Negro Header**: `#000000`
- **Gris Oscuro**: `#222222`
- **Gris Medio**: `#2a2a2a`
- **Gris Claro**: `#3a3a3a`

## 📁 Estructura del Proyecto

```
rentplay-web/
├── index.html              # Página principal
├── README.md              # Este archivo
├── assets/
│   ├── css/
│   │   └── style.css      # Estilos principales
│   ├── js/
│   │   └── script.js      # Funcionalidad JavaScript
│   └── images/            # Carpeta para imágenes
└── data/
    └── games.json         # Datos de ejemplo (opcional)
```

## 🚀 Cómo Usar

### Opción 1: Abrir en el Navegador Directo
1. Navega a la carpeta `rentplay-web`
2. Abre `index.html` con tu navegador favorito

### Opción 2: Usar un Servidor Local (Recomendado)
```bash
# Con Python 3
python -m http.server 8000

# Con Python 2
python -m SimpleHTTPServer 8000

# Con Node.js (si tienes http-server instalado)
npx http-server
```

Luego abre `http://localhost:8000` en tu navegador.

## 🖼️ Cómo Agregar Imágenes

### 1. **Para la Carátula del Juego Principal**
```html
<!-- Reemplaza en index.html, línea ~44 -->
<div class="main-image">
    <img src="assets/images/juego-principal.jpg" alt="Grand Theft Auto: Vice City">
</div>
```

### 2. **Para las Miniaturas**
```html
<!-- En los thumbnails -->
<div class="image-placeholder thumbnail active">
    <img src="assets/images/imagen1.jpg" alt="Imagen 1">
</div>
```

### 3. **Para la Bandera de Idioma**
```html
<!-- Ya está preparado en el header -->
<img src="assets/images/spain-flag.png" alt="ES" class="flag-icon">
```

### 4. **Para el Avatar del Propietario**
```css
/* En style.css o HTML -->
.seller-avatar-placeholder {
    background-image: url('assets/images/avatar-vendedor.jpg');
    background-size: cover;
}
```

## 💾 Almacenamiento Local (localStorage)

La aplicación guarda automáticamente:

### Favoritos (Wishlist)
```javascript
localStorage.getItem('wishlist')
// Resultado: ["Grand Theft Auto: Vice City", "GTA: San Andreas"]
```

### Historial de Alquileres
```javascript
localStorage.getItem('rentHistory')
// Resultado: [
//   { game: "GTA: Vice City", price: "19.99 €", date: "27/03/2024" },
//   ...
// ]
```

## 🎯 Funcionalidades Implementadas

### JavaScript (script.js)
- ✅ Búsqueda con debounce
- ✅ Sistema de favoritos persistente
- ✅ Notificaciones flotantes
- ✅ Historial de alquileres
- ✅ Gestión de eventos de usuario
- ✅ Animaciones suaves

### CSS Responsive
- ✅ Breakpoints: 1024px, 768px, 480px, 320px
- ✅ Grid layout adaptativo
- ✅ Flexbox para componentes
- ✅ Transiciones y hover effects
- ✅ Modo oscuro nativo

## 📱 Responsividad

| Dispositivo | Ancho | Optimización |
|-------------|-------|--------------|
| Desktop | 1400px+ | Diseño de 2 columnas |
| Tablet | 768px - 1024px | Layout adaptado |
| Teléfono | 480px - 767px | Vista de columna única |
| Móvil XS | < 480px | Componentes ajustados |

## 🔧 Personalización

### Cambiar Colores Principales
Edita las variables en `style.css`:

```css
:root {
    --color-primary: #ff6100;
    --color-primary-hover: #d45000;
    --color-dark-bg: #222222;
    --color-black: #000000;
}
```

### Modificar Contenido de Ejemplo
Los datos de ejemplo se encuentran en:
- HTML: `index.html` (líneas 1-200)
- JavaScript: `script.js` (línea ~190 - Mock Data)

## 📝 Próximos Pasos (Para Futuro)

- [ ] Conectar con Base de Datos
- [ ] Sistema de autenticación
- [ ] Carrito de compra
- [ ] Sistema de pagos
- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] API REST
- [ ] PWA (Progressive Web App)
- [ ] Búsqueda avanzada con filtros

## 🌐 Navegadores Soportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Opera 76+

## 📞 Funciones Útiles en Consola

```javascript
// Ver todos los favoritos
getWishlist()

// Ver historial de alquileres
getRentHistory()

// Limpiar favoritos
localStorage.removeItem('wishlist')

// Limpiar historial
localStorage.removeItem('rentHistory')
```

## 💡 Tips de Desarrollo

1. **Abre la consola** (`F12` o `Ctrl+Shift+I`) para ver logs
2. **Usa DevTools** para inspeccionar elementos
3. **Prueba responsive** con `Ctrl+Shift+M` en navegadores
4. **Limpia caché** si hay cambios que no se ven: `Ctrl+Shift+Delete`

## 📄 Licencia

Este proyecto está disponible para uso educativo y personal.

## 👨‍💻 Desarrollador

Módulo de Alquiler de Videojuegos - Trabajo Grupal 2026

---

**Nota:** Esta es la parte de alquiler de videojuegos del proyecto grupal.
