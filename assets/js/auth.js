document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('[data-auth-form]');

    forms.forEach(function(form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            const mode = form.getAttribute('data-auth-form');
            const emailInput = form.querySelector('input[name="email"]');
            const passwordInput = form.querySelector('input[name="password"]');

            if (!emailInput || !passwordInput) {
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!isValidEmail(email)) {
                showAuthToast('Introduce un correo valido.');
                emailInput.focus();
                return;
            }

            if (password.length < 6) {
                showAuthToast('La contrasena debe tener al menos 6 caracteres.');
                passwordInput.focus();
                return;
            }

            if (mode === 'register') {
                const nameInput = form.querySelector('input[name="name"]');
                const repeatInput = form.querySelector('input[name="passwordRepeat"]');
                const termsInput = form.querySelector('input[name="terms"]');

                if (!nameInput || nameInput.value.trim().length < 2) {
                    showAuthToast('Escribe tu nombre.');
                    if (nameInput) {
                        nameInput.focus();
                    }
                    return;
                }

                if (!repeatInput || repeatInput.value !== password) {
                    showAuthToast('Las contrasenas no coinciden.');
                    if (repeatInput) {
                        repeatInput.focus();
                    }
                    return;
                }

                if (!termsInput || !termsInput.checked) {
                    showAuthToast('Debes aceptar los terminos del servicio.');
                    return;
                }

                try {
                    const response = await sendAuthRequest('/.netlify/functions/register', {
                        email: email,
                        name: nameInput.value.trim(),
                        password: password
                    });

                    if (!response.ok) {
                        showAuthToast(response.message || 'No se pudo crear la cuenta.');
                        return;
                    }

                    localStorage.setItem('rentplayUser', JSON.stringify(response.user));
                    showAuthToast('Cuenta creada. Redirigiendo al login...');
                    setTimeout(function() {
                        window.location.href = 'login.html';
                    }, 1200);
                } catch (error) {
                    showAuthToast('Error de conexion con el servidor.');
                }
                return;
            }

            try {
                const response = await sendAuthRequest('/.netlify/functions/login', {
                    email: email,
                    password: password
                });

                if (!response.ok) {
                    showAuthToast(response.message || 'No se pudo iniciar sesion.');
                    return;
                }

                localStorage.setItem('rentplayUser', JSON.stringify(response.user));
                showAuthToast('Sesion iniciada. Redirigiendo...');
                setTimeout(function() {
                    window.location.href = 'home.html';
                }, 1200);
            } catch (error) {
                showAuthToast('Error de conexion con el servidor.');
            }
        });
    });
});

async function sendAuthRequest(url, payload) {
    const body = new URLSearchParams(payload);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: body
    });

    const data = await response.json();
    return data;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showAuthToast(message) {
    const previousToast = document.querySelector('.auth-toast');
    if (previousToast) {
        previousToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'auth-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(function() {
        toast.classList.add('visible');
    });

    setTimeout(function() {
        toast.classList.remove('visible');
        setTimeout(function() {
            toast.remove();
        }, 250);
    }, 2200);
}
