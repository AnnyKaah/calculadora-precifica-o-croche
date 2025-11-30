import { state, elements } from './state.js';
import { showToast, switchTab, renderYarns, renderHistory, renderMaterials, renderRecipes, isRecipeMode, renderRecipeMaterials, openModal } from './ui.js';
import { resetTimer, pauseTimer, updateTimerDisplay } from './timer.js';
import { updateCalculations } from './calculations.js';
import { saveFormState } from './storage.js';

export function savePiece() {
    const name = elements.pieceName.value.trim();
    const type = elements.pieceType.value;
    if (!name || !type) {
        showToast('Preencha o nome e o tipo da peça.', 'error');
        return;
    }
    const saveOptionsModal = document.getElementById('saveOptionsModal');
    if (saveOptionsModal) openModal(saveOptionsModal);
}

export function saveRecipe() {
    const name = elements.recipeNameInput.value.trim();
    const description = elements.recipeDescriptionInput.value.trim();
    const steps = elements.recipeSteps.value.trim();
    const finalPrice = parseFloat(document.getElementById('recipeSalePrice').value) || 0;

    if (!name) {
        showToast('O nome da receita é obrigatório.', 'error');
        return;
    }

    const newRecipe = {
        id: Date.now().toString(),
        name,
        description,
        steps,
        finalPrice,
        yarns: [...state.newRecipeDraft.yarns],
        otherMaterials: [...state.newRecipeDraft.otherMaterials],
        createdAt: new Date().toISOString()
    };

    state.recipes.push(newRecipe);
    localStorage.setItem('amigurumiPreco_recipes', JSON.stringify(state.recipes));
    
    renderRecipes();
    showToast('Receita salva com sucesso!', 'success');
    elements.recipeModal.classList.remove('active');
}

export function addMaterial() {
    if(elements.materialNameInput) elements.materialNameInput.classList.remove('input-error');
    if(elements.materialQuantityInput) elements.materialQuantityInput.classList.remove('input-error');
    if(elements.materialPriceInput) elements.materialPriceInput.classList.remove('input-error');

    const name = elements.materialNameInput.value.trim();
    const quantity = parseInt(elements.materialQuantityInput.value) || 1;
    const price = parseFloat(elements.materialPriceInput.value) || 0;

    if (!name) {
        showToast('O nome do material é obrigatório.', 'error');
        return;
    }

    const cost = quantity * price;
    const newMaterial = { id: Date.now(), name, quantity, price, cost };

    if (isRecipeMode) {
        state.newRecipeDraft.otherMaterials.push(newMaterial);
        renderRecipeMaterials();
        showToast('Aviamento adicionado à receita!', 'success');
    } else {
        state.otherMaterials.push(newMaterial);
        renderMaterials();
        updateCalculations();
        saveFormState();
        showToast('Material adicionado com sucesso!', 'success');
    }
    elements.materialModal.classList.remove('active');
}

export function loadRecipeMaterials(id) {
    const recipe = state.recipes.find(r => r.id === id);
    if (!recipe) {
        showToast('Erro: Receita não encontrada.', 'error');
        return;
    }
    if (state.timer.isRunning) pauseTimer();

    elements.pieceName.value = recipe.name;
    elements.pieceType.value = ''; 
    elements.indirectCostsInput.value = 15;
    elements.profitMarginInput.value = 30;

    state.yarns = JSON.parse(JSON.stringify(recipe.yarns || []));
    state.otherMaterials = JSON.parse(JSON.stringify(recipe.otherMaterials || []));
    state.timer.accumulatedSeconds = 0;
    state.timer.currentSessionSeconds = 0;

    renderYarns();
    renderMaterials();
    updateTimerDisplay();
    updateCalculations();
    switchTab('calculator');
    showToast(`Receita "${recipe.name}" carregada!`, 'success');
}

export function deleteHistoryItem(id) {
    state.history = state.history.filter(item => item.id !== id);
    renderHistory();
    localStorage.setItem('amigurumiPreco_history', JSON.stringify(state.history));
    showToast('Peça excluída.', 'info');
}

export function loadPieceFromHistory(id) {
    const piece = state.history.find(item => item.id === id);
    if (!piece) return;
    
    elements.pieceName.value = piece.name;
    elements.pieceType.value = piece.type;
    state.yarns = piece.yarns || [];
    state.otherMaterials = piece.otherMaterials || [];
    state.timer.accumulatedSeconds = piece.time || 0;
    
    renderYarns();
    renderMaterials();
    updateCalculations();
    switchTab('calculator');
}

function getCurrentPieceData() {
    const name = elements.pieceName.value.trim() || "Sem Nome";
    const type = elements.pieceType.value || "Outro";
    
    const yarnCost = state.yarns.reduce((sum, yarn) => sum + yarn.cost, 0);
    const otherMaterialsCost = state.otherMaterials.reduce((sum, m) => sum + m.cost, 0);
    const wasteCost = state.wasteCost || 0;
    
    const salary = state.customSalary || state.baseSalary || 0;
    const totalSeconds = state.timer.accumulatedSeconds + state.timer.currentSessionSeconds;
    const laborCost = (totalSeconds / 3600) * salary;
    const reworkCost = (state.timer.reworkSeconds / 3600) * salary;

    const totalCost = yarnCost + otherMaterialsCost + wasteCost + laborCost + reworkCost;
    
    const indirect = parseFloat(elements.indirectCostsInput.value) || 0;
    const margin = parseFloat(elements.profitMarginInput.value) || 0;
    
    const costWithIndirect = totalCost * (1 + (indirect/100));
    const finalPrice = costWithIndirect * (1 + (margin/100));

    return {
        name, type, yarnCost, otherMaterialsCost, wasteCost, laborCost, reworkCost,
        totalCost, finalPrice, indirectCostsPercent: indirect, profitMargin: margin,
        time: totalSeconds, date: new Date().toISOString()
    };
}

export function generateCurrentPiecePDF() {
    const piece = getCurrentPieceData();
    const hours = Math.floor(piece.time / 3600);
    const minutes = Math.floor((piece.time % 3600) / 60);
    
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; color: #333;">
            <h1 style="color: #8E2DE2;">${piece.name}</h1>
            <p><strong>Tipo:</strong> ${piece.type}</p>
            <hr />
            <h3>Custos</h3>
            <p>Fios: R$ ${piece.yarnCost.toFixed(2)}</p>
            <p>Materiais: R$ ${piece.otherMaterialsCost.toFixed(2)}</p>
            <p>Mão de Obra (${hours}h ${minutes}m): R$ ${piece.laborCost.toFixed(2)}</p>
            <h2 style="color: #4C2A88; margin-top: 20px;">Preço Final: R$ ${piece.finalPrice.toFixed(2)}</h2>
        </div>
    `;
    
    html2pdf().from(element).save(`precificacao_${piece.name}.pdf`);
    document.getElementById('saveOptionsModal').classList.remove('active');
}

export function generateCurrentPieceCSV() {
    const p = getCurrentPieceData();
    const csv = [
        ["Nome", "Tipo", "Custo Fios", "Custo Materiais", "Mão de Obra", "Preço Final"],
        [p.name, p.type, p.yarnCost, p.otherMaterialsCost, p.laborCost, p.finalPrice]
    ].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    link.download = "precificacao.csv";
    link.click();
    document.getElementById('saveOptionsModal').classList.remove('active');
}