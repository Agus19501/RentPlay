# Páginas del Módulo de Alquiler de Videojuegos

## 📄 Archivos Principales

### 1. `home.html` - Página de Inicio
**Ubicación**: `/home.html`
**Descripción**: Página principal con carruseles de juegos, perfiles destacados y categorías

**Secciones**:
- ✅ NUEVOS JUEGOS - Carrusel horizontal de últimos juegos añadidos
- ✅ PERFILES DESTACADOS - Carrusel de usuarios mejor valorados
- ✅ CATEGORÍAS POPULARES - Grid de categorías (Acción, Puzzle, Aventura, etc.)

**Características**:
- Carruseles responsivos con scroll suave
- Botones de navegación para carruseles
- Hover effects en juegos y perfiles
- Grid adaptativo de categorías
- Misma navegación y footer que index.html

---

### 2. `index.html` - Página de Detalle del Juego
**Ubicación**: `/index.html`
**Descripción**: Página de detalles de un videojuego específico

**Secciones**:
- ✅ Galería de imágenes con botones ANTERIOR/SIGUIENTE
- ✅ Información del juego
- ✅ Métodos de pago en modal
- ✅ Perfil del propietario con opción de valorar
- ✅ Información adicional (plataforma, estado, etc.)
- ✅ Juegos recomendados

**Características**:
- Modal de confirmación de alquiler
- Modal de valoraciones del propietario
- Sistema de favoritos
- Blur de fondo
- Layout de 3 columnas (desktop)

---

## 🗺️ Flujo de Navegación

```
home.html (Inicio)
    ↓
    ├─→ Hacer click en un JUEGO → index.html (Detalle del juego)
    │
    ├─→ Hacer click en un PERFIL → [PRÓXIMA: perfil.html]
    │
    └─→ Hacer click en una CATEGORÍA → [PRÓXIMA: buscar.html]
```

---

## 🎮 Cómo Navegar Entre Páginas

### Pasar de HOME a DETALLE DEL JUEGO

**Opción 1: Con JavaScript**

En el archivo `assets/js/script.js`, función `handleGameItemClick`:

```javascript
function handleGameItemClick(e) {
    const gameLabel = e.currentTarget.querySelector('.game-item-label').textContent;
    
    // Redirigir a la página de detalle
    window.location.href = 'index.html?game=' + encodeURIComponent(gameLabel);
}
```

**Opción 2: Directamente en el HTML**

Puedes hacer los juegos como enlaces `<a>`:

```html
<a href="index.html" class="game-item">
    <div class="game-image">
        <i class="fas fa-image"></i>
    </div>
    <p class="game-item-label">GTA VI</p>
</a>
```

**Opción 3: Con Data Attributes**

```html
<div class="game-item" data-game-id="1" data-game-name="GTA VI">
    <div class="game-image">
        <i class="fas fa-image"></i>
    </div>
    <p class="game-item-label">GTA VI</p>
</div>
```

```javascript
function handleGameItemClick(e) {
    const gameId = e.currentTarget.getAttribute('data-game-id');
    const gameName = e.currentTarget.getAttribute('data-game-name');
    
    window.location.href = `index.html?id=${gameId}&name=${gameName}`;
}
```

---

## 🔗 Enlaces de Navegación en el Header

Actualmente, el logo es clickeable. Puedes hacer que lleve al home:

```javascript
const logo = document.querySelector('.logo');
logo.addEventListener('click', function() {
    window.location.href = 'home.html';
});
```

---

## 📱 Estructura Responsive

### Desktop (1024px+)
- Header sticky (fijo arriba)
- Carruseles visibles (6-8 items)
- Grid de 3 columnas en categorías

### Tablet (768px - 1023px)
- Header adaptado
- Carruseles visibles (4-5 items)
- Grid de 2 columnas en categorías

### Móvil (480px - 767px)
- Header hamburguer (opcional)
- Carruseles visibles (2-3 items)
- Grid de 2 columnas en categorías

### Móvil pequeño (< 480px)
- Header comprimido
- Carruseles visibles (1-2 items)
- Grid de 1 columna en categorías

---

## 🎨 Personalización de Contenido

### Cambiar los Juegos en NUEVOS JUEGOS

En `home.html`, línea ~75:

```html
<div class="game-item">
    <div class="game-image">
        <i class="fas fa-image"></i>
    </div>
    <p class="game-item-label">Tu Juego</p>
</div>
```

### Cambiar los Perfiles en PERFILES DESTACADOS

En `home.html`, línea ~130:

```html
<div class="profile-item">
    <div class="profile-avatar">
        <i class="fas fa-user-circle"></i>
    </div>
    <h3 class="profile-name">NombreUsuario</h3>
    <div class="profile-rating">
        <!-- Estrellas aquí -->
    </div>
</div>
```

---

## 🚀 Próximas Páginas a Implementar

- [ ] `perfil.html` - Página de perfil de usuario
- [ ] `buscar.html` - Página de resultados de búsqueda
- [ ] `carrito.html` - Carrito de compra
- [ ] `mi-cuenta.html` - Gestión de cuenta
- [ ] `mis-alquileres.html` - Historial de alquileres
- [ ] `favoritos.html` - Lista de favoritos

---

## 💾 Datos Almacenados en localStorage

### En AMBAS páginas está disponible:

```javascript
// Favoritos
localStorage.getItem('wishlist')

// Historial de alquileres
localStorage.getItem('rentHistory')

// Valoraciones del usuario
localStorage.getItem('userRatings')
```

---

## 🔐 Seguridad y Consideraciones

1. **URLs con parámetros**: Si usas parámetros en la URL (ej: `?game=nombre`), valida los datos en JavaScript
2. **localStorage**: Los datos se guardan localmente, no en servidor
3. **Modales reutilizables**: Se pueden usar en cualquier página que importe `script.js` y `style.css`

---

## 📝 Ejemplo Completo: Crear Página de Perfil

1. **Crea `perfil.html`** con estructura similar a `home.html`
2. **Importa los mismos CSS y JS**
3. **Agrega contenido del perfil**:
   - Avatar del usuario
   - Información del perfil
   - Listado de juegos del vendedor
   - Comentarios/valoraciones

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <!-- Importar header aquí -->
    <!-- Tu contenido -->
    <!-- Importar footer aquí -->
    
    <script src="assets/js/script.js"></script>
</body>
</html>
```

---

## 🐛 Troubleshooting Navegación

**Problema**: El enlace no funciona
- Verifica que la ruta sea correcta (relativa o absoluta)
- Comprueba que el archivo HTML existe

**Problema**: Pierdo los datos al navegar
- Los datos en `localStorage` persisten entre páginas
- Si usas variables JavaScript, reinícialas al cargar

**Problema**: Los estilos no se aplican en otra página
- Asegúrate de importar `assets/css/style.css`
- Verifica la ruta relativa

---

## 🎯 Checklist de Navegación

- [ ] Logo clickeable lleva al home
- [ ] Juegos en home llevan a detalle
- [ ] Perfiles en home llevan a perfil (cuando esté creado)
- [ ] Categorías en home llevan a búsqueda (cuando esté creada)
- [ ] Header y footer consistentes en todas las páginas
- [ ] Links internos funcionan correctamente
- [ ] localStorage persiste datos entre páginas
- [ ] Responsive funciona en todas las páginas

