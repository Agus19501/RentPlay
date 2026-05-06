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
// 1. GESTIÃN DE EVENTOS
// ==========================================

function initializeEventListeners() {
    // BotÃ³n de alquiler
    const rentBtn = document.querySelector('.btn-rent');
    if (rentBtn) {
        rentBtn.addEventListener('click', handleRentClick);
    }

    // BotÃ³n de contacto con propietario
    const contactBtn = document.querySelector('.btn-contact');
    if (contactBtn) {
        contactBtn.addEventListener('click', handleContactClick);
    }

    // Botones de ver detalles
    const detailBtns = document.querySelectorAll('.btn-secondary');
    detailBtns.forEach(btn => {
        btn.addEventListener('click', handleViewDetails);
    });

    // NavegaciÃ³n de galerÃ­as de recomendados
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
// 2. BÃŠSQUEDA
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
        // AquÃ­ irÃ­a la lÃ³gica de bÃºsqueda
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
            // Cambiar Ã­cono a corazÃ³n lleno
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
        // Cambiar Ã­cono a corazÃ³n vacÃ­o
        if (icon) {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
        showNotification('Eliminado de favoritos');
    } else {
        addToWishlist(gameTitle);
        wishlistBtn.classList.add('active');
        // Cambiar Ã­cono a corazÃ³n lleno
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
// 4. GALERÃA DE IMÃGENES
// ==========================================

function initializeGallery() {
    const mainImage = document.querySelector('.main-image');
    if (mainImage) {
        mainImage.addEventListener('click', handleImageClick);
    }

    // Botones de navegaciÃ³n de galerÃ­a
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
    // PodrÃ­as abrir un modal o visor a pantalla completa
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
    window.location.href = 'ver-juego.html';
}

/**
 * Manejador de click en perfiles
 */
function handleProfileItemClick(e) {
    const profileName = e.currentTarget.querySelector('.profile-name').textContent;
    console.log('Perfil seleccionado:', profileName);
    showNotification(`Visitando perfil: ${profileName}`);
    window.location.href = 'perfil.html';
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
    
    // RÃ©cord de alquiler en localStorage
    let rentHistory = JSON.parse(localStorage.getItem('rentHistory')) || [];
    const rental = {
        game: gameTitle,
        price: price,
        date: new Date().toLocaleDateString('es-ES'),
        time: new Date().toLocaleTimeString('es-ES')
    };
    rentHistory.push(rental);
    localStorage.setItem('rentHistory', JSON.stringify(rentHistory));
    
    showNotification(`âœ“ Alquiler procesado: ${gameTitle}`);
}

function handleContactClick() {
    const sellerName = document.querySelector('.seller-name').textContent;
    console.log('Contactar con:', sellerName);
    showNotification(`Conectando con ${sellerName}...`);
    window.location.href = 'mensajes.html';
}

function handleViewDetails(e) {
    const gameCard = e.target.closest('.game-card');
    const gameTitle = gameCard ? gameCard.querySelector('.game-title').textContent : 'Juego';
    console.log('Ver detalles de:', gameTitle);
    showNotification(`Abriendo: ${gameTitle}`);
    window.location.href = 'ver-juego.html';
}

function handleLanguageChange() {
    console.log('Cambiar idioma');
    showNotification('Idioma cambiado');
}

function handleUserClick() {
    console.log('Panel de usuario');
    showNotification('Abriendo perfil de usuario...');
    window.location.href = 'perfil.html';
}

// ==========================================
// 6. MENÃš MÃ“VIL
// ==========================================

function initializeMobileMenu() {
    // En esta versiÃ³n bÃ¡sica, el menÃº es responsive con CSS
    // Pero aquÃ­ puedes aÃ±adir lÃ³gica adicional si es necesaria
}

// ==========================================
// 7. FUNCIONES AUXILIARES
// ==========================================

/**
 * Debounce para optimizar bÃºsqueda en tiempo real
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Mostrar notificaciÃ³n temporal
 */
function showNotification(message) {
    // Crear elemento de notificaciÃ³n
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

    // Remover despuÃ©s de 3 segundos
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

// SimulaciÃ³n de datos de juegos recomendados
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
            if (e.target.classList.contains('fas') || e.target.closest('.rating-stars') || e.target.closest('.seller-rating')) {
                openRatingsModal();
            }
        });
    }

    // Vincular todos los botones de btn-valorar al modal de valoraciones
    const btnValorarArray = document.querySelectorAll('.btn-valorar');
    btnValorarArray.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openRatingsModal();
        });
    });

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

    // Funcionalidad del input de valoraciÃ³n
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

    // BotÃ³n confirmar alquiler
    const confirmBtn = modal.querySelector('.modal-btn-rent');
    confirmBtn.removeEventListener('click', handleConfirmRental);
    confirmBtn.addEventListener('click', handleConfirmRental);
}

/**
 * Abrir modal de valoraciones
 */
