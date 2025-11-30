import { state, elements } from './state.js';
import { updateCalculations, calculatePricePerGramHelper, calculateSalaryHelper, updateWasteCost } from './calculations.js';
import { saveFormState, saveBaseSalary } from './storage.js';
import { deleteHistoryItem, loadPieceFromHistory, savePiece, saveRecipe, loadRecipeMaterials, generateCurrentPiecePDF, generateCurrentPieceCSV, addMaterial } from './pieceManager.js';

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

export function announceForScreenReaders(message) {
    const container = document.getElementById('sr-announcer');
    if (!container) return;
    container.textContent = '';
    setTimeout(() => { container.textContent = message; }, 100);
}

export function switchTab(tabName) {
    const newTab = document.getElementById(`${tabName}-tab`);
    const currentTab = document.querySelector('.tab-pane--active');
    if (newTab === currentTab) return;

    elements.navButtons.forEach(btn => btn.classList.toggle('nav-btn--active', btn.dataset.tab === tabName));

    if (currentTab) {
        currentTab.classList.add('is-exiting');
        currentTab.addEventListener('animationend', () => {
            currentTab.classList.remove('tab-pane--active', 'is-exiting');
        }, { once: true });
    }
    newTab.classList.add('tab-pane--active');

    if (elements.mainNav && elements.mainNav.classList.contains('open')) {
        elements.mainNav.classList.remove('open');
    }
}

export let isRecipeMode = false;

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
    state.newRecipeDraft = { name: '', description: '', yarns: [], otherMaterials: [] };
    elements.recipeNameInput.value = '';
    elements.recipeDescriptionInput.value = '';
    elements.recipeSteps.value = '';
    document.getElementById('recipeSalePrice').value = '';
    renderRecipeMaterials();
    openModal(elements.recipeModal);
}

export function openModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.add('active');
    const focusableElements = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length) focusableElements[0].focus();
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

