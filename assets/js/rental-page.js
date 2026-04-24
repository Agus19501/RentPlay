// ==========================================
// FUNCIONALIDADES DE PÁGINA DE ALQUILER ACTIVO
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeRentalPage();
});

/**
 * Inicializar página de alquiler activo
 */
function initializeRentalPage() {
    loadLatestRentalFromApi();

    // Iniciar contador de tiempo restante
    startRentalCountdown();
    
    // Eventos estándar
    initializeEventListeners();
    initializeSearch();
    initializeWishlist();
    initializeGallery();
}

async function loadLatestRentalFromApi() {
    const api = window.RentPlayApi;
    const token = localStorage.getItem('rentplayToken');

    if (!api || !token) {
        return;
    }

    try {
        const response = await api.getMyRentals();
        const latest = response?.rentals?.[0];

        if (!latest) {
            return;
        }

        const titleElement = document.querySelector('.product-title');
        const durationElement = document.querySelector('.rental-details .detail-item .detail-value');
        const countdownElement = document.getElementById('countdown');

        if (titleElement) {
            titleElement.textContent = String(latest.game || '').toUpperCase();
        }

        if (durationElement && Number.isFinite(latest.durationDays)) {
            durationElement.textContent = `${latest.durationDays} DIAS`;
        }

        if (countdownElement && latest.endsAt) {
            countdownElement.textContent = formatTimeUntil(latest.endsAt);
        }
    } catch (error) {
        console.error('No se pudieron cargar alquileres reales:', error.message);
    }
}

function formatTimeUntil(endsAtIso) {
    const endsAtMs = new Date(endsAtIso).getTime();
    const nowMs = Date.now();
    const diffMs = Math.max(0, endsAtMs - nowMs);
    const totalSeconds = Math.floor(diffMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
}

// ==========================================
// FUNCIONES AUXILIARES BÁSICAS
// ==========================================

/**
 * Búsqueda
 */
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
        showNotification(`Buscando: "${searchTerm}"`);
    }
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Sistema de favoritos (Wishlist)
 */
function initializeWishlist() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', toggleWishlist);
        
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

/**
 * Galería de imágenes
 */
function initializeGallery() {
    const mainImage = document.querySelector('.main-image');
    if (mainImage) {
        mainImage.addEventListener('click', handleImageClick);
    }
}

function handleImageClick() {
    console.log('Imagen principal clickeada');
}

// ==========================================
// CONTADOR DE TIEMPO DE ALQUILER
// ==========================================

/**
 * Inicia el contador regresivo de tiempo de alquiler
 */
function startRentalCountdown() {
    const countdownElement = document.getElementById('countdown');
    
    if (!countdownElement) return;

    // Obtener tiempo inicial del elemento o usar un valor por defecto
    let countdownText = countdownElement.textContent;
    let [hours, minutes, seconds] = countdownText.split(':').map(Number);
    
    // Convertir a segundos totales
    let totalSeconds = hours * 3600 + minutes * 60 + seconds;

    // Actualizar cada segundo
    const countdownInterval = setInterval(function() {
        if (totalSeconds <= 0) {
            clearInterval(countdownInterval);
            handleRentalExpired();
            return;
        }

        totalSeconds--;

        // Calcular horas, minutos y segundos
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        // Formatear con ceros al inicio
        const formattedTime = 
            String(h).padStart(2, '0') + ':' +
            String(m).padStart(2, '0') + ':' +
            String(s).padStart(2, '0');

        countdownElement.textContent = formattedTime;

        // Cambiar color si quedan menos de 1 hora
        if (totalSeconds < 3600) {
            countdownElement.style.color = '#ff4444';
        }

        // Cambiar color si quedan menos de 10 minutos
        if (totalSeconds < 600) {
            countdownElement.style.color = '#ff0000';
        }
    }, 1000);

    // Guardar el intervalo en caso de necesitar detenerlo
    window.rentalCountdownInterval = countdownInterval;
}

