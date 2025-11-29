import { auth } from './firebase.js';
import { setupAuthListeners, updateUIForUser, setupPasswordValidation } from './auth.js';
import { setupTimerEventListeners } from './timer.js';
import { setupNavEventListeners, setupModalEventListeners, setupFormEventListeners, setupGeneralEventListeners, addYarn } from './ui.js';
import { loadFormState, setupSalaryPersistence } from './storage.js';
import { updateCalculations } from './calculations.js';

/**
 * Função principal de inicialização da aplicação.
 * É chamada quando o DOM está completamente carregado.
 */
function init() {
    // 1. Configura o monitoramento de autenticação do Firebase.
    // Esta função será chamada sempre que o usuário logar ou deslogar.
    auth.onAuthStateChanged(user => {
        updateUIForUser(user);
    });

    // 2. Configura todos os "escutadores de eventos" da aplicação.
    setupNavEventListeners();
    setupModalEventListeners();
    setupFormEventListeners();
    setupTimerEventListeners();
    setupAuthListeners();
    setupPasswordValidation();
    setupGeneralEventListeners();

    // 3. Configura a persistência de dados no localStorage.
    setupSalaryPersistence();
    loadFormState(); // Carrega o estado do formulário da última sessão.

    // Adiciona listeners que podem não ter sido pegos na inicialização modular
    const confirmYarnBtn = document.getElementById('confirmYarnBtn');
    if (confirmYarnBtn) {
        confirmYarnBtn.addEventListener('click', addYarn);
    }

    // 4. Realiza um cálculo inicial para garantir que a UI esteja correta.
    updateCalculations();
}

// Adiciona o listener para iniciar a aplicação assim que a página carregar.
document.addEventListener('DOMContentLoaded', init);