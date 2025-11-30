import { state, elements } from './state.js';
import { updateCostChart } from './ui.js';

/**
 * Adiciona uma animação de "flash" a um elemento para indicar que ele foi atualizado.
 * @param {HTMLElement} element O elemento a ser animado.
 */
function flashElement(element) {
    if (!element) return;
    element.classList.add('flash-update');
    setTimeout(() => {
        element.classList.remove('flash-update');
    }, 500);
}

/**
 * Calcula o preço por grama com base nos inputs do modal auxiliar.
 */
export function calculatePricePerGramHelper() {
    const totalPrice = parseFloat(elements.yarnHelperPriceInput.value);
    const totalWeight = parseFloat(elements.yarnHelperWeightInput.value);

    if (totalPrice > 0 && totalWeight > 0) {
        const pricePerGram = totalPrice / totalWeight;
        elements.yarnPricePerGramInput.value = pricePerGram.toFixed(4);
        if (elements.yarnHelperResult) {
            elements.yarnHelperResult.textContent = `R$ ${pricePerGram.toFixed(4)} por grama`;
        }
        flashElement(elements.yarnPricePerGramInput);
    } else if (elements.yarnHelperResult) {
        elements.yarnHelperResult.textContent = 'R$ 0.0000 por grama';
    }
}

/**
 * Calcula o salário por hora com base nas metas mensais do usuário.
 */
export function calculateSalaryHelper() {
    const desiredSalary = parseFloat(elements.desiredSalaryInput.value) || 0;
    const hoursPerDay = parseFloat(elements.hoursPerDayInput.value) || 0;
    const daysPerWeek = parseFloat(elements.daysPerWeekInput.value) || 0;

    if (desiredSalary > 0 && hoursPerDay > 0 && daysPerWeek > 0) {
        const totalHoursPerMonth = (hoursPerDay * daysPerWeek) * 4.33; // 4.33 semanas em média por mês
        const hourlyRate = desiredSalary / totalHoursPerMonth;

        // Armazena o valor calculado no estado para ser usado pelo botão "Aplicar"
        state.calculatedHourlyRate = hourlyRate;

        elements.salaryResultDisplay.innerHTML = `Seu salário/hora sugerido é: <strong>R$ ${hourlyRate.toFixed(2)}</strong>`;
        elements.salaryResultDisplay.style.display = 'block';
        elements.applySalaryBtn.disabled = false;
        flashElement(elements.salaryResultDisplay);
    } else {
        elements.salaryResultDisplay.style.display = 'none';
        elements.applySalaryBtn.disabled = true;
        state.calculatedHourlyRate = null;
    }
}

/**
 * Atualiza todos os cálculos de custo e preço final na interface.
 */
export function updateCalculations() {
    // Custo de fios
    const yarnCost = state.yarns.reduce((sum, yarn) => sum + yarn.cost, 0);
    elements.yarnCostDisplay.textContent = `R$ ${yarnCost.toFixed(2)}`;

    // Custo de outros materiais
    const otherMaterialsCost = state.otherMaterials.reduce((sum, material) => sum + material.cost, 0) + state.wasteCost;
    elements.materialsCostDisplay.textContent = `R$ ${otherMaterialsCost.toFixed(2)}`;
    if (document.getElementById('wasteCostDisplay')) {
        document.getElementById('wasteCostDisplay').textContent = `R$ ${state.wasteCost.toFixed(2)}`;
    }

    // Custo de mão de obra
    const salaryPerHour = state.customSalary || state.baseSalary;
    const productiveHours = (state.timer.accumulatedSeconds + state.timer.currentSessionSeconds) / 3600;
    const reworkHours = state.timer.reworkSeconds / 3600;
    const laborCost = productiveHours * salaryPerHour;
    const reworkCost = reworkHours * salaryPerHour;

    elements.laborRateDisplay.textContent = `R$ ${salaryPerHour.toFixed(2)}`;
    elements.laborCostDisplay.textContent = `R$ ${laborCost.toFixed(2)}`;
    elements.laborCostSummary.textContent = `R$ ${laborCost.toFixed(2)}`;
    if (document.getElementById('reworkCostDisplay')) {
        document.getElementById('reworkCostDisplay').textContent = `R$ ${reworkCost.toFixed(2)}`;
    }

    // Custo total
    const totalCost = yarnCost + otherMaterialsCost + laborCost + reworkCost;
    elements.totalCostDisplay.textContent = `R$ ${totalCost.toFixed(2)}`;

    // Preço final com custos indiretos e margem de lucro
    const indirectCostsPercent = parseFloat(elements.indirectCostsInput.value) || 0;
    const profitMargin = parseFloat(elements.profitMarginInput.value) || 0;

    const costWithIndirects = totalCost * (1 + indirectCostsPercent / 100);
    const finalPrice = costWithIndirects * (1 + profitMargin / 100);

    elements.finalPriceDisplay.textContent = `R$ ${finalPrice.toFixed(2)}`;

    // Efeito de flash nos elementos atualizados
    flashElement(elements.yarnCostDisplay);
    flashElement(elements.materialsCostDisplay);
    flashElement(elements.laborCostSummary);
    flashElement(elements.totalCostDisplay);
    flashElement(elements.finalPriceDisplay);

    // Atualiza o gráfico de pizza com os novos custos
    updateCostChart(yarnCost, otherMaterialsCost, laborCost, reworkCost);
}
