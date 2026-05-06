document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('[data-auth-form]');

    forms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
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

                submitAuthRequest({
                    mode: 'register',
                    email: email,
                    password: password,
                    name: nameInput.value.trim(),
                    form: form
                });
                return;
            }

            submitAuthRequest({
                mode: 'login',
                email: email,
                password: password,
                form: form
            });
        });
    });
});

async function submitAuthRequest(options) {
    const mode = options.mode;
    const form = options.form;
    const api = window.RentPlayApi;

    if (!api) {
        showAuthToast('No se encontro el cliente API. Revisa los scripts cargados.');
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        if (mode === 'register') {
            await api.register({
                name: options.name,
                email: options.email,
                password: options.password
            });
            showAuthToast('Cuenta creada correctamente. Redirigiendo...');
        } else {
            await api.login({
                email: options.email,
                password: options.password
            });
            showAuthToast('Sesion iniciada. Redirigiendo...');
        }

        setTimeout(function() {
            window.location.href = 'home.html';
        }, 1000);
    } catch (error) {
        showAuthToast(error.message || 'No se pudo completar la autenticacion.');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
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