export function addYarn() {
    const name = elements.yarnNameInput.value.trim();
    const pricePerGram = parseFloat(elements.yarnPricePerGramInput.value);
    const initialWeight = parseFloat(elements.yarnInitialWeightInput.value);
    
    if (!name || isNaN(pricePerGram) || isNaN(initialWeight) || initialWeight <= 0) {
        showToast('Preencha o nome, preço e o peso inicial do novelo.', 'error');
        return;
    }

    let finalWeight = parseFloat(elements.yarnFinalWeightInput.value);
    if (isNaN(finalWeight)) finalWeight = initialWeight;

    let usedWeight = initialWeight - finalWeight;
    if (usedWeight < 0) usedWeight = 0;

    const cost = usedWeight * pricePerGram;

    const newYarn = { 
        id: Date.now(), 
        name, 
        pricePerGram, 
        initialWeight,
        finalWeight,
        usedWeight,
        cost 
    };

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

export function updateYarnWeight(id, newFinalWeight) {
    const yarn = state.yarns.find(y => y.id === id);
    if (yarn) {
        if (newFinalWeight > yarn.initialWeight) {
            showToast(`Ops! O peso final não pode ser maior que o inicial (${yarn.initialWeight}g)`, 'error');
            return; 
        }
        yarn.finalWeight = newFinalWeight;
        yarn.usedWeight = yarn.initialWeight - yarn.finalWeight;
        if (yarn.usedWeight < 0) yarn.usedWeight = 0;
        yarn.cost = yarn.usedWeight * yarn.pricePerGram;
        renderYarns();
        updateCalculations();
        saveFormState();
    }
}

export function deleteYarn(id) {
    state.yarns = state.yarns.filter(yarn => yarn.id !== id);
    renderYarns();
    saveFormState();
}

export function deleteMaterial(id) {
    state.otherMaterials = state.otherMaterials.filter(material => material.id !== id);
    renderMaterials();
    updateCalculations();
}

export function renderMaterials() {
    const container = elements.materialsContainer;
    const subtotalDisplay = document.getElementById('materialsSubtotalDisplay');
    const subtotal = state.otherMaterials.reduce((sum, m) => sum + m.cost, 0);

    if (state.otherMaterials.length === 0) {
        container.innerHTML = `<div class="empty-state" style="text-align: center; padding: 20px; color: #aaa; border: 1px dashed #ddd; border-radius: 12px;"><i data-feather="scissors" style="width: 24px; height: 24px; opacity: 0.5;"></i><p style="margin: 5px 0 0; font-size: 0.9rem;">Nenhum material extra.</p></div>`;
    } else {
        container.innerHTML = state.otherMaterials.map(material => `
            <div class="material-card">
                <div class="material-card__info">
                    <span class="material-card__name">${material.name}</span>
                    <span class="material-card__details">${material.quantity}un. x R$ ${material.price.toFixed(2)}</span>
                </div>
                <div class="material-card__actions">
                    <span class="material-card__price">R$ ${material.cost.toFixed(2)}</span>
                    <button class="btn-delete-yarn material-delete" data-material-id="${material.id}" title="Remover material"><i data-feather="trash-2"></i></button>
                </div>
            </div>
        `).join('');
    }
    if (subtotalDisplay) subtotalDisplay.textContent = `R$ ${subtotal.toFixed(2)}`;
    feather.replace();
}

export function renderYarns() {
    const container = elements.yarnsContainer;
    if (!state.yarns || state.yarns.length === 0) {
        container.innerHTML = `<div class="empty-state" style="text-align: center; padding: 40px; color: #aaa;"><i data-feather="package" style="width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.5;"></i><p>Nenhum fio adicionado ainda.</p></div>`;
        feather.replace();
        return;
    }
    container.innerHTML = state.yarns.map(yarn => {
        const initialW = parseFloat(yarn.initialWeight) || 0;
        const usedW = parseFloat(yarn.usedWeight) || 0;
        const costVal = parseFloat(yarn.cost) || 0;
        const finalW = parseFloat(yarn.finalWeight) || 0;
        return `
        <div class="yarn-card">
            <div class="yarn-card__header">
                <div class="yarn-card__title-group">
                    <span class="yarn-card__name">${yarn.name}</span>
                    <span class="yarn-badge">Inicial: ${initialW}g</span>
                </div>
                <button class="btn-delete-yarn yarn-delete" data-yarn-id="${yarn.id}" title="Remover este fio"><i data-feather="trash-2"></i></button>
            </div>
            <div class="yarn-card__body">
                <div class="yarn-input-wrapper">
                    <label for="yarn-weight-${yarn.id}">Quanto sobrou? (g)</label>
                    <input type="number" id="yarn-weight-${yarn.id}" data-yarn-id="${yarn.id}" value="${finalW > 0 ? finalW : ''}" placeholder="0" min="0" max="${initialW}" step="0.1">
                </div>
                <div class="yarn-info-block"><span class="label">Peso Usado</span><span class="value">${usedW.toFixed(1)}g</span></div>
                <div class="yarn-info-block"><span class="label">Custo</span><span class="value highlight">R$ ${costVal.toFixed(2)}</span></div>
            </div>
        </div>`;
    }).join('');
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
            <div class="history-item__info">
                <h4 class="history-item__name">${item.name}</h4>
                <p class="history-item__type">${item.type}</p>
                <p class="history-item__date">Salvo em: ${new Date(item.date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="history-item__details">
                <div class="history-item__price"><span>Preço Final</span><strong>R$ ${item.finalPrice.toFixed(2)}</strong></div>
                <div class="history-item__actions">
                    <button class="btn btn--icon" data-action="load" title="Carregar"><i data-feather="upload-cloud"></i></button>
                    <button class="btn btn--icon" data-action="pdf" title="PDF"><i data-feather="file-text"></i></button>
                    <button class="btn btn--icon btn--icon-danger" data-action="delete" title="Excluir"><i data-feather="trash-2"></i></button>
                </div>
            </div>
        </div>`).join('');
    feather.replace();
}

export function renderRecipeMaterials() {
    const container = document.getElementById('recipe-materials-list');
    if (!container) return;
    const yarnsHtml = state.newRecipeDraft.yarns.map((y, i) => 
        `<div class="recipe-mini-card"><div class="mini-card-icon"><i data-feather="disc"></i></div><div class="mini-card-info"><span class="name">${y.name}</span></div><button class="btn-mini-delete" onclick="window.deleteRecipeItem('yarn', ${i})"><i data-feather="x"></i></button></div>`
    ).join('');
    const materialsHtml = state.newRecipeDraft.otherMaterials.map((m, i) => 
        `<div class="recipe-mini-card"><div class="mini-card-icon"><i data-feather="scissors"></i></div><div class="mini-card-info"><span class="name">${m.name}</span><span class="details">${m.quantity}un. (R$ ${m.price.toFixed(2)})</span></div><button class="btn-mini-delete" onclick="window.deleteRecipeItem('material', ${i})"><i data-feather="x"></i></button></div>`
    ).join('');

    container.innerHTML = (yarnsHtml || materialsHtml) 
        ? `<h5 class="recipe-section-title">Fios</h5>${yarnsHtml}<h5 class="recipe-section-title">Aviamentos</h5>${materialsHtml}` 
        : '<p style="text-align:center;color:#aaa;">Nenhum material adicionado.</p>';
    feather.replace();
}

window.deleteRecipeItem = function(type, index) {
    if (type === 'yarn') state.newRecipeDraft.yarns.splice(index, 1);
    else state.newRecipeDraft.otherMaterials.splice(index, 1);
    renderRecipeMaterials();
};

export function updateCostChart(yarnCost, materialsCost, laborCost, reworkCost) {
    const ctx = elements.costChartCanvas;
    if (!ctx) return;

    // Define os dados
    const newData = [yarnCost, materialsCost, laborCost, reworkCost];

    // Se o gráfico já existe, precisamos destruí-lo se quisermos mudar o TIPO ou OPÇÕES drasticamente.
    // Para garantir que o novo design (Doughnut) entre em vigor, vamos destruir o anterior se não for do tipo 'doughnut'.
    if (state.costChartInstance) {
        // Se já for doughnut, apenas atualiza os dados para animação suave
        if (state.costChartInstance.config.type === 'doughnut') {
            state.costChartInstance.data.datasets[0].data = newData;
            state.costChartInstance.update();
            return;
        } else {
            // Se for o antigo (pie), destrói para recriar com o novo visual
            state.costChartInstance.destroy();
        }
    }

    // Cria o Novo Gráfico Moderno
    state.costChartInstance = new Chart(ctx, {
        type: 'doughnut', // Mudamos para Rosca
        data: {
            labels: ['Fios', 'Outros Materiais', 'Mão de Obra', 'Retrabalho'],
            datasets: [{
                data: newData,
                // Novas cores harmonizadas com o tema Roxo/Rosa
                backgroundColor: [
                    '#FFC857', // Fios (Amarelo Ouro - Mantido para contraste)
                    '#4BC0C0', // Materiais (Turquesa Suave)
                    '#F953C6', // Mão de Obra (Rosa Vibrante - Cor da Marca)
                    '#FF6384'  // Retrabalho (Vermelho Suave - Alerta)
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 15, // Aumenta o destaque ao passar o mouse
                borderRadius: 20, // Borda arredondada nas pontas (Efeito Moderno)
                spacing: 5 // Espaço entre as fatias
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Permite ajustar melhor ao container
            cutout: '75%', // Deixa a rosca mais fina e elegante
            animation: {
                animateScale: true,
                animateRotate: true
            },
            layout: {
                padding: 20
            },
            plugins: {
                legend: {
                    position: 'bottom', // Legenda em baixo fica mais organizado
                    labels: {
                        usePointStyle: true, // Usa bolinhas em vez de quadrados
                        padding: 20,
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 12
                        },
                        color: '#4A235A' // Cor do texto escura (tema)
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(74, 35, 90, 0.9)', // Fundo Roxo Escuro
                    titleFont: { family: "'Poppins', sans-serif", size: 13 },
                    bodyFont: { family: "'IBM Plex Mono', monospace", size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        // Formata o valor para Dinheiro (R$) no tooltip
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}
export function showMainApp() {
    if (elements.heroPage && elements.mainApp) {
        elements.heroPage.classList.add('is-hidden');
        elements.mainApp.classList.remove('is-hidden');
    }
}

export function renderRecipes() {
    if (!elements.recipesGrid) return;
    elements.recipesGrid.innerHTML = state.recipes.length === 0
        ? `<div class="empty-state"><p>Nenhuma receita salva ainda.</p></div>`
        : state.recipes.map(recipe => `
            <div class="history-item">
                <div class="history-item__main">
                    <div class="history-item__info"><h4 class="history-item__name">${recipe.name}</h4><p class="history-item__type">${recipe.description || 'Sem descrição.'}</p></div>
                    <div class="history-item__price"><span>Preço</span><strong>R$ ${(recipe.finalPrice||0).toFixed(2)}</strong></div>
                </div>
                <div class="history-item__actions"><button class="btn btn--secondary btn--small" onclick="window.loadRecipeMaterials('${recipe.id}')">Usar Receita</button></div>
            </div>`).join('');
}
window.loadRecipeMaterials = (id) => loadRecipeMaterials(id);

function setupMultiStepForm() {
    const steps = document.querySelectorAll('.form-step');
    const wizardSteps = document.querySelectorAll('.wizard-steps__item');
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    const calculateBtn = document.getElementById('calculatePriceBtn');
    let currentStep = 0;

    function updateStepView(previousStep) {
        const isAdvancing = previousStep < currentStep;
        if (previousStep !== currentStep && steps[previousStep]) {
            const outClass = isAdvancing ? 'slide-out-left' : 'slide-out-right';
            steps[previousStep].classList.add(outClass);
            steps[previousStep].addEventListener('animationend', () => {
                steps[previousStep].classList.remove('active-step', outClass);
            }, { once: true });
        }
        const inClass = isAdvancing ? 'slide-in-right' : 'slide-in-left';
        steps[currentStep].classList.add('active-step', inClass);
        steps[currentStep].addEventListener('animationend', () => {
            steps[currentStep].classList.remove(inClass);
        }, { once: true });

        wizardSteps.forEach((step, index) => {
            step.classList.remove('wizard-steps__item--active', 'wizard-steps__item--completed');
            if (index < currentStep) step.classList.add('wizard-steps__item--completed');
            else if (index === currentStep) step.classList.add('wizard-steps__item--active');
        });

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

    if (steps.length > 0) updateStepView(currentStep);
}

// ADICIONADO: Função que estava faltando
function handleNavClick(event) {
    const tab = event.currentTarget.dataset.tab;
    switchTab(tab);
}

export function setupNavEventListeners() {
    elements.navButtons.forEach(btn => btn.addEventListener('click', handleNavClick));
    if (elements.menuToggle) elements.menuToggle.addEventListener('click', () => elements.mainNav.classList.toggle('open'));
}

export function setupModalEventListeners() {
    // 1. Listener Genérico para fechar modais (ESC ou Clicar fora)
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) activeModal.classList.remove('active');
        }
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal || e.target.closest('.modal__close') || e.target.closest('button[id^="cancel"]') || e.target.classList.contains('modal-close-btn')) {
                modal.classList.remove('active');
            }
        });
    });

    // 2. Botões Principais (Fio e Material)
    if (elements.addYarnBtn) elements.addYarnBtn.addEventListener('click', () => openYarnModal(false));
    if (elements.addMaterialBtn) elements.addMaterialBtn.addEventListener('click', () => openMaterialModal(false));

    // 3. Lógica do Custo de Desperdício
    const addWasteCostBtn = document.getElementById('addWasteCostBtn');
    const wasteModal = document.getElementById('wasteModal');
    const wasteInput = document.getElementById('wasteCostInput');
    const confirmWasteBtn = document.getElementById('confirmWasteBtn');

    if (addWasteCostBtn && wasteModal) {
        addWasteCostBtn.addEventListener('click', () => {
            wasteInput.value = state.wasteCost > 0 ? state.wasteCost.toFixed(2) : '';
            openModal(wasteModal);
            setTimeout(() => wasteInput.focus(), 100);
        });
    }

    if (confirmWasteBtn) {
        confirmWasteBtn.addEventListener('click', () => {
            const amount = parseFloat(wasteInput.value);
            if (!isNaN(amount) && amount >= 0) {
                updateWasteCost(amount); 
                wasteModal.classList.remove('active');
            } else {
                showToast('Por favor, insira um valor válido.', 'error');
            }
        });
    }

    // --- NOVA LÓGICA: EDITAR TEMPO TOTAL ---
    const editTimeBtn = document.getElementById('editTimeBtn');
    const editTimeModal = document.getElementById('editTimeModal');
    const confirmEditTimeBtn = document.getElementById('confirmEditTimeBtn');

    if (editTimeBtn && editTimeModal) {
        editTimeBtn.addEventListener('click', () => {
            // 1. Calcula o tempo total atual em segundos
            const totalSeconds = state.timer.accumulatedSeconds + state.timer.currentSessionSeconds;
            
            // 2. Converte para horas e minutos para preencher os inputs
            const currentHours = Math.floor(totalSeconds / 3600);
            const currentMinutes = Math.floor((totalSeconds % 3600) / 60);

            // 3. Preenche os campos (usando os elementos definidos no state.js ou buscando aqui)
            if(elements.editTimeHoursInput) elements.editTimeHoursInput.value = currentHours;
            if(elements.editTimeMinutesInput) elements.editTimeMinutesInput.value = currentMinutes;

            openModal(editTimeModal);
        });
    }

    if (confirmEditTimeBtn) {
        confirmEditTimeBtn.addEventListener('click', () => {
            const h = parseInt(elements.editTimeHoursInput.value) || 0;
            const m = parseInt(elements.editTimeMinutesInput.value) || 0;

            // Converte o novo tempo desejado para segundos totais
            const newTotalSeconds = (h * 3600) + (m * 60);

            // Ajusta o acumulado para que o visual (Acumulado + Sessão) bata com o digitado
            state.timer.accumulatedSeconds = newTotalSeconds - state.timer.currentSessionSeconds;
            
            // Segurança para não ficar negativo
            if (state.timer.accumulatedSeconds < 0) state.timer.accumulatedSeconds = 0;

            updateCalculations();
            editTimeModal.classList.remove('active');
            showToast('Tempo total corrigido!', 'success');
        });
    }
    // ----------------------------------------

    // 4. Receitas
    if (elements.addRecipeBtn) elements.addRecipeBtn.addEventListener('click', openRecipeModal);
    
    const confirmRecipeBtn = document.getElementById('confirmRecipeBtn');
    if (confirmRecipeBtn) confirmRecipeBtn.addEventListener('click', saveRecipe);

    // 5. Salvar Peça / PDF / CSV
    if (elements.savePieceBtn) elements.savePieceBtn.addEventListener('click', savePiece);

    const saveAsPdfBtn = document.getElementById('saveAsPdfBtn');
    if (saveAsPdfBtn) saveAsPdfBtn.addEventListener('click', generateCurrentPiecePDF);
    
    const saveAsCsvBtn = document.getElementById('saveAsCsvBtn');
    if (saveAsCsvBtn) saveAsCsvBtn.addEventListener('click', generateCurrentPieceCSV);

    // 6. Calculadoras Auxiliares
    if (elements.yarnHelperPriceInput) elements.yarnHelperPriceInput.addEventListener('input', calculatePricePerGramHelper);
    if (elements.yarnHelperWeightInput) elements.yarnHelperWeightInput.addEventListener('input', calculatePricePerGramHelper);

    // 7. Adicionar dentro da Receita
    const addYarnToRecipeBtn = document.getElementById('addYarnToRecipeBtn');
    if (addYarnToRecipeBtn) addYarnToRecipeBtn.addEventListener('click', () => openYarnModal(true));
    
    const addMaterialToRecipeBtn = document.getElementById('addMaterialToRecipeBtn');
    if (addMaterialToRecipeBtn) addMaterialToRecipeBtn.addEventListener('click', () => openMaterialModal(true));

   // 8. Salário
    if (elements.openSalaryHelperBtn) {
        elements.openSalaryHelperBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openSalaryHelperModal();
        });
    }

    // --- CORREÇÃO: Adiciona os ouvintes para calcular enquanto digita ---
    if (elements.desiredSalaryInput) elements.desiredSalaryInput.addEventListener('input', calculateSalaryHelper);
    if (elements.hoursPerDayInput) elements.hoursPerDayInput.addEventListener('input', calculateSalaryHelper);
    if (elements.daysPerWeekInput) elements.daysPerWeekInput.addEventListener('input', calculateSalaryHelper);
    // -------------------------------------------------------------------

    if (elements.applySalaryBtn) elements.applySalaryBtn.addEventListener('click', () => {
        if (state.calculatedHourlyRate) {
            saveBaseSalary(state.calculatedHourlyRate);
            elements.salaryHelperModal.classList.remove('active');
        }
    });
    
    // 9. Botões de Confirmação Finais
    const confirmYarnBtn = document.getElementById('confirmYarnBtn');
    if (confirmYarnBtn) confirmYarnBtn.addEventListener('click', addYarn);

    const confirmMaterialBtn = document.getElementById('confirmMaterialBtn');
    if (confirmMaterialBtn) confirmMaterialBtn.addEventListener('click', addMaterial);
}

export function setupGeneralEventListeners() {    
    setupMultiStepForm();
    if (elements.circularTimer) {
        elements.circularTimer.setAttribute('role', 'timer');
        elements.circularTimer.setAttribute('aria-live', 'polite');
    }
    if (elements.mainContent && elements.appHeader) {
        elements.mainContent.addEventListener('scroll', () => {
            if (elements.mainContent.scrollTop > 10) elements.appHeader.classList.add('header-scrolled');
            else elements.appHeader.classList.remove('header-scrolled');
        });
    }
}