import { auth, db } from './firebase.js';
import { state, elements } from './state.js';
import { showToast } from './ui.js';

let timerInterval = null;
let totalSeconds = 0;

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function updateTimerDisplay() {
    if (!elements.timerDisplay) return;
    elements.timerDisplay.textContent = formatTime(totalSeconds);
    const circumference = 597; // 2 * PI * 95
    const progress = (totalSeconds % 60) / 60;
    if (elements.timerProgress) {
        elements.timerProgress.style.strokeDashoffset = circumference * (1 - progress);
    }
}

function startTimer() {
    if (timerInterval) return; // Já está rodando
    elements.timerContainer.classList.add('timer-running');
    elements.startTimerBtn.style.display = 'none';
    elements.pauseTimerBtn.style.display = 'inline-flex';

    timerInterval = setInterval(() => {
        totalSeconds++;
        updateTimerDisplay();
    }, 1000);
    updateTimerButtonsState();
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    elements.timerContainer.classList.remove('timer-running');
    elements.startTimerBtn.style.display = 'inline-flex';
    elements.pauseTimerBtn.style.display = 'none';
    updateTimerButtonsState();
}

function stopTimer() {
    pauseTimer();
    totalSeconds = 0;
    updateTimerDisplay();
    updateTimerButtonsState();
}

async function saveSession() {
    if (totalSeconds === 0) {
        showToast('Não é possível salvar uma sessão de tempo zerada.', 'info');
        return;
    }
    const sessionName = elements.sessionNameInput.value.trim() || `Sessão de ${new Date().toLocaleDateString()}`;
    const user = auth.currentUser;

    const newSession = {
        name: sessionName,
        seconds: totalSeconds,
        createdAt: new Date().toISOString(),
        userId: user ? user.uid : 'anonymous'
    };

    if (user) {
        try {
            const docRef = await db.collection('timeSessions').add(newSession);
            newSession.id = docRef.id; // Adiciona o ID do documento ao objeto
            state.timeSessions.push(newSession);
            showToast(`Sessão "${sessionName}" salva com sucesso!`, 'success');
        } catch (error) {
            showToast(`Erro ao salvar sessão: ${error.message}`, 'error');
            return; // Interrompe a execução se houver erro no salvamento
        }
    } else {
        // Lógica para usuário não logado (salva apenas no estado local)
        newSession.id = `local_${Date.now()}`;
        state.timeSessions.push(newSession);
        showToast('Sessão salva localmente. Faça login para salvar na nuvem.', 'info');
    }

    stopTimer(); // Zera o cronômetro após salvar
    elements.sessionNameInput.value = ''; // Limpa o input
    renderTimeHistory();
    updateTotalProductionTime();
    renderTimeChart(); // Atualiza o gráfico
}

export async function loadTimeSessions(userId) {
    if (!userId) {
        state.timeSessions = [];
        renderTimeHistory();
        updateTotalProductionTime();
        return;
    }
    try {
        const snapshot = await db.collection('timeSessions').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
        state.timeSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTimeHistory();
        updateTotalProductionTime();
        renderTimeChart(); // Renderiza o gráfico com os dados carregados
    } catch (error) {
        showToast(`Erro ao carregar histórico de tempo: ${error.message}`, 'error');
    }
}

async function duplicateSession(sessionId) {
    const user = auth.currentUser;
    const originalSession = state.timeSessions.find(s => s.id === sessionId);

    if (!originalSession) {
        showToast('Sessão original não encontrada.', 'error');
        return;
    }

    const newSession = {
        name: `Cópia de ${originalSession.name}`,
        seconds: originalSession.seconds,
        createdAt: new Date().toISOString(),
        userId: user ? user.uid : 'anonymous'
    };

    if (user && !sessionId.startsWith('local_')) {
        try {
            const docRef = await db.collection('timeSessions').add(newSession);
            newSession.id = docRef.id;
        } catch (error) {
            showToast(`Erro ao duplicar sessão: ${error.message}`, 'error');
            return;
        }
    } else {
        newSession.id = `local_${Date.now()}`;
    }

    state.timeSessions.unshift(newSession); // Adiciona a nova sessão no topo da lista
    renderTimeHistory();
    updateTotalProductionTime();
    renderTimeChart(); // Atualiza o gráfico
    showToast('Sessão duplicada com sucesso!', 'success');
}

