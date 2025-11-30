import { state, elements } from './state.js';
import { showToast } from './ui.js';
import { updateCalculations } from './calculations.js';

let timerInterval = null;

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export function updateTimerDisplay() {
    if (!elements.timerText) return;
    
    // CORREÇÃO: Decide qual tempo mostrar com base no modo
    const timeToShow = state.timer.isReworkMode 
        ? state.timer.reworkSeconds 
        : state.timer.currentSessionSeconds;

    elements.timerText.textContent = formatTime(timeToShow);
    
    // Atualiza a barra de progresso
    const circumference = 283; 
    const progress = (timeToShow % 60) / 60;
    
    if (elements.timerProgress) {
        elements.timerProgress.style.strokeDashoffset = circumference * (1 - progress);
        
        // Opcional: Mudar a cor da barra se estiver em retrabalho
        if (state.timer.isReworkMode) {
             elements.timerProgress.style.stroke = '#E67E22'; // Laranja
        } else {
             elements.timerProgress.style.stroke = ''; // Volta à cor do CSS (Roxo)
        }
    }
}

function startTimer() {
    if (timerInterval) return;
    if (elements.circularTimer) elements.circularTimer.classList.add('timer-running');
    if (elements.startBtn) elements.startBtn.style.display = 'none';
    if (elements.pauseBtn) elements.pauseBtn.style.display = 'inline-flex';
    if (elements.pauseBtn) elements.pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
        if (state.timer.isReworkMode) {
            state.timer.reworkSeconds++;
        } else {
            state.timer.currentSessionSeconds++;
        }
        updateTimerDisplay();
        updateCalculations(); // Atualiza custo em tempo real
    }, 1000);
}

export function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    if (elements.circularTimer) elements.circularTimer.classList.remove('timer-running');
    if (elements.startBtn) elements.startBtn.style.display = 'inline-flex';
    if (elements.pauseBtn) elements.pauseBtn.style.display = 'none';
}

export function resetTimer() {
    pauseTimer();
    state.timer.currentSessionSeconds = 0;
    state.timer.reworkSeconds = 0;
    updateTimerDisplay();
    updateCalculations();
}

function addManualTime() {
    const hours = parseInt(elements.manualHoursInput.value) || 0;
    const minutes = parseInt(elements.manualMinutesInput.value) || 0;

    if (hours === 0 && minutes === 0) {
        showToast('Insira horas ou minutos.', 'info');
        return;
    }

    const secondsToAdd = (hours * 3600) + (minutes * 60);
    state.timer.accumulatedSeconds += secondsToAdd;

    updateCalculations();
    showToast(`${hours}h ${minutes}m adicionados!`, 'success');

    elements.manualHoursInput.value = '';
    elements.manualMinutesInput.value = '';
}

async function saveSession() {
    if (state.timer.currentSessionSeconds === 0) {
        showToast('O cronômetro está zerado.', 'info');
        return;
    }
    const sessionName = `Sessão ${new Date().toLocaleTimeString()}`;
    const newSession = {
        id: `local_${Date.now()}`,
        name: sessionName,
        seconds: state.timer.currentSessionSeconds,
        createdAt: new Date().toISOString()
    };

    state.timer.accumulatedSeconds += state.timer.currentSessionSeconds;
    state.history.push(newSession); // Se usar histórico de sessões
    
    showToast('Sessão salva e tempo somado!', 'success');
    resetTimer(); 
}

function toggleReworkMode() {
    state.timer.isReworkMode = !state.timer.isReworkMode;
    elements.reworkModeBtn.classList.toggle('active', state.timer.isReworkMode);
    elements.circularTimer.classList.toggle('rework-mode', state.timer.isReworkMode);
    showToast(state.timer.isReworkMode ? 'Modo Retrabalho Ativado' : 'Modo Retrabalho Desativado', 'info');
}

export function setupTimerControls() {
    if(elements.startBtn) elements.startBtn.addEventListener('click', startTimer);
    if(elements.pauseBtn) elements.pauseBtn.addEventListener('click', pauseTimer);
    if(elements.resetBtn) elements.resetBtn.addEventListener('click', resetTimer);
    if(elements.addTimeBtn) elements.addTimeBtn.addEventListener('click', addManualTime);
    if(elements.saveSessionBtn) elements.saveSessionBtn.addEventListener('click', saveSession);
    if(elements.reworkModeBtn) elements.reworkModeBtn.addEventListener('click', toggleReworkMode);
}