/**
 * Manejador cuando el alquiler expira
 */
function handleRentalExpired() {
    const countdownElement = document.getElementById('countdown');
    const rentalStatus = document.querySelector('.rental-status');

    if (countdownElement) {
        countdownElement.textContent = '00:00:00';
        countdownElement.style.color = '#ff0000';
    }

    if (rentalStatus) {
        rentalStatus.innerHTML = '<i class="fas fa-times-circle"></i><span>ALQUILER FINALIZADO</span>';
        rentalStatus.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        rentalStatus.style.borderColor = '#ff0000';
        rentalStatus.style.color = '#ff0000';
    }

    showNotification('⏰ Tu alquiler ha finalizado');
}

/**
 * Detener el contador (para cuando se navega a otra página)
 */
function stopRentalCountdown() {
    if (window.rentalCountdownInterval) {
        clearInterval(window.rentalCountdownInterval);
    }
}

// ==========================================
// MANEJO DE EVENTOS
// ==========================================

function initializeEventListeners() {
    // Botón de contacto
    const contactBtn = document.querySelector('.btn-contact-rental');
    if (contactBtn) {
        contactBtn.addEventListener('click', handleContactRental);
    }

    // Botones de ver detalles
    const detailBtns = document.querySelectorAll('.btn-secondary');
    detailBtns.forEach(btn => {
        btn.addEventListener('click', handleViewDetails);
    });

    // Navegación de galería
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

    // Modales
    initializeModals();
}

/**
 * Manejador de contacto con el propietario
 */
function handleContactRental() {
    const sellerName = document.querySelector('.seller-name').textContent;
    console.log('Contactar con:', sellerName);
    // Mostrar notificación con modal de chat
    showNotification(`📞 Conectando con ${sellerName}...`);
    // Aquí se abriría un chat en tiempo real
}

function handleViewDetails(e) {
    const gameTitle = e.target.closest('.game-card').querySelector('.game-title').textContent;
    console.log('Ver detalles de:', gameTitle);
    showNotification(`Abriendo: ${gameTitle}`);
}

function handlePrevImage() {
    console.log('Imagen anterior');
    showNotification('Imagen anterior');
}

function handleNextImage() {
    console.log('Siguiente imagen');
    showNotification('Siguiente imagen');
}

function handleLanguageChange() {
    console.log('Cambiar idioma');
    showNotification('Idioma cambiado a Español');
}

function handleUserClick() {
    console.log('Panel de usuario');
    showNotification('Abriendo perfil de usuario...');
}

/**
 * Mostrar notificación temporal
 */
function showNotification(message) {
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

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// SISTEMA DE MODALES
// ==========================================

/**
 * Inicializar modales de la página
 */
function initializeModals() {
    const btnValorar = document.querySelector('.btn-valorar');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.querySelectorAll('.modal-close');

    // Abrir modal de valoraciones
    if (btnValorar) {
        btnValorar.addEventListener('click', openRatingsModal);
    }

    // Cerrar modales
    modalClose.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeAllModals);
    }

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
 * Abrir modal de valoraciones
 */
function openRatingsModal() {
    const modal = document.getElementById('modal-ratings');
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.classList.add('modal-open');

        // Botón enviar valoración
        const submitBtn = modal.querySelector('.btn-submit-rating');
        if (submitBtn) {
            submitBtn.removeEventListener('click', handleSubmitRating);
            submitBtn.addEventListener('click', handleSubmitRating);
        }
    }
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
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    document.body.classList.remove('modal-open');

    // Limpiar formulario de valoración
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
// LIMPIAR RECURSOS AL SALIR
// ==========================================

window.addEventListener('beforeunload', function() {
    stopRentalCountdown();
});

console.log('%c🎮 Página de Alquiler Activo Cargada', 'color: #ff6100; font-size: 14px; font-weight: bold;');
console.log('Contador de tiempo inicializado');