async function updateSessionName(sessionId, newName) {
    const user = auth.currentUser;
    const session = state.timeSessions.find(s => s.id === sessionId);

    if (!session || !newName) return;

    if (user && !sessionId.startsWith('local_')) {
        try {
            await db.collection('timeSessions').doc(sessionId).update({ name: newName });
            showToast('Nome da sessão atualizado!', 'success');
        } catch (error) {
            showToast(`Erro ao atualizar: ${error.message}`, 'error');
            return; // Não continua se a atualização falhar
        }
    }

    // Atualiza o estado local
    session.name = newName;

    // Re-renderiza o histórico para sair do modo de edição
    renderTimeHistory();
}

async function deleteSession(sessionId) {
    const sessionToDelete = state.timeSessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;

    if (!confirm(`Tem certeza que deseja excluir a sessão "${sessionToDelete.name}"?`)) {
        return;
    }

    const user = auth.currentUser;
    if (user && !sessionId.startsWith('local_')) {
        try {
            await db.collection('timeSessions').doc(sessionId).delete();
        } catch (error) {
            showToast(`Erro ao excluir sessão: ${error.message}`, 'error');
            return;
        }
    }
    state.timeSessions = state.timeSessions.filter(s => s.id !== sessionId);
    renderTimeHistory();
    updateTotalProductionTime();
    renderTimeChart(); // Atualiza o gráfico
    showToast('Sessão excluída com sucesso.', 'info');
}

export function renderTimeHistory() {
    const { timeHistoryList, timeHistoryPlaceholder } = elements;
    if (!timeHistoryList || !timeHistoryPlaceholder) return;

    if (state.timeSessions.length === 0) {
        timeHistoryList.innerHTML = ''; // Limpa a lista
        timeHistoryPlaceholder.style.display = 'block';
    } else {
        timeHistoryPlaceholder.style.display = 'none';

        // 1. Agrupar sessões por dia
        const groupedSessions = state.timeSessions.reduce((acc, session) => {
            const date = new Date(session.createdAt).toLocaleDateString('pt-BR');
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(session);
            return acc;
        }, {});

        // 2. Gerar o HTML para cada grupo
        let historyHtml = '';
        for (const date in groupedSessions) {
            const sessions = groupedSessions[date];
            const firstSessionDate = new Date(sessions[0].createdAt);
            
            historyHtml += `<div class="time-history__group-header">${getRelativeDateString(firstSessionDate)}</div>`;

            historyHtml += sessions.map(session => `
                 <li class="yarn-item" data-session-id="${session.id}">
                     <div class="yarn-info">
                         <span class="yarn-name">${session.name}</span>
                         <input type="text" class="form-group__input--small session-name-input" value="${session.name}" />
                         <span class="yarn-details">${new Date(session.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <div class="yarn-cost">${formatTime(session.seconds)}</div>
                     <button class="btn--icon yarn-duplicate" data-id="${session.id}" title="Duplicar sessão"><i data-feather="copy"></i></button>
                     <button class="btn--icon yarn-edit" data-id="${session.id}" title="Editar nome"><i data-feather="edit-2"></i></button>
                     <button class="btn--icon yarn-delete btn--icon-danger" data-id="${session.id}" title="Excluir sessão"><i data-feather="trash-2"></i></button>
                     <div class="session-edit-actions">
                         <button class="btn btn--small btn--primary session-save" data-id="${session.id}">Salvar</button>
                         <button class="btn btn--small btn--secondary session-cancel" data-id="${session.id}">Cancelar</button>
                     </div>
                 </li>
             `).join('');
        }

        timeHistoryList.innerHTML = historyHtml;
        
        feather.replace(); // Atualiza os ícones

        // 3. Adicionar listeners para os botões de ação (lógica inalterada)
        timeHistoryList.querySelectorAll('.yarn-item').forEach(item => {
            const sessionId = item.dataset.sessionId;

            item.querySelector('.yarn-edit')?.addEventListener('click', () => {
                item.classList.add('editing');
                item.querySelector('.session-name-input').focus();
            });

            item.querySelector('.session-cancel')?.addEventListener('click', () => {
                item.classList.remove('editing');
            });

            item.querySelector('.session-save')?.addEventListener('click', () => {
                const newName = item.querySelector('.session-name-input').value.trim();
                updateSessionName(sessionId, newName);
            });

            item.querySelector('.yarn-duplicate')?.addEventListener('click', () => {
                duplicateSession(sessionId);
            });

            item.querySelector('.yarn-delete')?.addEventListener('click', (e) => {
                const sessionId = e.currentTarget.dataset.id;
                deleteSession(sessionId);
            });
        });
    }
}

