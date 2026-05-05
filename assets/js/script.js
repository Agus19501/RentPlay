// ==========================================
// FUNCIONALIDADES PRINCIPALES
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeSearch();
    initializeWishlist();
    initializeGallery();
    initializeMobileMenu();
    initializeModals();
});

// ==========================================
// 1. GESTIÓN DE EVENTOS
// ==========================================

function initializeEventListeners() {
    // Botón de alquiler
    const rentBtn = document.querySelector('.btn-rent');
    if (rentBtn) {
        rentBtn.addEventListener('click', handleRentClick);
    }

    // Botón de contacto con propietario
    const contactBtn = document.querySelector('.btn-contact');
    if (contactBtn) {
        contactBtn.addEventListener('click', handleContactClick);
    }

    // Botones de ver detalles
    const detailBtns = document.querySelectorAll('.btn-secondary');
    detailBtns.forEach(btn => {
        btn.addEventListener('click', handleViewDetails);
    });

    // Navegación de galerías de recomendados
    const prevBtn = document.querySelector('.btn-nav-prev');
    const nextBtn = document.querySelector('.btn-nav-next');
    
    if (prevBtn) prevBtn.addEventListener('click', handlePrevImage);
    if (nextBtn) nextBtn.addEventListener('click', handleNextImage);

    // Idioma
    const languageBtn = document.querySelector('.language-btn');
    if (languageBtn) {
        languageBtn.addEventListener('click', handleLanguageChange);
    }

    // Usuario
    const userBtn = document.querySelector('.user-btn');
    if (userBtn) {
        userBtn.addEventListener('click', handleUserClick);
    }

    // Carruseles del home
    const carouselNextBtns = document.querySelectorAll('.carousel-next');
    carouselNextBtns.forEach(btn => {
        btn.addEventListener('click', handleCarouselNext);
    });
}

// ==========================================
// 2. BÚSQUEDA
// ==========================================

function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
}

function handleSearch() {
    const searchTerm = document.querySelector('.search-input').value.trim();
    if (searchTerm.length > 0) {
        console.log('Buscando:', searchTerm);
        // Aquí iría la lógica de búsqueda
        showNotification(`Buscando: "${searchTerm}"`);
    }
}

// ==========================================
// 3. LISTA DE DESEOS (WISHLIST)
// ==========================================

function initializeWishlist() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', toggleWishlist);
        
        // Cargar estado del wishlist desde localStorage
        const gameTitle = document.querySelector('.product-title').textContent;
        if (isInWishlist(gameTitle)) {
            wishlistBtn.classList.add('active');
            // Cambiar ícono a corazón lleno
            const icon = wishlistBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
        }
    }
}

function toggleWishlist() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    const gameTitle = document.querySelector('.product-title').textContent;
    const icon = wishlistBtn.querySelector('i');
    
    if (wishlistBtn.classList.contains('active')) {
        removeFromWishlist(gameTitle);
        wishlistBtn.classList.remove('active');
        // Cambiar ícono a corazón vacío
        if (icon) {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
        showNotification('Eliminado de favoritos');
    } else {
        addToWishlist(gameTitle);
        wishlistBtn.classList.add('active');
        // Cambiar ícono a corazón lleno
        if (icon) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
        showNotification('Agregado a favoritos');
    }
}

function addToWishlist(gameTitle) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    if (!wishlist.includes(gameTitle)) {
        wishlist.push(gameTitle);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
}

function removeFromWishlist(gameTitle) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    wishlist = wishlist.filter(item => item !== gameTitle);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function isInWishlist(gameTitle) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    return wishlist.includes(gameTitle);
}

// ==========================================
// 4. GALERÍA DE IMÁGENES
// ==========================================

