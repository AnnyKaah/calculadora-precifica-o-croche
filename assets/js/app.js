import { elements } from './state.js';
import { setupTimerControls } from './timer.js';
import { setupNavEventListeners, setupModalEventListeners, setupGeneralEventListeners, showMainApp } from './ui.js';
import { loadFormState, setupSalaryPersistence, setupFormEventListeners } from './storage.js';
import { updateCalculations } from './calculations.js';

/**
 * Função principal de inicialização da aplicação.
 * É chamada quando o DOM está completamente carregado.
 */
function init() {
    // Garante que a aplicação principal comece escondida e a hero page visível.
    if (elements.mainApp) elements.mainApp.classList.add('is-hidden');
    if (elements.heroPage) elements.heroPage.classList.remove('is-hidden');

    // 1. Configura o botão para iniciar a aplicação
    if (elements.enterAppBtn) {
        elements.enterAppBtn.addEventListener('click', showMainApp);
    }

    // 2. Configura todos os "escutadores de eventos" da aplicação.
    setupNavEventListeners();
    setupModalEventListeners();
    setupFormEventListeners();
    setupTimerControls(); // Centraliza a chamada para configurar o timer
    setupGeneralEventListeners();

    // 3. Configura a persistência de dados no localStorage.
    setupSalaryPersistence();
    loadFormState(); // Carrega o estado do formulário da última sessão.

    // 4. Realiza um cálculo inicial para garantir que a UI esteja correta.
    updateCalculations();
}

// Adiciona o listener para iniciar a aplicação assim que a página carregar.
document.addEventListener('DOMContentLoaded', init);