function getRelativeDateString(date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
        return 'Hoje';
    }
    if (date.getTime() === yesterday.getTime()) {
        return 'Ontem';
    }
    return new Date(date).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function renderTimeChart() {
    const ctx = elements.timeChartCanvas;
    if (!ctx) return;

    // 1. Agrupar e somar segundos por dia
    const dailyData = state.timeSessions.reduce((acc, session) => {
        const date = new Date(session.createdAt).toLocaleDateString('pt-BR');
        acc[date] = (acc[date] || 0) + session.seconds;
        return acc;
    }, {});

    // 2. Ordenar as datas e preparar os dados para o gráfico
    const sortedLabels = Object.keys(dailyData).sort((a, b) => {
        const dateA = a.split('/').reverse().join('-');
        const dateB = b.split('/').reverse().join('-');
        return new Date(dateA) - new Date(dateB);
    });

    const chartData = sortedLabels.map(label => {
        const totalSeconds = dailyData[label];
        return totalSeconds / 3600; // Converte segundos para horas
    });

    // 3. Destruir a instância anterior do gráfico, se existir
    if (state.timeChartInstance) {
        state.timeChartInstance.destroy();
    }

    // 4. Criar o novo gráfico de barras
    state.timeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedLabels,
            datasets: [{
                label: 'Horas Trabalhadas',
                data: chartData,
                backgroundColor: 'rgba(142, 45, 226, 0.6)', // Cor primária com transparência
                borderColor: 'rgba(142, 45, 226, 1)', // Cor primária sólida
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateTotalProductionTime() {
    const totalSecondsFromHistory = state.timeSessions.reduce((acc, session) => acc + session.seconds, 0);
    const hours = Math.floor(totalSecondsFromHistory / 3600);
    const minutes = Math.floor((totalSecondsFromHistory % 3600) / 60);
    if (elements.totalHoursInput) elements.totalHoursInput.value = hours;
    if (elements.totalMinutesInput) elements.totalMinutesInput.value = minutes;
    // Dispara um evento de input para que a lógica de cálculo de preço seja acionada
    if (elements.totalHoursInput) elements.totalHoursInput.dispatchEvent(new Event('input'));
}

function updateTimerButtonsState() {
    const isRunning = timerInterval !== null;
    const hasTime = totalSeconds > 0;
    elements.pauseTimerBtn.disabled = !isRunning;
    elements.stopTimerBtn.disabled = !hasTime;
    elements.saveSessionBtn.disabled = !hasTime;
}

export function setupTimerControls() {
    elements.startTimerBtn?.addEventListener('click', startTimer);
    elements.pauseTimerBtn?.addEventListener('click', pauseTimer);
    elements.stopTimerBtn?.addEventListener('click', stopTimer);
    elements.saveSessionBtn?.addEventListener('click', saveSession);
    
    // Estado inicial dos botões
    if (elements.pauseTimerBtn) {
        elements.pauseTimerBtn.style.display = 'none';
        updateTimerButtonsState();
    }
    renderTimeHistory(); // Renderiza o histórico vazio inicialmente
}