function initializeGallery() {
    const mainImage = document.querySelector('.main-image');
    if (mainImage) {
        mainImage.addEventListener('click', handleImageClick);
    }

    // Botones de navegación de galería
    const prevBtn = document.querySelector('.btn-nav-prev');
    const nextBtn = document.querySelector('.btn-nav-next');
    
    if (prevBtn) prevBtn.addEventListener('click', handlePrevImage);
    if (nextBtn) nextBtn.addEventListener('click', handleNextImage);

    // Game items en el home
    const gameItems = document.querySelectorAll('.game-item');
    gameItems.forEach(item => {
        item.addEventListener('click', handleGameItemClick);
    });

    // Profile items en el home
    const profileItems = document.querySelectorAll('.profile-item');
    profileItems.forEach(item => {
        item.addEventListener('click', handleProfileItemClick);
    });
}

function handleImageClick() {
    console.log('Imagen principal clickeada');
    // Podrías abrir un modal o visor a pantalla completa
}

function handlePrevImage() {
    console.log('Imagen anterior');
    showNotification('Imagen anterior');
}

function handleNextImage() {
    console.log('Siguiente imagen');
    showNotification('Siguiente imagen');
}

/**
 * Manejador de click en juegos del home
 */
function handleGameItemClick(e) {
    const gameLabel = e.currentTarget.querySelector('.game-item-label').textContent;
    console.log('Juego seleccionado:', gameLabel);
    showNotification(`Juego: ${gameLabel}`);
    // Aquí navegar a la página de detalle del juego
}

/**
 * Manejador de click en perfiles
 */
function handleProfileItemClick(e) {
    const profileName = e.currentTarget.querySelector('.profile-name').textContent;
    console.log('Perfil seleccionado:', profileName);
    showNotification(`Visitando perfil: ${profileName}`);
    // Aquí navegar a la página del perfil
}

// ==========================================
// CARRUSELES (HOME PAGE)
// ==========================================

function handleCarouselNext(e) {
    const carouselId = e.currentTarget.getAttribute('data-carousel');
    const carousel = document.getElementById(carouselId);
    
    if (carousel) {
        const scrollContainer = carousel.querySelector('.carousel-scroll');
        const itemWidth = scrollContainer.querySelector('.game-item')?.offsetWidth || 
                         scrollContainer.querySelector('.profile-item')?.offsetWidth;
        
        if (itemWidth) {
            scrollContainer.scrollBy({
                left: itemWidth + 15,
                behavior: 'smooth'
            });
        }
    }
}

// ==========================================
// 5. MANEJADORES DE BOTONES
// ==========================================

function handleRentClick() {
    const gameTitle = document.querySelector('.product-title').textContent;
    const price = document.querySelector('.detail-value.price').textContent;
    
    // Récord de alquiler en localStorage
    let rentHistory = JSON.parse(localStorage.getItem('rentHistory')) || [];
    const rental = {
        game: gameTitle,
        price: price,
        date: new Date().toLocaleDateString('es-ES'),
        time: new Date().toLocaleTimeString('es-ES')
    };
    rentHistory.push(rental);
    localStorage.setItem('rentHistory', JSON.stringify(rentHistory));
    
    showNotification(`✓ Alquiler procesado: ${gameTitle}`);
}

function handleContactClick() {
    const sellerName = document.querySelector('.seller-name').textContent;
    console.log('Contactar con:', sellerName);
    showNotification(`Conectando con ${sellerName}...`);
    // Aquí se abriría un chat o formulario de contacto
}

function handleViewDetails(e) {
    const gameTitle = e.target.closest('.game-card').querySelector('.game-title').textContent;
    console.log('Ver detalles de:', gameTitle);
    showNotification(`Abriendo: ${gameTitle}`);
    // Aquí se navegaría a la página del juego
}

function handleLanguageChange() {
    console.log('Cambiar idioma');
    showNotification('Idioma cambiado a Español');
}

function handleUserClick() {
    console.log('Redirigiendo a login');
    window.location.href = 'login.html';
    // Aquí se abriría el perfil del usuario o menú de usuario
}

