export const state = {
    timer: {
        isRunning: false,
        isPaused: false,
        animationFrameId: null, // Para controlar o requestAnimationFrame
        lastTickTimestamp: 0,   // Para garantir a precisão do tempo
        accumulatedSeconds: 0, // Tempo total de sessões salvas
        currentSessionSeconds: 0, // Tempo do cronômetro atual
        isReworkMode: false, // Controla se o timer está em modo retrabalho
        reworkSeconds: 0, // Acumula o tempo de retrabalho
        totalSeconds: 0 // Mantido para compatibilidade com loadFormState
    },
    yarns: [],
    otherMaterials: [], // 1. Adiciona a lista de outros materiais ao estado
    history: [],
    recipes: [],
    // Estado temporário para a criação de uma nova receita
    newRecipeDraft: {
        name: '',
        description: '',
        yarns: [],
        otherMaterials: []
    },
    wasteCost: 0, // Custo de materiais desperdiçados
    baseSalary: 30.00,
    otherMaterialsCost: 0,
    customSalary: null,
    historySortOrder: 'date_desc',
    originalTitle: document.title, // Guarda o título original da página
    favicon: document.querySelector("link[rel='icon']"), // Referência ao favicon
    costChartInstance: null, // Armazena a instância do gráfico de custos (pizza)
    timeChartInstance: null // Armazena a instância do gráfico de tempo (barras)
};

export const elements = {
    // Timer
    circularTimer: document.querySelector('.circular-timer'),
    timerProgress: document.getElementById('timer-progress'),
    timerText: document.getElementById('timer-text'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    reworkModeBtn: document.getElementById('reworkModeBtn'),
    totalPieceTimeDisplay: document.getElementById('totalPieceTimeDisplay'),
    laborTimeDisplay: document.getElementById('laborTimeDisplay'),
    laborRateDisplay: document.getElementById('laborRateDisplay'),

    // Inputs
    pieceName: document.getElementById('pieceName'),
    pieceType: document.getElementById('pieceType'),
    baseSalaryInput: document.getElementById('baseSalary'),
    customSalaryInput: document.getElementById('customSalary'),
    profitMarginInput: document.getElementById('profitMargin'),
    otherMaterialsCostInput: document.getElementById('otherMaterialsCost'),
    indirectCostsInput: document.getElementById('indirectCosts'),
    manualHoursInput: document.getElementById('manualHours'),
    manualMinutesInput: document.getElementById('manualMinutes'),

    // Displays
    yarnCostDisplay: document.getElementById('yarnCostDisplay'),
    materialsCostDisplay: document.getElementById('materialsCostDisplay'),
    laborCostDisplay: document.getElementById('laborCostDisplay'),
    laborCostSummary: document.getElementById('laborCostSummary'),
    totalCostDisplay: document.getElementById('totalCostDisplay'),
    finalPriceDisplay: document.getElementById('finalPriceDisplay'),

    // Containers
    materialsContainer: document.getElementById('materialsContainer'), // 2. Adiciona o container para a lista de materiais
    yarnsContainer: document.getElementById('yarnsContainer'),
    recipesGrid: document.getElementById('recipesGrid'),
    historySearchInput: document.getElementById('historySearchInput'),
    historySortSelect: document.getElementById('historySortSelect'),
    historyContainer: document.getElementById('historyContainer'),

    // Buttons
    addMaterialBtn: document.getElementById('addMaterialBtn'), // 3. Adiciona o botão para abrir o modal de material
    addYarnBtn: document.getElementById('addYarnBtn'),
    savePieceBtn: document.getElementById('savePieceBtn'),
    saveSessionBtn: document.getElementById('saveSessionBtn'),
    addTimeBtn: document.getElementById('addTimeBtn'),
    addRecipeBtn: document.getElementById('addRecipeBtn'),

    // Modals
    yarnModal: document.getElementById('yarnModal'),
    materialModal: document.getElementById('materialModal'), // 4. Adiciona o modal de material
    materialNameInput: document.getElementById('materialName'),
    materialQuantityInput: document.getElementById('materialQuantity'),
    materialPriceInput: document.getElementById('materialPrice'),
    recipeModal: document.getElementById('recipeModal'),
    yarnNameInput: document.getElementById('yarnName'),
    yarnInitialWeightInput: document.getElementById('yarnInitialWeight'),
    yarnFinalWeightInput: document.getElementById('yarnFinalWeight'),
    yarnPricePerGramInput: document.getElementById('yarnPricePerGram'),
    yarnHelperPriceInput: document.getElementById('skeinPrice'),
    yarnHelperWeightInput: document.getElementById('skeinWeight'),
    yarnHelperResult: document.getElementById('yarnHelperResult'),
    recipeNameInput: document.getElementById('recipeName'),
    recipeDescriptionInput: document.getElementById('recipeDescription'),
    recipeSteps: document.getElementById('recipeSteps'),

    // Salary Helper Modal
    openSalaryHelperBtn: document.getElementById('openSalaryHelper'),
    salaryHelperModal: document.getElementById('salaryHelperModal'),
    desiredSalaryInput: document.getElementById('desiredSalary'),
    hoursPerDayInput: document.getElementById('hoursPerDay'),
    daysPerWeekInput: document.getElementById('daysPerWeek'),
    salaryResultDisplay: document.getElementById('salaryResultDisplay'),
    applySalaryBtn: document.getElementById('applySalaryBtn'),

    // Nav
    navButtons: document.querySelectorAll('.nav-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    mainNav: document.getElementById('main-nav'),
    menuToggle: document.getElementById('menu-toggle'),

    // App Structure
    heroPage: document.getElementById('hero-page'),
    mainApp: document.getElementById('main-app'),
    appHeader: document.querySelector('.app-header'),
    mainContent: document.querySelector('.main-content'),
    enterAppBtn: document.getElementById('enter-app-btn'),
    startPricingBtn: document.getElementById('startPricingBtn'), // Adicionado

    // Auth
    authModal: document.getElementById('authModal'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    authModalTitle: document.getElementById('authModalTitle'),
    registerName: document.getElementById('registerName'),
    googleLoginBtn: document.getElementById('googleLoginBtn'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userInfoContainer: document.getElementById('userInfoContainer'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    
    // Validação de Senha
    passwordStrengthIndicator: document.getElementById('password-strength-indicator'),
    lengthCheck: document.getElementById('length-check'),
    caseCheck: document.getElementById('case-check'),
    numberCheck: document.getElementById('number-check'),
    specialCheck: document.getElementById('special-check'),
    passwordToggleBtns: document.querySelectorAll('.password-toggle-btn'),

    // Acessibilidade
    srAnnouncer: document.getElementById('sr-announcer'),

    // Gráficos
    costChartCanvas: document.getElementById('costDistributionChart'),
    timeChartCanvas: document.getElementById('timeChartCanvas'),
};
