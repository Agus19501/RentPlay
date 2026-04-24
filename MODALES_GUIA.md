# Guía de Uso de Modales Reutilizables

Esta guía explica cómo usar los modales desde otras páginas de tu aplicación.

## 🎯 Modales Disponibles

### 1. Modal de Alquiler (Métodos de Pago)
- **ID**: `modal-rental`
- **Ubicación**: index.html (línea ~230)
- **Uso**: Confirmar alquiler con selección de método de pago

### 2. Modal de Valoraciones
- **ID**: `modal-ratings`
- **Ubicación**: index.html (línea ~260)
- **Uso**: Ver valoraciones de otros usuarios y crear la propia

---

## 📖 Cómo Usar los Modales desde Otra Página

### OPCIÓN 1: Importar los Modales en Otra Página

Si necesitas utilizar estos modales en **otra página**, debes:

#### Paso 1: Copiar el HTML de los modales
Copia todo el HTML entre los comentarios:
```html
<!-- MODAL: Confirmar Alquiler -->
...
<!-- MODAL: Valoraciones -->
...
<!-- Overlay para blur -->
<div id="modal-overlay" class="modal-overlay"></div>
```

Y pégalo en tu otra página HTML, justo antes del `</body>`.

#### Paso 2: Asegúrate de importar el CSS
Incluye el CSS en tu otra página:
```html
<link rel="stylesheet" href="ruta/a/assets/css/style.css">
```

#### Paso 3: Asegúrate de importar el JavaScript
Incluye el script en tu otra página:
```html
<script src="ruta/a/assets/js/script.js"></script>
```

---

## 🎮 Funciones Globales para Controlar Modales

Una vez que los modales estén en tu página, puedes usar estas funciones desde JavaScript:

### Abrir un Modal Específico

```javascript
// Abrir modal de alquiler
openModal('modal-rental');

// Abrir modal de valoraciones
openModal('modal-ratings');
```

### Cerrar un Modal Específico

```javascript
// Cerrar modal de alquiler
closeModal('modal-rental');

// Cerrar modal de valoraciones
closeModal('modal-ratings');

// Cerrar todos los modales
closeAllModals();
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Abrir Modal desde un Botón

```html
<!-- En tu HTML -->
<button onclick="openModal('modal-rental')">Alquilar Juego</button>
```

### Ejemplo 2: Abrir Modal desde JavaScript

```javascript
// En tu archive JavaScript
const myButton = document.querySelector('.my-button');
myButton.addEventListener('click', function() {
    openModal('modal-ratings');
});
```

### Ejemplo 3: Programar Acciones Después de Cerrar Modal

```javascript
// Ver si el usuario confirmó un alquiler desde el localStorage
function checkRentalHistory() {
    const rentHistory = JSON.parse(localStorage.getItem('rentHistory')) || [];
    console.log('Alquileres realizados:', rentHistory);
}

// Llamar después de cerrar el modal
document.addEventListener('modal:closed', function() {
    checkRentalHistory();
});
```

---

## 🔧 Personalización de Modales

### Cambiar Métodos de Pago

En el HTML del modal de alquiler, modifica la sección `payment-methods`:

```html
<label class="payment-option">
    <input type="radio" name="payment" value="crypto">
    <div class="payment-icon">
        <i class="fab fa-bitcoin"></i>
    </div>
    <span>Criptomoneda</span>
</label>
```

### Agregar Más Valoraciones

En el HTML del modal de valoraciones, agrega más `rating-item`:

```html
<div class="rating-item">
    <div class="rating-user-avatar">
        <i class="fas fa-user-circle"></i>
    </div>
    <div class="rating-user-info">
        <h4 class="rating-username">NuevoUsuario_123</h4>
        <div class="rating-stars">
            <!-- Estrellas aquí -->
        </div>
        <p class="rating-comment">Tu comentario aquí</p>
    </div>
</div>
```

---

## 🗂️ Estructura de Datos en localStorage

### rentHistory (Historial de Alquileres)

```javascript
[
    {
        game: "Grand Theft Auto: Vice City",
        price: "19.99 €",
        date: "27/03/2026",
        time: "14:30:45",
        payment: "PayPal"
    },
    // Más alquileres...
]
```

### userRatings (Valoraciones del Usuario)

```javascript
[
    {
        seller: "Pepe_gom01",
        rating: 5,
        comment: "Excelente trato",
        date: "27/03/2026"
    },
    // Más valoraciones...
]
```

---

## ⚙️ Eventos Customizados

Puedes escuchar eventos personalizados:

```javascript
// Cuando se abre un modal
document.addEventListener('modal:opened', function() {
    console.log('Modal abierto');
});

// Cuando se cierra un modal
document.addEventListener('modal:closed', function() {
    console.log('Modal cerrado');
});
```

---

## 🐛 Troubleshooting

### "No funciona el modal"

**Solución 1**: Verifica que los modales tengan los IDs correctos:
```javascript
// En consola del navegador (F12)
console.log(document.getElementById('modal-rental'));
```

**Solución 2**: Asegúrate de que el CSS y JS estén cargados:
```javascript
// En consola
console.log(typeof openModal); // Debe mostrar "function"
```

### "El modal se abre pero sin estilos"

**Solución**: Verifica que style.css esté importado en tu HTML:
```html
<link rel="stylesheet" href="assets/css/style.css">
```

### "No se guarda la información"

**Solución**: localStorage debe estar habilitado en el navegador. Verifica:
```javascript
// En consola
localStorage.setItem('test', 'test');
console.log(localStorage.getItem('test')); // Debe mostrar "test"
```

---

## 📝 Referencia Rápida

| Función | Descripción |
|---------|------------|
| `openModal(id)` | Abre un modal por ID |
| `closeModal(id)` | Cierra un modal específico |
| `closeAllModals()` | Cierra todos los modales |
| `openRentalModal()` | Abre específicamente el modal de alquiler |
| `openRatingsModal()` | Abre específicamente el modal de valoraciones |

---

## 🚀 Próximas Mejoras

- [ ] Agregar animaciones de entrada/salida personalizadas
- [ ] Sistema de modalidad multiple (varios modales simultáneamente)
- [ ] Integración con API para guardar datos en servidor
- [ ] Validación de formularios
- [ ] Historial de valoraciones del usuario

---

**Nota**: Todos los modales usan `localStorage` para guardar datos. Para persistencia permanente, necesitarás conectar una base de datos.