// ==========================================
// 6. MENÚ MÓVIL
// ==========================================

function initializeMobileMenu() {
    // En esta versión básica, el menú es responsive con CSS
    // Pero aquí puedes añadir lógica adicional si es necesaria
}

// ==========================================
// 7. FUNCIONES AUXILIARES
// ==========================================

/**
 * Debounce para optimizar búsqueda en tiempo real
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Mostrar notificación temporal
 */
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #ff6100;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Formato de precio
 */
function formatPrice(price) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

/**
 * Obtener datos del rental desde localStorage
 */
function getRentHistory() {
    return JSON.parse(localStorage.getItem('rentHistory')) || [];
}

/**
 * Obtener wishlist desde localStorage
 */
function getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist')) || [];
}

// ==========================================
// 8. ANIMACIONES CSS
// ==========================================

// Insertar animaciones en el head
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ==========================================
// 9. DATOS DE EJEMPLO (Mock Data)
// ==========================================

// Simulación de datos de juegos recomendados
const recommendedGames = [
    {
        id: 1,
        title: 'GTA: San Andreas',
        price: 15.99,
        rating: 4.5,
        platform: 'PlayStation 2'
    },
    {
        id: 2,
        title: 'GTA III',
        price: 12.99,
        rating: 4.3,
        platform: 'PlayStation 2'
    },
    {
        id: 3,
        title: 'Red Dead Redemption',
        price: 18.99,
        rating: 4.7,
        platform: 'Xbox 360'
    },
    {
        id: 4,
        title: 'Max Payne',
        price: 10.99,
        rating: 4.2,
        platform: 'PlayStation 2'
    }
];

// ==========================================
// 10. FUNCIONES DE UTILIDAD
// ==========================================

/**
 * Validar email
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Copiar al portapapeles
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

/**
 * Toggle de clase en un elemento
 */
function toggleClass(element, className) {
    if (element.classList.contains(className)) {
        element.classList.remove(className);
    } else {
        element.classList.add(className);
    }
}

// ==========================================
// 11. MODALES
// ==========================================

function initializeModals() {
    const rentalBtn = document.querySelector('.btn-rent');
    const sellerRating = document.querySelector('.seller-rating');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.querySelectorAll('.modal-close');

    // Abrir modal de alquiler
    if (rentalBtn) {
        rentalBtn.addEventListener('click', openRentalModal);
    }

    // Abrir modal de valoraciones
    if (sellerRating) {
        sellerRating.addEventListener('click', function(e) {
            if (e.target.classList.contains('fas') || e.target.closest('.rating-stars')) {
                openRatingsModal();
            }
        });
    }

    // Cerrar modales
    modalClose.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    modalOverlay.addEventListener('click', closeAllModals);

    // Cerrar al presionar ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Funcionalidad del input de valoración
    initializeRatingStars();
}

/**
 * Abrir modal de alquiler
 */
function openRentalModal() {
    const modal = document.getElementById('modal-rental');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('modal-open');

    // Botón confirmar alquiler
    const confirmBtn = modal.querySelector('.modal-btn-rent');
    confirmBtn.removeEventListener('click', handleConfirmRental);
    confirmBtn.addEventListener('click', handleConfirmRental);
}

/**
 * Abrir modal de valoraciones
 */
function openRatingsModal() {
    const modal = document.getElementById('modal-ratings');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('modal-open');

    // Botón enviar valoración
    const submitBtn = modal.querySelector('.btn-submit-rating');
    submitBtn.removeEventListener('click', handleSubmitRating);
    submitBtn.addEventListener('click', handleSubmitRating);
}

/**
 * Cerrar todos los modales
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('modal-overlay');
    
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    overlay.classList.remove('active');
    document.body.classList.remove('modal-open');

    // Limpiar input de valoración
    const ratingInput = document.querySelector('.rating-comment-input');
    if (ratingInput) {
        ratingInput.value = '';
    }

    // Limpiar estrellas seleccionadas
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(star => {
        star.classList.remove('active');
    });
}

/**
 * Confirmar alquiler
 */