async function openRatingsModal() {
    const modal = document.getElementById('modal-ratings');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('modal-open');

    // Boton enviar valoracion
    const submitBtn = modal.querySelector('.btn-submit-rating');
    submitBtn.removeEventListener('click', handleSubmitRating);
    submitBtn.addEventListener('click', handleSubmitRating);

    // CARGAR VALORACIONES DE BASE DE DATOS
    const sellerElement = document.querySelector('.seller-name');
    const sellerName = sellerElement ? sellerElement.textContent : 'Anonimo';
    const ratingsList = modal.querySelector('.ratings-list');
    
    if (window.RentPlayApi && ratingsList && typeof window.RentPlayApi.getSellerRatings === 'function') {
        try {
            ratingsList.innerHTML = '<p>Cargando valoraciones de la BD...</p>';
            const response = await window.RentPlayApi.getSellerRatings(sellerName);
            if (response && response.ratings && response.ratings.length > 0) {
                ratingsList.innerHTML = response.ratings.map(r => 
                    <div class="rating-item">
                        <div class="rating-user-avatar"><i class="fas fa-user-circle"></i></div>
                        <div class="rating-user-info">
                            <h4 class="rating-username">Usuario Anónimo</h4>
                            <div class="rating-stars">
                                 + '<i class="fas fa-star"></i>'.repeat(Math.round(r.score)) + '<i class="far fa-star"></i>'.repeat(5 - Math.round(r.score)) + 
                                <span class="rating-score">\</span>
                            </div>
                            <p class="rating-comment">\</p>
                        </div>
                    </div>
                ).join('');
            } else {
                ratingsList.innerHTML = '<p style="color:#aaa;">No hay valoraciones en BD todavia para este perfil. ¡Se el primero en dejar una!</p>';
            }
        } catch (error) {
            console.warn("Aviso llamando BD Valoraciones:", error);
            ratingsList.innerHTML = '<p style="color:#ff6100;">No se pudo conectar a la base de datos de valoraciones.</p>';
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
    overlay.classList.remove('active');
    document.body.classList.remove('modal-open');

    // Limpiar input de valoraciÃ³n
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
async function handleConfirmRental() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
    const gameTitle = document.querySelector('.product-title').textContent;
    const priceRaw = document.querySelector('.detail-value.price').textContent;
    const paymentMethods = {
        'paypal': 'PayPal',
        'credit-card': 'Tarjeta de CrÃ©dito',
        'applepay': 'ApplePay'
    };

    const paymentName = paymentMethods[selectedPayment] || selectedPayment;

    // Intentar guardar en la Base de Datos usando la API de tu compaÃ±ero
    if (window.RentPlayApi) {
        try {
            await window.RentPlayApi.createRental({
                game: gameTitle,
                price: priceRaw.trim(),
                payment: selectedPayment.toLowerCase(), // Normalizado para su backend
                durationDays: 6
            });
        } catch (error) {
            console.warn("Aviso API Backend:", error.message);
            // No detenemos la ejecuciÃ³n para que siga funcionando visualmente con localStorage
        }
    }

    // Guardar en historial local como respaldo visual (mi-alquiler)
    let rentHistory = JSON.parse(localStorage.getItem('rentHistory')) || [];
    const rental = {
        game: gameTitle,
        price: priceRaw,
        date: new Date().toLocaleDateString('es-ES'),
        time: new Date().toLocaleTimeString('es-ES'),
        payment: paymentName
    };
    rentHistory.push(rental);
    localStorage.setItem('rentHistory', JSON.stringify(rentHistory));

    closeAllModals();
    showNotification(`âœ“ Alquiler confirmado con ${paymentName}`);
}

/**
 * Enviar valoraciÃ³n
 */
async function handleSubmitRating() {
    const stars = document.querySelectorAll('.rating-star.active').length;
    const commentInput = document.querySelector('.rating-comment-input');
    const comment = commentInput ? commentInput.value : '';
    const sellerElement = document.querySelector('.seller-name');
    const sellerName = sellerElement ? sellerElement.textContent : 'Anonimo';

    if (stars === 0) {
        showNotification('Aviso: selecciona una puntuacion');
        return;
    }

    if (window.RentPlayApi && typeof window.RentPlayApi.createRating === 'function') {
        try {
            await window.RentPlayApi.createRating({
                toSeller: sellerName,
                score: stars,
                comment: comment
            });
        } catch(e) {
            console.warn("API Backend Valoraciones:", e.message);
        }
    }

    let userRatings = JSON.parse(localStorage.getItem('userRatings')) || [];
    userRatings.push({
        seller: sellerName,
        rating: stars,
        comment: comment,
        date: new Date().toLocaleDateString('es-ES')
    });
    localStorage.setItem('userRatings', JSON.stringify(userRatings));

    closeAllModals();
    showNotification('Valoracion de ' + stars + ' estrellas enviada con exito y sincronizada en BD');
}

    // Guardar valoraciÃ³n en localStorage
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
    showNotification(`âœ“ ValoraciÃ³n enviada: ${stars} estrella${stars > 1 ? 's' : ''}`);
}

/**
 * Inicializar interactividad de estrellas de valoraciÃ³n
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
 * Abre un modal especÃ­fico usando su ID
 * Uso desde otras pÃ¡ginas: openModal('modal-id')
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
 * Cierra un modal especÃ­fico usando su ID
 * Uso desde otras pÃ¡ginas: closeModal('modal-id')
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) {
        modal.classList.remove('active');
    }