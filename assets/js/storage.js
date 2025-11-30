import { state, elements } from './state.js';
import { updateCalculations } from './calculations.js';
import { renderYarns, renderMaterials, showToast, updateYarnWeight, deleteYarn, deleteMaterial } from './ui.js';
import { updateTimerDisplay } from './timer.js';

const FORM_STATE_KEY = 'amigurumiPreco_formState';
const SALARY_STORAGE_KEY = 'amigurumiPreco_baseSalary';

/**
 * Salva o estado atual do formulário no localStorage.
 */
export function saveFormState() {
    // CORREÇÃO: Calcula o tempo total real (acumulado + sessão atual) antes de salvar
    const currentTotalTime = state.timer.accumulatedSeconds + state.timer.currentSessionSeconds;

    const formState = {
        pieceName: elements.pieceName.value,
        pieceType: elements.pieceType.value,
        yarns: state.yarns,
        otherMaterials: state.otherMaterials,
        // Salva o tempo total calculado corretamente
        totalSeconds: currentTotalTime,
        // Salva também o tempo de retrabalho
        reworkSeconds: state.timer.reworkSeconds,
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
    
    // CORREÇÃO: Restaura o tempo total para o acumulado
    state.timer.accumulatedSeconds = formState.totalSeconds || 0;
    state.timer.currentSessionSeconds = 0; // Reseta a sessão atual pois é um novo carregamento
    state.timer.reworkSeconds = formState.reworkSeconds || 0; // Restaura o retrabalho
    
    // Mantém a compatibilidade, mas o valor real agora está em accumulatedSeconds
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

/**
 * Configura os "escutadores de eventos" para os formulários principais.
 */
export function setupFormEventListeners() {
    // Delegação de eventos para os itens de fio
    if (elements.yarnsContainer) {
        elements.yarnsContainer.addEventListener('change', e => {
            if (e.target.matches('input[data-yarn-id]')) {
                updateYarnWeight(Number(e.target.dataset.yarnId), parseFloat(e.target.value));
            }
        });
        elements.yarnsContainer.addEventListener('click', e => {
            const deleteBtn = e.target.closest('.yarn-delete');
            if (deleteBtn) {
                deleteYarn(Number(deleteBtn.dataset.yarnId));
            }
        });
    }

    // Delegação de eventos para os itens de material (CORRIGIDO NA RESPOSTA ANTERIOR)
    if (elements.materialsContainer) {
        elements.materialsContainer.addEventListener('click', e => {
            const deleteBtn = e.target.closest('.material-delete[data-material-id]');
            if (deleteBtn) {
                deleteMaterial(Number(deleteBtn.dataset.materialId));
            }
        });
    }

    // Listeners para salvar o estado do formulário automaticamente
    if (elements.pieceName) elements.pieceName.addEventListener('input', saveFormState);
    if (elements.pieceType) elements.pieceType.addEventListener('change', saveFormState);
    if (elements.profitMarginInput) elements.profitMarginInput.addEventListener('change', () => { updateCalculations(); saveFormState(); });
    if (elements.indirectCostsInput) elements.indirectCostsInput.addEventListener('change', () => { updateCalculations(); saveFormState(); });
}