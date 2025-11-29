import { state, elements } from './state.js';
import { saveFormState, saveBaseSalary } from './storage.js';
import { updateCalculations, calculatePricePerGramHelper, calculateSalaryHelper } from './calculations.js';
import { setupTimerEventListeners } from './timer.js'; 
import { deleteHistoryItem, generatePDF, loadPieceFromHistory, savePiece, saveRecipe, loadRecipeMaterials } from './pieceManager.js';

export function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconName = { success: 'check-circle', error: 'alert-circle', info: 'info' }[type] || 'info';
    toast.innerHTML = `<i data-feather="${iconName}" class="toast-icon"></i><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    feather.replace();
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

export function switchTab(tabName) {
    const newTab = document.getElementById(`${tabName}-tab`); // Encontra a nova aba pelo ID
    const currentTab = document.querySelector('.tab-pane--active'); // Encontra a aba atualmente ativa
    if (newTab === currentTab) return;

    // Atualiza o estado ativo dos botões de navegação
    elements.navButtons.forEach(btn => btn.classList.toggle('nav-btn--active', btn.dataset.tab === tabName));

    if (currentTab) {
        currentTab.classList.add('is-exiting');
        currentTab.addEventListener('animationend', () => {
            currentTab.classList.remove('tab-pane--active', 'is-exiting');
        }, { once: true });
    }
    newTab.classList.add('tab-pane--active');

    // A renderização agora é tratada pelo pieceManager ou outro módulo específico
    // if (tabName === 'history') renderHistory();
    // if (tabName === 'recipes') renderRecipes();
}

let isRecipeMode = false; // Flag para controlar o contexto do modal

export function openYarnModal(forRecipe = false) {
    isRecipeMode = forRecipe;
    document.getElementById('yarnModalTitle').textContent = forRecipe ? 'Adicionar Fio à Receita' : 'Adicionar Fio';
    elements.yarnNameInput.value = '';
    elements.yarnInitialWeightInput.value = '';
    elements.yarnFinalWeightInput.value = '';
    elements.yarnPricePerGramInput.value = '';
    elements.yarnHelperPriceInput.value = '';
    elements.yarnHelperWeightInput.value = '';
    if (elements.yarnHelperResult) {
        elements.yarnHelperResult.textContent = 'R$ 0.0000 por grama';
    }
    openModal(elements.yarnModal);
}

export function openMaterialModal(forRecipe = false) {
    isRecipeMode = forRecipe;
    document.getElementById('materialModalTitle').textContent = forRecipe ? 'Adicionar Material à Receita' : 'Adicionar Material';
    if (elements.materialNameInput) elements.materialNameInput.value = '';
    if (elements.materialQuantityInput) elements.materialQuantityInput.value = '1';
    if (elements.materialPriceInput) elements.materialPriceInput.value = '';
    if (elements.materialModal) openModal(elements.materialModal);
}

function openRecipeModal() {
    // Limpa o rascunho da receita e os campos do formulário
    state.newRecipeDraft = { name: '', description: '', yarns: [], otherMaterials: [] };
    elements.recipeNameInput.value = '';
    elements.recipeDescriptionInput.value = '';
    elements.recipeSteps.value = '';
    document.getElementById('recipeSalePrice').value = '';

    // Renderiza a lista (vazia) de materiais da receita
    renderRecipeMaterials();

    openModal(elements.recipeModal);
}

/**
 * Abre um modal e implementa o "focus trap" para acessibilidade.
 * @param {HTMLElement} modalElement O elemento do modal a ser aberto.
 */
export function openModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.add('active');

    const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function trapFocus(e) {
        const isTabPressed = e.key === 'Tab';
        if (!isTabPressed) return;

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }

    modalElement.addEventListener('keydown', trapFocus);
}

function openSalaryHelperModal() {
    elements.desiredSalaryInput.value = '';
    elements.hoursPerDayInput.value = '';
    elements.daysPerWeekInput.value = '';
    elements.salaryResultDisplay.style.display = 'none';
    elements.applySalaryBtn.disabled = true;
    state.calculatedHourlyRate = null;
    openModal(elements.salaryHelperModal);
}

export function addMaterial() {
    // Resetar erros visuais anteriores
    elements.materialNameInput.classList.remove('input-error');
    elements.materialQuantityInput.classList.remove('input-error');
    elements.materialPriceInput.classList.remove('input-error');

    const name = elements.materialNameInput.value.trim();
    const quantity = parseInt(elements.materialQuantityInput.value) || 1;
    const price = parseFloat(elements.materialPriceInput.value) || 0;

    // Validações específicas
    if (!name) {
        showToast('O nome do material não pode estar vazio.', 'error');
        elements.materialNameInput.classList.add('input-error');
        return;
    }
    if (quantity <= 0) {
        showToast('A quantidade deve ser maior que zero.', 'error');
        elements.materialQuantityInput.classList.add('input-error');
        return;
    }
    if (price <= 0) {
        showToast('O preço unitário deve ser maior que zero.', 'error');
        elements.materialPriceInput.classList.add('input-error');
        return;
    }

    const cost = quantity * price;
    const newMaterial = { id: Date.now(), name, quantity, price, cost };

    if (isRecipeMode) {
        state.newRecipeDraft.otherMaterials.push(newMaterial);
        renderRecipeMaterials();
        showToast('Material adicionado à receita!', 'success');
    } else {
        state.otherMaterials.push(newMaterial);
        renderMaterials();
        updateCalculations();
        saveFormState();
    }

    elements.materialModal.classList.remove('active');
}

export function addYarn() {
    const name = elements.yarnNameInput.value.trim();
    const pricePerGram = parseFloat(elements.yarnPricePerGramInput.value);
    if (!name || !pricePerGram) {
        showToast('Preencha o nome do fio e o preço por grama.', 'error');
        return;
    }
    const newYarn = { id: Date.now(), name, pricePerGram, usedWeight: 0, cost: 0 };

    if (isRecipeMode) {
        state.newRecipeDraft.yarns.push(newYarn);
        renderRecipeMaterials();
        showToast('Fio adicionado à receita!', 'success');
    } else {
        state.yarns.push(newYarn);
        renderYarns();
        updateCalculations();
        saveFormState();
    }
    elements.yarnModal.classList.remove('active');
}

export function updateYarnWeight(id, usedWeight) {
    const yarn = state.yarns.find(y => y.id === id);
    if (yarn) {
        yarn.usedWeight = usedWeight;
        yarn.cost = yarn.usedWeight * yarn.pricePerGram;
        renderYarns();
        updateCalculations();
        saveFormState();
    }
}

export function deleteYarn(id) {
    state.yarns = state.yarns.filter(yarn => yarn.id !== id);
    renderYarns();
    updateCalculations();
    saveFormState();
}

export function deleteMaterial(id) {
    state.otherMaterials = state.otherMaterials.filter(material => material.id !== id);
    renderMaterials();
    updateCalculations();
    saveFormState();
}

export function renderMaterials() {
    elements.materialsContainer.innerHTML = state.otherMaterials.length === 0
        ? '<p style="color: var(--text-light); text-align: center;">Nenhum outro material adicionado</p>'
        : state.otherMaterials.map(material => `
            <div class="yarn-item">
                <div class="yarn-info">
                    <div class="yarn-name">${material.name} (${material.quantity}x R$ ${material.price.toFixed(2)})</div>
                </div>
                <div class="yarn-cost">R$ ${material.cost.toFixed(2)}</div>
                <button class="yarn-delete" data-material-id="${material.id}"><i data-feather="trash-2"></i></button>
            </div>
        `).join('');
    feather.replace();
}
export function renderYarns() {
    elements.yarnsContainer.innerHTML = state.yarns.length === 0
        ? '<p style="color: var(--text-light); text-align: center;">Nenhum fio adicionado</p>'
        : state.yarns.map(yarn => `
            <div class="yarn-item">
                <div class="yarn-info">
                    <div class="yarn-name">${yarn.name} (R$ ${yarn.pricePerGram.toFixed(4)}/g)</div>
                    <div class="yarn-details">
                        <label for="yarn-weight-${yarn.id}">Peso Usado (g):</label>
                        <input type="number" min="0" class="input-small" id="yarn-weight-${yarn.id}" value="${yarn.usedWeight || ''}" data-yarn-id="${yarn.id}">
                    </div>
                </div>
                <div class="yarn-cost">R$ ${yarn.cost.toFixed(2)}</div>
                <button class="yarn-delete" data-yarn-id="${yarn.id}"><i data-feather="trash-2"></i></button>
            </div>
        `).join('');
    feather.replace();
}

export function renderHistory(searchTerm = '') {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = state.history.filter(item => item.name.toLowerCase().includes(lowerCaseSearchTerm) || item.type.toLowerCase().includes(lowerCaseSearchTerm));
    const sorted = filtered.sort((a, b) => {
        switch (state.historySortOrder) {
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            case 'date_asc': return new Date(a.date) - new Date(b.date);
            default: return new Date(b.date) - new Date(a.date);
        }
    });

    elements.historyContainer.innerHTML = sorted.length === 0
        ? `<div class="empty-state"><p>📭 Nenhuma peça no histórico.</p></div>`
        : sorted.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item__main">
                    <div class="history-item__info">
                        <h4 class="history-item__name">${item.name}</h4>
                        <p class="history-item__type">${item.type}</p>
                        <p class="history-item__date">Salvo em: ${new Date(item.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="history-item__price">
                        <span>Preço Final</span>
                        <strong>R$ ${item.finalPrice.toFixed(2)}</strong>
                    </div>
                </div>
                <div class="history-item__actions">
                    <button class="btn-icon" data-action="load" title="Carregar dados desta peça">
                        <i data-feather="upload-cloud"></i>
                    </button>
                    <button class="btn-icon" data-action="pdf" title="Gerar PDF da precificação">
                        <i data-feather="file-text"></i>
                    </button>
                    <button class="btn-icon btn-icon--danger" data-action="delete" title="Excluir esta peça">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');
}

/**
 * Renderiza a lista de materiais dentro do modal de criação de receita.
 */
function renderRecipeMaterials() {
    const container = document.getElementById('recipe-materials-list');
    if (!container) return;

    const yarnsHtml = state.newRecipeDraft.yarns.map(y => `<div>- Fio: ${y.name}</div>`).join('');
    const materialsHtml = state.newRecipeDraft.otherMaterials.map(m => `<div>- Aviamento: ${m.name}</div>`).join('');

    if (yarnsHtml || materialsHtml) {
        container.innerHTML = `
            <h4>Materiais da Receita:</h4>
            ${yarnsHtml}
            ${materialsHtml}
            <hr class="divider">
        `;
    } else {
        container.innerHTML = '<p>Nenhum material adicionado a esta receita ainda.</p>';
    }
}

export function renderRecipes() {
    if (!elements.recipesGrid) return;
    elements.recipesGrid.innerHTML = state.recipes.length === 0
        ? `<div class="empty-state"><p>Nenhuma receita salva ainda.</p></div>`
        : state.recipes.map(recipe => {
            const finalPrice = recipe.finalPrice || 0;
            return `
                <div class="history-item" data-id="${recipe.id}">
                    <div class="history-item__main">
                        <div class="history-item__info">
                            <h4 class="history-item__name">${recipe.name}</h4>
                            <p class="history-item__type">${recipe.description || 'Sem descrição.'}</p>
                        </div>
                        <div class="history-item__price">
                            <span>Preço Salvo</span>
                            <strong>R$ ${finalPrice.toFixed(2)}</strong>
                        </div>
                    </div>
                    <div class="history-item__actions">
                        <button class="btn btn--secondary btn--small" data-action="load-materials">Usar esta Receita</button>
                    </div>
                </div>
            `;
        }).join('');
}

export function setupNavEventListeners() {
    elements.navButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    if (elements.menuToggle) elements.menuToggle.addEventListener('click', () => elements.mainNav.classList.toggle('open'));
}

export function setupModalEventListeners() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal || e.target.closest('.modal__close') || e.target.closest('.btn-secondary[id^="cancel"]')) {
                modal.classList.remove('active');
            }
        });
        // Adiciona listener para a tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    });
    if (elements.addYarnBtn) elements.addYarnBtn.addEventListener('click', openYarnModal);
    const confirmYarnBtn = document.getElementById('confirmYarnBtn');
    if (confirmYarnBtn) confirmYarnBtn.addEventListener('click', addYarn); // Corrigido para chamar a função certa
    
    // Listeners para a calculadora de preço por grama (cálculo automático)
    if (elements.yarnHelperPriceInput) {
        elements.yarnHelperPriceInput.addEventListener('input', calculatePricePerGramHelper);
    }
    if (elements.yarnHelperWeightInput) {
        elements.yarnHelperWeightInput.addEventListener('input', calculatePricePerGramHelper);
    }

    // Listeners para o modal de materiais
    if (elements.addMaterialBtn) {
        elements.addMaterialBtn.addEventListener('click', openMaterialModal);
    }
    const confirmMaterialBtn = document.getElementById('confirmMaterialBtn');
    if (confirmMaterialBtn) {
        confirmMaterialBtn.addEventListener('click', addMaterial);
    }

    // Listeners para o modal de receitas
    if (elements.addRecipeBtn) {
        elements.addRecipeBtn.addEventListener('click', openRecipeModal);
    }
    const confirmRecipeBtn = document.getElementById('confirmRecipeBtn');
    if (confirmRecipeBtn) {
        confirmRecipeBtn.addEventListener('click', saveRecipe);
    }
    // Listeners para adicionar materiais DENTRO do modal de receita
    const addYarnToRecipeBtn = document.getElementById('addYarnToRecipeBtn');
    if (addYarnToRecipeBtn) {
        addYarnToRecipeBtn.addEventListener('click', () => {
            openYarnModal(true); // Abre o modal de fio em modo "receita"
        });
    }
    const addMaterialToRecipeBtn = document.getElementById('addMaterialToRecipeBtn');
    if (addMaterialToRecipeBtn) {
        addMaterialToRecipeBtn.addEventListener('click', () => {
            openMaterialModal(true); // Abre o modal de material em modo "receita"
        });
    }


    // Listeners para o modal de cálculo de salário
    if (elements.openSalaryHelperBtn) {
        elements.openSalaryHelperBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSalaryHelperModal();
        });
    }
    const salaryInputs = [elements.desiredSalaryInput, elements.hoursPerDayInput, elements.daysPerWeekInput];
    salaryInputs.forEach(input => {
        if (input) input.addEventListener('input', calculateSalaryHelper);
    });
    if (elements.applySalaryBtn) elements.applySalaryBtn.addEventListener('click', () => {
        if (state.calculatedHourlyRate) {
            saveBaseSalary(state.calculatedHourlyRate);
            elements.salaryHelperModal.classList.remove('active');
        }
    });
}

/**
 * Configura a lógica de navegação para o formulário de múltiplos passos (wizard).
 */
function setupMultiStepForm() {
    const steps = document.querySelectorAll('.form-step');
    const wizardSteps = document.querySelectorAll('.wizard-steps__item');
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    const calculateBtn = document.getElementById('calculatePriceBtn');
    let currentStep = 0;

    function updateStepView(previousStep) {
        const isAdvancing = previousStep < currentStep;

        // Apenas executa a lógica de animação se houver uma mudança de passo real
        if (previousStep !== currentStep) {
            // Animação de saída do passo antigo
            if (steps[previousStep]) {
                const outClass = isAdvancing ? 'slide-out-left' : 'slide-out-right';
                steps[previousStep].classList.add(outClass);
                steps[previousStep].addEventListener('animationend', () => {
                    steps[previousStep].classList.remove('active-step', outClass);
                }, { once: true });
            }
        }
        // Animação de entrada do novo passo
        const inClass = isAdvancing ? 'slide-in-right' : 'slide-in-left';
        steps[currentStep].classList.add('active-step', inClass);
        steps[currentStep].addEventListener('animationend', () => {
            steps[currentStep].classList.remove(inClass);
        }, { once: true });

        // Atualiza os indicadores visuais do wizard
        wizardSteps.forEach((step, index) => {
            step.classList.remove('wizard-steps__item--active', 'wizard-steps__item--completed');
            if (index < currentStep) {
                step.classList.add('wizard-steps__item--completed');
            } else if (index === currentStep) {
                step.classList.add('wizard-steps__item--active');
            }
        });

        // Controla a visibilidade dos botões de navegação
        if (prevBtn) prevBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';
        if (nextBtn) nextBtn.style.display = currentStep < steps.length - 1 ? 'inline-block' : 'none';
        if (calculateBtn) calculateBtn.style.display = currentStep === steps.length - 1 ? 'inline-block' : 'none';
    }

    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length - 1) {
            const oldStep = currentStep;
            currentStep++;
            updateStepView(oldStep);
        }
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            const oldStep = currentStep;
            currentStep--;
            updateStepView(oldStep);
        }
    });

    // Inicializa a visualização sem causar animações de saída
    if (steps.length > 0) {
        updateStepView(currentStep);
    }
}

export function setupFormEventListeners() {
    // Delegação de eventos para os itens de fio
    if (elements.yarnsContainer) elements.yarnsContainer.addEventListener('change', e => {
        if (e.target.matches('input[data-yarn-id]')) {
            updateYarnWeight(Number(e.target.dataset.yarnId), parseFloat(e.target.value));
        }
    });
    if (elements.yarnsContainer) elements.yarnsContainer.addEventListener('click', e => {
        const deleteBtn = e.target.closest('.yarn-delete');
        if (deleteBtn) {
            deleteYarn(Number(deleteBtn.dataset.yarnId));
        }
    });

    // Delegação de eventos para os itens de material
    if (elements.materialsContainer) elements.materialsContainer.addEventListener('click', e => {
        const deleteBtn = e.target.closest('.yarn-delete[data-material-id]');
        if (deleteBtn) {
            deleteMaterial(Number(deleteBtn.dataset.materialId));
        }
    });
    
    // Delegação de eventos para o histórico
    if (elements.historyContainer) elements.historyContainer.addEventListener('click', e => {
        const target = e.target;
        if(target.closest('[data-action="load"]')) loadPieceFromHistory(target.closest('.history-item').dataset.id);
        if(target.closest('[data-action="delete"]')) deleteHistoryItem(target.closest('.history-item').dataset.id);
        if(target.closest('[data-action="pdf"]')) generatePDF(target.closest('.history-item').dataset.id);
    });

    // Delegação de eventos para as receitas
    if (elements.recipesGrid) elements.recipesGrid.addEventListener('click', e => {
        const target = e.target;
        if(target.closest('[data-action="load-materials"]')) loadRecipeMaterials(target.closest('.history-item').dataset.id);
    });

    // Listeners para salvar o estado do formulário
    if (elements.pieceName) elements.pieceName.addEventListener('input', saveFormState);
    if (elements.pieceType) elements.pieceType.addEventListener('change', saveFormState);
    if (elements.profitMarginInput) elements.profitMarginInput.addEventListener('change', () => { updateCalculations(); saveFormState(); });
    if (elements.indirectCostsInput) elements.indirectCostsInput.addEventListener('change', () => { updateCalculations(); saveFormState(); });
    if (elements.otherMaterialsCostInput) elements.otherMaterialsCostInput.addEventListener('change', e => {
        state.otherMaterialsCost = parseFloat(e.target.value) || 0;
        updateCalculations();
    });
    
    if (elements.savePieceBtn) elements.savePieceBtn.addEventListener('click', savePiece);
}

export function setupGeneralEventListeners() {    
    // Inicializa o formulário de múltiplos passos
    setupMultiStepForm();

    // Inicializa os listeners dos botões do cronômetro (Iniciar, Pausar, Resetar, Salvar Sessão)
    setupTimerEventListeners();

    // Adiciona sombra ao header no scroll
    if (elements.mainContent && elements.appHeader) {
        elements.mainContent.addEventListener('scroll', () => {
            if (elements.mainContent.scrollTop > 10) {
                elements.appHeader.classList.add('header-scrolled');
            } else {
                elements.appHeader.classList.remove('header-scrolled');
            }
        });
    }
}
