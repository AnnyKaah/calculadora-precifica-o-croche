import { auth, db } from './firebase.js';
import { state, elements } from './state.js';
import { showToast, switchTab, renderYarns, renderHistory, renderMaterials, renderRecipes, addYarn } from './ui.js';
import { resetTimer, pauseTimer, updateTimerDisplay } from './timer.js';
import { updateCalculations } from './calculations.js';
import { clearFormState } from './storage.js';

export function savePiece() {
    const name = elements.pieceName.value.trim();
    const type = elements.pieceType.value;
    if (!name || !type) {
        showToast('Preencha o nome e o tipo da peça.', 'error');
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        showToast("Você precisa estar logado para salvar uma peça.", 'info');
        return;
    }

    if (state.timer.isRunning) pauseTimer(); // Garante que o timer pare antes de salvar

    const yarnCost = state.yarns.reduce((sum, yarn) => sum + yarn.cost, 0);
    const otherMaterialsCost = state.otherMaterials.reduce((sum, material) => sum + material.cost, 0);
    const totalSeconds = state.timer.accumulatedSeconds + state.timer.currentSessionSeconds;
    const laborCost = (totalSeconds / 3600) * (state.customSalary || state.baseSalary);
    const totalCost = yarnCost + otherMaterialsCost + laborCost;
    const indirectCostsPercent = parseFloat(elements.indirectCostsInput.value) || 0;
    const profitMargin = parseFloat(elements.profitMarginInput.value) || 0;
    const finalPrice = totalCost * (1 + indirectCostsPercent / 100) * (1 + profitMargin / 100);

    const piece = {
        name, type, yarnCost, laborCost, finalPrice, 
        otherMaterialsCost,
        totalCost,
        indirectCostsPercent, 
        profitMargin,
        time: totalSeconds,
        yarns: [...state.yarns],
        otherMaterials: [...state.otherMaterials], // Salva a lista de materiais
        date: new Date().toISOString(), // Usar ISO para ordenação mais fácil
        userId: currentUser.uid
    };

    db.collection('pieces').add(piece).then(docRef => {
        showToast('✨ Peça salva com sucesso na nuvem!', 'success');
        piece.id = docRef.id; // Adiciona o ID do Firestore ao objeto local
        state.history.push(piece);
        renderHistory();
        
        // Resetar formulário
        elements.pieceName.value = '';
        elements.pieceType.value = '';
        state.yarns = []; 
        state.otherMaterials = [];
        resetTimer();
        renderMaterials();
        renderYarns();
        clearFormState();
        updateCalculations();
    });
}

/**
 * Salva a receita atual (lista de materiais) no Firestore.
 */
export function saveRecipe() {
    const name = elements.recipeNameInput.value.trim();
    const description = elements.recipeDescriptionInput.value.trim();
    const steps = elements.recipeSteps.value.trim();
    const finalPrice = parseFloat(document.getElementById('recipeSalePrice').value) || 0;

    if (!name) {
        showToast('O nome da receita é obrigatório.', 'error');
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        showToast("Você precisa estar logado para salvar uma receita.", 'info');
        return;
    }

    const recipe = {
        name,
        description, 
        steps,
        finalPrice,
        // Pega os materiais do rascunho, não do estado principal
        yarns: [...state.newRecipeDraft.yarns],
        otherMaterials: [...state.newRecipeDraft.otherMaterials],
        date: new Date().toISOString(),
        userId: currentUser.uid,
    };

    db.collection('recipes').add(recipe).then(docRef => {
        showToast('Receita salva com sucesso!', 'success');
        elements.recipeModal.classList.remove('active');
        state.recipes.push({ id: docRef.id, ...recipe }); // Adiciona a nova receita ao estado local
        renderRecipes(); // Atualiza a interface para mostrar a nova receita
    }).catch(error => showToast(`Erro ao salvar receita: ${error.message}`, 'error'));
}

/**
 * Carrega os materiais de uma receita salva para a calculadora.
 * @param {string} id O ID da receita a ser carregada.
 */
export function loadRecipeMaterials(id) {
    const recipe = state.recipes.find(r => r.id === id);
    if (!recipe) {
        showToast('Erro: Receita não encontrada.', 'error');
        return;
    }

    // Pausa o timer se estiver rodando
    if (state.timer.isRunning) pauseTimer();

    // Carrega todos os dados da receita para o estado da calculadora
    elements.pieceName.value = recipe.name;
    elements.pieceType.value = recipe.type || ''; // Assume que pode não ter tipo
    // Não carregamos a descrição ou passo-a-passo aqui, apenas os dados de cálculo
    elements.indirectCostsInput.value = recipe.indirectCostsPercent || 15;
    elements.profitMarginInput.value = recipe.profitMargin || 30;

    state.yarns = [...(recipe.yarns || [])];
    state.otherMaterials = [...(recipe.otherMaterials || [])];
    state.timer.accumulatedSeconds = recipe.time || 0;
    state.timer.currentSessionSeconds = 0;

    renderYarns();
    renderMaterials();
    updateTimerDisplay();
    updateCalculations();
    switchTab('calculator'); // Leva o usuário para a aba da calculadora
    showToast(`Materiais da receita "${recipe.name}" carregados!`, 'success');
}

export function loadPieceFromHistory(id) {
    const piece = state.history.find(item => item.id === id);
    if (!piece) {
        showToast('Erro: Peça não encontrada no histórico.', 'error');
        return;
    }
    if (state.timer.isRunning) pauseTimer();

    elements.pieceName.value = piece.name;
    elements.pieceType.value = piece.type;
    elements.indirectCostsInput.value = piece.indirectCostsPercent;
    elements.profitMarginInput.value = piece.profitMargin;
    elements.customSalaryInput.value = '';

    state.yarns = [...piece.yarns];
    state.otherMaterials = piece.otherMaterials || []; // Carrega a lista de materiais
    state.timer.accumulatedSeconds = piece.time;
    state.customSalary = null;

    renderMaterials();
    renderYarns();
    updateTimerDisplay();
    updateCalculations();
    switchTab('calculator');
}

export function deleteHistoryItem(id) {
    const itemToDelete = state.history.find(item => item.id === id);
    if (!itemToDelete) return;

    if (confirm(`Tem certeza que deseja deletar a peça "${itemToDelete.name}"?`)) {
        db.collection('pieces').doc(id).delete().then(() => {
            state.history = state.history.filter(item => item.id !== id);
            renderHistory();
            showToast('Peça deletada com sucesso.', 'info');
        }).catch(error => showToast(`Erro ao deletar: ${error.message}`, 'error'));
    }
}

export function loadDataFromFirestore(userId) {
    db.collection('pieces').where('userId', '==', userId).get().then(querySnapshot => {
        state.history = [];
        querySnapshot.forEach(doc => {
            state.history.push({ id: doc.id, ...doc.data() });
        });
        renderHistory();
    });
    // Você pode adicionar o carregamento de receitas aqui também
}

export function generatePDF(id) {
    const piece = state.history.find(item => item.id === id);
    if (!piece) return;

    const hours = Math.floor(piece.time / 3600);
    const minutes = Math.floor((piece.time % 3600) / 60);
    const dateFormatted = new Date(piece.date).toLocaleDateString('pt-BR');

    const pdfContent = `...`; // O HTML do seu PDF aqui
    // ... (código da geração de PDF permanece o mesmo)
    html2pdf().from(pdfContent).set({ /* options */ }).save();
}