function handleConfirmRental() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
    const gameTitle = document.querySelector('.product-title').textContent;
    const paymentMethods = {
        'paypal': 'PayPal',
        'credit-card': 'Tarjeta de Crédito',
        'applepay': 'ApplePay'
    };

    // Guardar en historial
    let rentHistory = JSON.parse(localStorage.getItem('rentHistory')) || [];
    const rental = {
        game: gameTitle,
        price: document.querySelector('.detail-value.price').textContent,
        date: new Date().toLocaleDateString('es-ES'),
        time: new Date().toLocaleTimeString('es-ES'),
        payment: paymentMethods[selectedPayment]
    };
    rentHistory.push(rental);
    localStorage.setItem('rentHistory', JSON.stringify(rentHistory));

    closeAllModals();
    showNotification(`✓ Alquiler confirmado con ${paymentMethods[selectedPayment]}`);
}

/**
 * Enviar valoración
 */
function handleSubmitRating() {
    const stars = document.querySelectorAll('.rating-star.active').length;
    const comment = document.querySelector('.rating-comment-input').value;
    const sellerName = document.querySelector('.seller-name').textContent;

    if (stars === 0) {
        showNotification('⚠ Por favor selecciona una puntuación');
        return;
    }

    // Guardar valoración en localStorage
    let userRatings = JSON.parse(localStorage.getItem('userRatings')) || [];
    const rating = {
        seller: sellerName,
        rating: stars,
        comment: comment,
        date: new Date().toLocaleDateString('es-ES')
    };
    userRatings.push(rating);
    localStorage.setItem('userRatings', JSON.stringify(userRatings));

    closeAllModals();
    showNotification(`✓ Valoración enviada: ${stars} estrella${stars > 1 ? 's' : ''}`);
}

/**
 * Inicializar interactividad de estrellas de valoración
 */
function initializeRatingStars() {
    const stars = document.querySelectorAll('.rating-star');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            
            // Marcar todas las estrellas hasta la seleccionada
            stars.forEach(s => {
                if (s.getAttribute('data-rating') <= rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });

        star.addEventListener('mouseenter', function() {
            const rating = this.getAttribute('data-rating');
            stars.forEach(s => {
                if (s.getAttribute('data-rating') <= rating) {
                    s.style.color = 'var(--color-primary)';
                } else {
                    s.style.color = 'var(--color-text-muted)';
                }
            });
        });
    });

    // Reset al salir del contenedor
    const ratingContainer = document.querySelector('.rating-input-stars');
    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', function() {
            stars.forEach(s => {
                if (s.classList.contains('active')) {
                    s.style.color = 'var(--color-primary)';
                } else {
                    s.style.color = 'var(--color-text-muted)';
                }
            });
        });
    }
}

// ==========================================
// 12. FUNCIONES REUTILIZABLES DE MODALES
// ==========================================

/**
 * Abre un modal específico usando su ID
 * Uso desde otras páginas: openModal('modal-id')
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) {
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.classList.add('modal-open');
    }
}

/**
 * Cierra un modal específico usando su ID
 * Uso desde otras páginas: closeModal('modal-id')
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Verifica si hay otros modales abiertos
    const activeModals = document.querySelectorAll('.modal.active');
    if (activeModals.length === 0) {
        overlay.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

console.log('%c🎮 Página de Alquiler de Videojuegos', 'color: #ff6100; font-size: 16px; font-weight: bold;');
console.log('%cMódulo inicializado correctamente', 'color: #22222; font-size: 12px;');
console.log('Funcionalidades implementadas:');
console.log('- Sistema de alquiler de videojuegos');
console.log('- Sistema de favoritos');
console.log('- Búsqueda de juegos');
console.log('- Historia de alquileres (localStorage)');
console.log('- Interfaz responsive');
