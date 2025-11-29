import { state, elements } from './state.js';
import { updateCalculations } from './calculations.js';
import { saveFormState } from './storage.js';
import { showToast } from './ui.js';

let lastTickTimestamp = 0; // Guarda o timestamp do último segundo contado

export function startTimer() {
    if (state.timer.isRunning) return;

    state.timer.isRunning = true;
    state.timer.isPaused = false;
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = false;
    if (elements.circularTimer) elements.circularTimer.classList.add('timer-running');
    if (state.timer.isReworkMode) {
        if (elements.circularTimer) elements.circularTimer.classList.add('rework-mode');
    }

    lastTickTimestamp = Date.now(); // Define o ponto de partida
    state.timer.intervalId = setInterval(() => {
        // Incrementa o contador correto baseado no modo
        state.timer.isReworkMode ? state.timer.reworkSeconds++ : state.timer.currentSessionSeconds++;
        updateTimerDisplay();
        updateCalculations();
        saveFormState(); // Salva o estado a cada segundo
    }, 1000);
}

export function pauseTimer() {
    if (!state.timer.isRunning) return;

    clearInterval(state.timer.intervalId);
    state.timer.isRunning = false;
    if (elements.circularTimer) elements.circularTimer.classList.remove('timer-running');
    if (elements.circularTimer) elements.circularTimer.classList.remove('rework-mode');
    state.timer.isPaused = true;
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    saveFormState();
    document.title = state.originalTitle; // Restaura o título
}

export function resetTimer() {
    if (state.timer.currentSessionSeconds > 0) {
        if (!confirm("Tem certeza que deseja zerar a contagem da sessão atual? O tempo desta sessão será perdido.")) {
            return;
        }
    }

    state.timer.isRunning = false;
    state.timer.isPaused = false;
    if (elements.circularTimer) elements.circularTimer.classList.remove('timer-running');
    if (elements.circularTimer) elements.circularTimer.classList.remove('rework-mode');
    state.timer.currentSessionSeconds = 0; // Zera APENAS a sessão atual, preservando o tempo acumulado
    clearInterval(state.timer.intervalId);

    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;

    updateTimerDisplay();
    updateCalculations();
    saveFormState();
    document.title = state.originalTitle; // Restaura o título
}

export function updateTimerDisplay() {
    // Calcula o tempo da SESSÃO ATUAL para o cronômetro principal
    const displaySeconds = state.timer.isReworkMode ? state.timer.reworkSeconds : state.timer.currentSessionSeconds;
    const sessionHours = Math.floor(displaySeconds / 3600);
    const sessionMinutes = Math.floor((displaySeconds % 3600) / 60);
    const sessionSeconds = displaySeconds % 60;
    const sessionTimeString = `${String(sessionHours).padStart(2, '0')}:${String(sessionMinutes).padStart(2, '0')}:${String(sessionSeconds).padStart(2, '0')}`;

    // Calcula o tempo TOTAL (acumulado + sessão) para os resumos
    // Agora o tempo total produtivo é a soma do acumulado com a sessão atual
    const totalProductiveSeconds = state.timer.accumulatedSeconds + state.timer.currentSessionSeconds;
    // O tempo total para custo de mão de obra inclui o retrabalho
    const totalSecondsForLabor = totalProductiveSeconds + state.timer.reworkSeconds;

    // Atualiza o título da página com o estado do timer
    if (state.timer.isRunning) {
        const prefix = state.timer.isReworkMode ? '🟠' : '▶️';
        document.title = `${prefix} ${sessionTimeString} - AmigurumiPreço`;
    } else if (state.timer.isPaused) {
        const prefix = '⏸️';
        document.title = `${prefix} ${sessionTimeString} - AmigurumiPreço`;
    }

    if (elements.timerText) {
        elements.timerText.textContent = sessionTimeString;
    }
    if (elements.timerProgress) {
        const progress = ((displaySeconds % 60) / 60) * 100;
        const circumference = 2 * Math.PI * 45;
        elements.timerProgress.style.strokeDashoffset = circumference - (progress / 100) * circumference;
    }
    if (elements.totalPieceTimeDisplay) {
        elements.totalPieceTimeDisplay.textContent = `${Math.floor(totalProductiveSeconds / 3600)}h ${Math.floor((totalProductiveSeconds % 3600) / 60)}m`;
    }
    if (elements.laborTimeDisplay) {
        elements.laborTimeDisplay.textContent = `${(totalSecondsForLabor / 3600).toFixed(2)}h`;
    }
}

/**
 * Pega o tempo do cronômetro, adiciona aos campos de tempo manual e reseta o cronômetro.
 * Permite salvar uma sessão de trabalho e iniciar outra.
 */
function saveSession() {
    if (state.timer.currentSessionSeconds === 0) {
        showToast('O cronômetro está zerado. Não há sessão para salvar.', 'info');
        return;
    }

    // Pausa o timer se estiver rodando
    if (state.timer.isRunning) {
        pauseTimer();
    }

    // Soma o tempo da sessão atual ao tempo acumulado
    state.timer.accumulatedSeconds += state.timer.currentSessionSeconds;
    state.timer.currentSessionSeconds = 0; // Zera a sessão atual

    updateTimerDisplay();
    updateCalculations();
    saveFormState();
    showToast("Sessão salva! Clique em 'Resetar' para iniciar uma nova contagem.", 'success');
}

function addManualTime() {
    const hours = parseInt(elements.manualHoursInput.value) || 0;
    const minutes = parseInt(elements.manualMinutesInput.value) || 0;

    if (hours === 0 && minutes === 0) return;

    const secondsToAdd = (hours * 3600) + (minutes * 60);
    state.timer.accumulatedSeconds += secondsToAdd;

    elements.manualHoursInput.value = '';
    elements.manualMinutesInput.value = '';

    updateTimerDisplay();
    updateCalculations();
    saveFormState();
    showToast('Tempo manual adicionado com sucesso!', 'success');
}

function toggleReworkMode() {
    state.timer.isReworkMode = !state.timer.isReworkMode;
    const reworkBtn = document.getElementById('reworkModeBtn');
    reworkBtn.classList.toggle('active', state.timer.isReworkMode);

    if (state.timer.isRunning) {
        elements.circularTimer.classList.toggle('rework-mode', state.timer.isReworkMode);
    }
    showToast(state.timer.isReworkMode ? 'Modo Retrabalho ATIVADO' : 'Modo Retrabalho DESATIVADO', 'info');
}

export function setupTimerEventListeners() {
    if (elements.startBtn) elements.startBtn.addEventListener('click', startTimer);
    if (elements.pauseBtn) elements.pauseBtn.addEventListener('click', pauseTimer);
    if (elements.resetBtn) elements.resetBtn.addEventListener('click', resetTimer);
    if (elements.saveSessionBtn) elements.saveSessionBtn.addEventListener('click', saveSession);
    if (elements.addTimeBtn) elements.addTimeBtn.addEventListener('click', addManualTime);
    if (document.getElementById('reworkModeBtn')) document.getElementById('reworkModeBtn').addEventListener('click', toggleReworkMode);
}
