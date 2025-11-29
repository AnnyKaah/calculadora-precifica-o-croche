import { auth, db } from './firebase.js';
import { elements, state } from './state.js';
import { showToast, renderHistory, renderRecipes, openModal } from './ui.js';
import { loadDataFromFirestore } from './pieceManager.js';

function showMainApp() {
    if (elements.heroPage && elements.mainApp) {
        elements.heroPage.style.display = 'none';
        elements.mainApp.style.display = 'flex';
    }
}

function openAuthModal() {
    openModal(elements.authModal);
    // Garante que o formulário de login seja o padrão e foca no email
    setTimeout(() => {
        toggleAuthForm(false);
        elements.loginEmail.focus();
    }, 50); // Pequeno delay para garantir que o modal esteja visível
}

function handleLogin(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            elements.authModal.classList.remove('active');
            showToast('Login realizado com sucesso!', 'success');
            showMainApp(); // <-- Adicionado aqui
        })
        .catch(error => showToast(`Erro ao fazer login: ${error.message}`, 'error'));
}

function handleRegister(name, email, password) {
    if (!validatePassword(password)) {
        showToast('Sua senha não atende a todos os critérios de segurança.', 'error');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            showToast(`Bem-vindo(a), ! Conta criada com sucesso.`, 'success');
            return userCredential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            elements.authModal.classList.remove('active');
            showMainApp(); // <-- Adicionado aqui
        })
        .catch(error => showToast(`Erro ao registrar: ${error.message}`, 'error'));
}

function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => {
            elements.authModal.classList.remove('active');
            showToast('Login com Google realizado com sucesso!', 'success');
            showMainApp(); // <-- Adicionado aqui
        })
        .catch(error => showToast(`Erro ao fazer login com Google: ${error.message}`, 'error'));
}

function handlePasswordResetRequest(e) {
    e.preventDefault();
    const email = elements.loginEmail.value;
    if (!email) {
        showToast('Digite seu e-mail para redefinir a senha.', 'info');
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => showToast('E-mail de redefinição enviado! Verifique sua caixa de entrada.', 'success'))
        .catch(error => showToast(`Erro ao enviar e-mail: ${error.message}`, 'error'));
}

function handleLogout() {
    auth.signOut().catch(error => console.error("Erro ao fazer logout:", error));
}

function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const targetInputId = button.dataset.target;
    const targetInput = document.getElementById(targetInputId);
    if (!targetInput) return;

    const isPressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', !isPressed);
    targetInput.type = isPressed ? 'password' : 'text';

    const icon = button.querySelector('i');
    icon.setAttribute('data-feather', isPressed ? 'eye' : 'eye-off');
    feather.replace();
}

/**
 * Alterna entre os formulários de login e registro.
 * @param {boolean} showRegister - Se true, mostra o formulário de registro; senão, mostra o de login.
 */
function toggleAuthForm(showRegister) {
    if (showRegister) {
        elements.loginForm.style.display = 'none';
        elements.registerForm.style.display = 'block';
        elements.authModalTitle.textContent = 'Criar Conta';
    } else {
        elements.loginForm.style.display = 'block';
        elements.registerForm.style.display = 'none';
        elements.authModalTitle.textContent = 'Login';
    }
}

export function updateUIForUser(user) {
    state.history = [];
    state.recipes = [];
    renderHistory();
    renderRecipes();

    if (user) {
        elements.userNameDisplay.textContent = `Olá, ${user.displayName || 'Usuário'}!`;
        elements.userInfoContainer.style.display = 'flex';
        elements.loginBtn.style.display = 'none';
        showMainApp();
        loadDataFromFirestore(user.uid);
    } else {
        elements.userInfoContainer.style.display = 'none';
        elements.loginBtn.style.display = 'block';
    }
}
function handleStartPricing() {
    const user = auth.currentUser;
    if (user) {
        // O usuário está logado, podemos redirecionar ou mostrar a seção de precificação.
        showMainApp();
    } else {
        openAuthModal();
    }
}

export function setupAuthListeners() {
    if (elements.loginBtn) elements.loginBtn.addEventListener('click', () => elements.authModal.classList.add('active'));
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout);
    if (elements.googleLoginBtn) elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
    if (elements.forgotPasswordLink) elements.forgotPasswordLink.addEventListener('click', handlePasswordResetRequest);

    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', e => {
            e.preventDefault();
            handleLogin(elements.loginEmail.value, elements.loginPassword.value);
        });
    }
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', e => {
            e.preventDefault();
            handleRegister(elements.registerName.value, elements.registerEmail.value, elements.registerPassword.value);
        });
    }

    // Adiciona o listener para o botão "Começar a Precificar"
    if (elements.startPricingBtn) {
        elements.startPricingBtn.addEventListener('click', handleStartPricing);
    }

    // Fallback para o botão de entrar sem login
    if (elements.enterAppBtn) {
        elements.enterAppBtn.addEventListener('click', showMainApp);
    }

    // Listeners para alternar entre login e registro
    if (elements.showRegister) {
        elements.showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForm(true);
        });
    }
    if (elements.showLogin) {
        elements.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForm(false);
        });
    }

    // Listener para mostrar/ocultar senha
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
}

// --- Validação de Senha ---

function validatePassword(password) {
    const checks = {
        length: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[^A-Za-z0-9]/.test(password)
    };
    updateCheckUI(elements.lengthCheck, checks.length);
    updateCheckUI(elements.caseCheck, checks.hasUpper && checks.hasLower);
    updateCheckUI(elements.numberCheck, checks.hasNumber);
    updateCheckUI(elements.specialCheck, checks.hasSpecial);
    return Object.values(checks).every(Boolean);
}

function updateCheckUI(element, isValid) {
    if (!element) return;
    const icon = element.querySelector('i');
    const newIcon = isValid ? 'check-circle' : 'x-circle';
    element.classList.toggle('valid', isValid);
    element.classList.toggle('invalid', !isValid);
    if (icon.getAttribute('data-feather') !== newIcon) {
        icon.setAttribute('data-feather', newIcon);
        feather.replace();
    }
}

export function setupPasswordValidation() {
    if (elements.registerPassword) {
        elements.registerPassword.addEventListener('input', () => validatePassword(elements.registerPassword.value));
    }
}
