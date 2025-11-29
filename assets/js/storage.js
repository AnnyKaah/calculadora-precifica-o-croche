import { state, elements } from './state.js';
import { updateCalculations } from './calculations.js';
import { renderYarns, renderMaterials, showToast } from './ui.js';
import { updateTimerDisplay } from './timer.js';

const FORM_STATE_KEY = 'amigurumiPreco_formState';
const SALARY_STORAGE_KEY = 'amigurumiPreco_baseSalary';

/**
 * Salva o estado atual do formulário no localStorage.
 */
export function saveFormState() {
    const formState = {
        pieceName: elements.pieceName.value,
        pieceType: elements.pieceType.value,
        yarns: state.yarns,
        otherMaterials: state.otherMaterials,
        totalSeconds: state.timer.totalSeconds,
        timerIsRunning: state.timer.isRunning,
        indirectCosts: elements.indirectCostsInput.value,
        profitMargin: elements.profitMarginInput.value,
    };
    localStorage.setItem(FORM_STATE_KEY, JSON.stringify(formState));
}

/**
 * Carrega o estado do formulário do localStorage e preenche os campos.
 */
export function loadFormState() {
    const savedState = localStorage.getItem(FORM_STATE_KEY);
    if (!savedState) return;

    const formState = JSON.parse(savedState);

    elements.pieceName.value = formState.pieceName || '';
    elements.pieceType.value = formState.pieceType || '';
    elements.indirectCostsInput.value = formState.indirectCosts || '15';
    elements.profitMarginInput.value = formState.profitMargin || '30';

    state.yarns = formState.yarns || [];
    state.otherMaterials = formState.otherMaterials || [];
    state.timer.totalSeconds = formState.totalSeconds || 0;

    if (formState.timerIsRunning) {
        state.timer.isPaused = true;
        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
    }

    renderMaterials();
    renderYarns();
    updateTimerDisplay();
    updateCalculations();

    showToast('📝 Formulário restaurado da última sessão!', 'info');
}

/**
 * Limpa o estado do formulário salvo no localStorage.
 */
export function clearFormState() {
    localStorage.removeItem(FORM_STATE_KEY);
}

export function saveBaseSalary(salaryValue) {
    if (isNaN(salaryValue)) return;
    
    localStorage.setItem(SALARY_STORAGE_KEY, salaryValue.toFixed(2));
    state.baseSalary = salaryValue;
    elements.baseSalaryInput.value = salaryValue.toFixed(2);
    updateCalculations();
    showToast('Salário/Hora atualizado com sucesso!', 'success');
}

/**
 * Configura a persistência do salário/hora no localStorage.
 */
export function setupSalaryPersistence() {
    const savedSalary = localStorage.getItem(SALARY_STORAGE_KEY);
    if (savedSalary) {
        saveBaseSalary(parseFloat(savedSalary));
    }

    elements.baseSalaryInput.addEventListener('change', () => saveBaseSalary(parseFloat(elements.baseSalaryInput.value)));
}
