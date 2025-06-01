/**
 * Finances Module - Agenda Personal Pro
 * Sistema completo de gestión financiera personal
 */

class FinancesManager {
    constructor() {
        this.isInitialized = false;
        this.budgets = [];
        this.transactions = [];
        this.categories = {
            income: [
                { id: 'salary', name: 'Salario', icon: 'fas fa-briefcase', color: '#10b981' },
                { id: 'freelance', name: 'Freelance', icon: 'fas fa-laptop-code', color: '#059669' },
                { id: 'investments', name: 'Inversiones', icon: 'fas fa-chart-line', color: '#0d9488' },
                { id: 'business', name: 'Negocio', icon: 'fas fa-store', color: '#0891b2' },
                { id: 'rental', name: 'Rentas', icon: 'fas fa-home', color: '#0e7490' },
                { id: 'other_income', name: 'Otros Ingresos', icon: 'fas fa-plus-circle', color: '#0369a1' }
            ],
            expense: [
                { id: 'housing', name: 'Vivienda', icon: 'fas fa-home', color: '#ef4444' },
                { id: 'food', name: 'Alimentación', icon: 'fas fa-utensils', color: '#f97316' },
                { id: 'transport', name: 'Transporte', icon: 'fas fa-car', color: '#eab308' },
                { id: 'utilities', name: 'Servicios', icon: 'fas fa-bolt', color: '#84cc16' },
                { id: 'entertainment', name: 'Entretenimiento', icon: 'fas fa-gamepad', color: '#06b6d4' },
                { id: 'health', name: 'Salud', icon: 'fas fa-heart-pulse', color: '#8b5cf6' },
                { id: 'education', name: 'Educación', icon: 'fas fa-graduation-cap', color: '#ec4899' },
                { id: 'shopping', name: 'Compras', icon: 'fas fa-shopping-bag', color: '#f43f5e' },
                { id: 'savings', name: 'Ahorros', icon: 'fas fa-piggy-bank', color: '#10b981' },
                { id: 'debt', name: 'Deudas', icon: 'fas fa-credit-card', color: '#dc2626' },
                { id: 'other_expense', name: 'Otros Gastos', icon: 'fas fa-minus-circle', color: '#6b7280' }
            ]
        };
        this.savingsGoals = [];
        this.monthlyOverview = null;
        this.currentBudgetPeriod = this.getCurrentPeriod();
        
        // Configuración de la moneda
        this.currency = {
            symbol: '$',
            code: 'MXN',
            locale: 'es-MX'
        };
    }

    /**
     * Inicializar el módulo de finanzas
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ Módulo de Finanzas ya está inicializado');
            return;
        }

        console.log('💰 Inicializando Módulo de Finanzas...');
        
        this.loadData();
        this.bindEvents();
        this.renderFinancesModule();
        this.updateDashboard();
        this.checkBudgetAlerts();
        this.isInitialized = true;
        
        // Trigger evento de inicialización
        this.dispatchEvent('financesModuleInitialized');
        
        console.log('✅ Módulo de Finanzas inicializado correctamente');
    }

    /**
     * Cargar datos desde localStorage
     */
    loadData() {
        if (window.StorageManager) {
            this.budgets = window.StorageManager.load('finances-budgets') || [];
            this.transactions = window.StorageManager.load('finances-transactions') || [];
            this.savingsGoals = window.StorageManager.load('finances-savings') || [];
        } else {
            // Fallback a localStorage directo
            this.budgets = JSON.parse(localStorage.getItem('agenda-pro-finances-budgets') || '[]');
            this.transactions = JSON.parse(localStorage.getItem('agenda-pro-finances-transactions') || '[]');
            this.savingsGoals = JSON.parse(localStorage.getItem('agenda-pro-finances-savings') || '[]');
        }
        
        console.log(`📊 Datos cargados: ${this.budgets.length} presupuestos, ${this.transactions.length} transacciones, ${this.savingsGoals.length} metas de ahorro`);
    }

    /**
     * Guardar datos en localStorage
     */
    saveData() {
        if (window.StorageManager) {
            window.StorageManager.save('finances-budgets', this.budgets);
            window.StorageManager.save('finances-transactions', this.transactions);
            window.StorageManager.save('finances-savings', this.savingsGoals);
        } else {
            // Fallback a localStorage directo
            localStorage.setItem('agenda-pro-finances-budgets', JSON.stringify(this.budgets));
            localStorage.setItem('agenda-pro-finances-transactions', JSON.stringify(this.transactions));
            localStorage.setItem('agenda-pro-finances-savings', JSON.stringify(this.savingsGoals));
        }
    }

    /**
     * Vincular eventos del DOM
     */
    bindEvents() {
        // Formulario de transacciones
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTransaction();
            });
        }

        // Formulario de presupuesto
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBudget();
            });
        }

        // Formulario de metas de ahorro
        const savingsForm = document.getElementById('savingsForm');
        if (savingsForm) {
            savingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addSavingsGoal();
            });
        }

        // Filtros
        this.bindFilterEvents();

        // Tipo de transacción
        const transactionType = document.getElementById('transactionType');
        if (transactionType) {
            transactionType.addEventListener('change', (e) => {
                this.updateCategoryOptions(e.target.value);
            });
        }

        // Período de presupuesto
        const budgetPeriod = document.getElementById('budgetPeriod');
        if (budgetPeriod) {
            budgetPeriod.addEventListener('change', (e) => {
                this.currentBudgetPeriod = e.target.value;
                this.updateDashboard();
            });
        }
    }

    /**
     * Vincular eventos de filtros
     */
    bindFilterEvents() {
        const filters = ['filterTransactionType', 'filterCategory', 'filterDateRange'];
        
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.renderTransactions();
                });
            }
        });
    }

    /**
     * Agregar nueva transacción
     */
    addTransaction() {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        const transaction = {
            id: this.generateId(),
            type: formData.get('type'), // 'income' o 'expense'
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            description: formData.get('description'),
            date: formData.get('date'),
            account: formData.get('account') || 'efectivo',
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
            createdAt: new Date().toISOString()
        };

        // Validaciones
        if (!transaction.amount || transaction.amount <= 0) {
            this.showNotification('El monto debe ser mayor a 0', 'error');
            return;
        }

        if (!transaction.category) {
            this.showNotification('Selecciona una categoría', 'error');
            return;
        }

        this.transactions.unshift(transaction);
        this.saveData();
        this.renderTransactions();
        this.updateDashboard();
        this.checkBudgetAlerts();
        form.reset();
        
        // Establecer fecha de hoy por defecto
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        
        this.showNotification(`${transaction.type === 'income' ? 'Ingreso' : 'Gasto'} agregado correctamente`, 'success');
        
        // Trigger evento
        this.dispatchEvent('financesTransactionAdded', { transaction });
    }

    /**
     * Agregar nuevo presupuesto
     */
    addBudget() {
        const form = document.getElementById('budgetForm');
        const formData = new FormData(form);
        
        const budget = {
            id: this.generateId(),
            name: formData.get('name'),
            period: formData.get('period'), // 'monthly', 'weekly', 'yearly'
            totalAmount: parseFloat(formData.get('totalAmount')),
            categories: this.getBudgetCategories(form),
            startDate: formData.get('startDate'),
            endDate: this.calculateEndDate(formData.get('startDate'), formData.get('period')),
            createdAt: new Date().toISOString()
        };

        // Validaciones
        if (!budget.name.trim()) {
            this.showNotification('El nombre del presupuesto es requerido', 'error');
            return;
        }

        if (!budget.totalAmount || budget.totalAmount <= 0) {
            this.showNotification('El monto total debe ser mayor a 0', 'error');
            return;
        }

        this.budgets.unshift(budget);
        this.saveData();
        this.renderBudgets();
        this.updateDashboard();
        form.reset();
        
        this.showNotification('Presupuesto creado correctamente', 'success');
        
        // Trigger evento
        this.dispatchEvent('financesBudgetAdded', { budget });
    }

    /**
     * Agregar meta de ahorro
     */
    addSavingsGoal() {
        const form = document.getElementById('savingsForm');
        const formData = new FormData(form);
        
        const savingsGoal = {
            id: this.generateId(),
            name: formData.get('name'),
            targetAmount: parseFloat(formData.get('targetAmount')),
            currentAmount: parseFloat(formData.get('currentAmount')) || 0,
            targetDate: formData.get('targetDate'),
            category: formData.get('category') || 'general',
            description: formData.get('description'),
            createdAt: new Date().toISOString()
        };

        // Validaciones
        if (!savingsGoal.name.trim()) {
            this.showNotification('El nombre de la meta es requerido', 'error');
            return;
        }

        if (!savingsGoal.targetAmount || savingsGoal.targetAmount <= 0) {
            this.showNotification('La meta debe ser mayor a 0', 'error');
            return;
        }

        this.savingsGoals.unshift(savingsGoal);
        this.saveData();
        this.renderSavingsGoals();
        this.updateDashboard();
        form.reset();
        
        this.showNotification('Meta de ahorro creada correctamente', 'success');
        
        // Trigger evento
        this.dispatchEvent('financesSavingsGoalAdded', { savingsGoal });
    }

    /**
     * Renderizar el módulo completo de finanzas
     */
    renderFinancesModule() {
        this.renderDashboard();
        this.renderTransactions();
        this.renderBudgets();
        this.renderSavingsGoals();
        this.setupInitialValues();
    }

    /**
     * Renderizar dashboard financiero
     */
    renderDashboard() {
        const dashboardContainer = document.getElementById('financesDashboard');
        if (!dashboardContainer) return;

        const currentMonthData = this.getCurrentMonthData();
        
        dashboardContainer.innerHTML = `
            <div class="row">
                <div class="col-md-3 col-6 mb-3">
                    <div class="stat-card stat-card-income">
                        <div class="stat-icon">
                            <i class="fas fa-arrow-up"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${this.formatCurrency(currentMonthData.totalIncome)}</div>
                            <div class="stat-label">Ingresos del Mes</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="stat-card stat-card-expense">
                        <div class="stat-icon">
                            <i class="fas fa-arrow-down"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${this.formatCurrency(currentMonthData.totalExpenses)}</div>
                            <div class="stat-label">Gastos del Mes</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="stat-card stat-card-balance">
                        <div class="stat-icon">
                            <i class="fas fa-balance-scale"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number ${currentMonthData.balance >= 0 ? 'text-success' : 'text-danger'}">${this.formatCurrency(currentMonthData.balance)}</div>
                            <div class="stat-label">Balance</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-3">
                    <div class="stat-card stat-card-savings">
                        <div class="stat-icon">
                            <i class="fas fa-piggy-bank"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number">${this.formatCurrency(currentMonthData.totalSavings)}</div>
                            <div class="stat-label">Total Ahorros</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="chart-container">
                        <h6><i class="fas fa-chart-pie me-2"></i>Gastos por Categoría</h6>
                        <canvas id="expensesCategoryChart" height="200"></canvas>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h6><i class="fas fa-chart-line me-2"></i>Tendencia Mensual</h6>
                        <canvas id="monthlyTrendChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Renderizar gráficos
        this.renderCharts();
    }

    /**
     * Renderizar transacciones
     */
    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (!container) return;

        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                    <h5>No hay transacciones</h5>
                    <p class="text-muted">Agrega tu primera transacción para comenzar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTransactions.map(transaction => `
            <div class="transaction-item ${transaction.type}" data-id="${transaction.id}">
                <div class="transaction-icon">
                    <i class="${this.getCategoryIcon(transaction.category, transaction.type)}"></i>
                </div>
                <div class="transaction-content">
                    <div class="transaction-header">
                        <h6 class="transaction-title">${transaction.description}</h6>
                        <span class="transaction-amount ${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                            ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                        </span>
                    </div>
                    <div class="transaction-details">
                        <span class="transaction-category">${this.getCategoryName(transaction.category, transaction.type)}</span>
                        <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                        ${transaction.account ? `<span class="transaction-account">${transaction.account}</span>` : ''}
                    </div>
                    ${transaction.tags && transaction.tags.length > 0 ? `
                        <div class="transaction-tags">
                            ${transaction.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="finances.editTransaction('${transaction.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="finances.deleteTransaction('${transaction.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Renderizar presupuestos
     */
    renderBudgets() {
        const container = document.getElementById('budgetsList');
        if (!container) return;

        if (this.budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calculator fa-3x text-muted mb-3"></i>
                    <h5>No hay presupuestos</h5>
                    <p class="text-muted">Crea tu primer presupuesto para controlar tus gastos</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.budgets.map(budget => {
            const usage = this.getBudgetUsage(budget);
            const progressPercentage = Math.min((usage.spent / budget.totalAmount) * 100, 100);
            const statusClass = progressPercentage > 90 ? 'danger' : progressPercentage > 70 ? 'warning' : 'success';
            
            return `
                <div class="budget-item" data-id="${budget.id}">
                    <div class="budget-header">
                        <h6 class="budget-name">${budget.name}</h6>
                        <span class="budget-period badge bg-secondary">${this.formatPeriod(budget.period)}</span>
                    </div>
                    <div class="budget-progress">
                        <div class="progress mb-2">
                            <div class="progress-bar bg-${statusClass}" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="budget-amounts">
                            <span>Gastado: ${this.formatCurrency(usage.spent)}</span>
                            <span>Presupuesto: ${this.formatCurrency(budget.totalAmount)}</span>
                        </div>
                        <div class="budget-remaining ${usage.remaining >= 0 ? 'text-success' : 'text-danger'}">
                            ${usage.remaining >= 0 ? 'Disponible' : 'Excedido'}: ${this.formatCurrency(Math.abs(usage.remaining))}
                        </div>
                    </div>
                    <div class="budget-actions">
                        <button class="btn btn-sm btn-outline-primary" onclick="finances.editBudget('${budget.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="finances.deleteBudget('${budget.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderizar metas de ahorro
     */
    renderSavingsGoals() {
        const container = document.getElementById('savingsGoalsList');
        if (!container) return;

        if (this.savingsGoals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-piggy-bank fa-3x text-muted mb-3"></i>
                    <h5>No hay metas de ahorro</h5>
                    <p class="text-muted">Establece tu primera meta de ahorro</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.savingsGoals.map(goal => {
            const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const daysRemaining = this.getDaysUntil(goal.targetDate);
            
            return `
                <div class="savings-goal-item" data-id="${goal.id}">
                    <div class="savings-header">
                        <h6 class="savings-name">${goal.name}</h6>
                        <span class="savings-percentage">${progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div class="savings-progress">
                        <div class="progress mb-2">
                            <div class="progress-bar bg-info" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="savings-amounts">
                            <span>Ahorrado: ${this.formatCurrency(goal.currentAmount)}</span>
                            <span>Meta: ${this.formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div class="savings-details">
                            <span class="text-primary">Faltan: ${this.formatCurrency(remaining)}</span>
                            ${daysRemaining !== null ? `<span class="text-muted">${daysRemaining} días restantes</span>` : ''}
                        </div>
                    </div>
                    <div class="savings-actions">
                        <button class="btn btn-sm btn-outline-success" onclick="finances.addToSavings('${goal.id}')">
                            <i class="fas fa-plus"></i> Agregar
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="finances.editSavingsGoal('${goal.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="finances.deleteSavingsGoal('${goal.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Métodos de utilidad
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getCurrentPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat(this.currency.locale, {
            style: 'currency',
            currency: this.currency.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    }

    formatPeriod(period) {
        const periods = {
            'weekly': 'Semanal',
            'monthly': 'Mensual',
            'yearly': 'Anual'
        };
        return periods[period] || period;
    }

    getCategoryIcon(categoryId, type) {
        const category = this.categories[type].find(cat => cat.id === categoryId);
        return category ? category.icon : 'fas fa-question-circle';
    }

    getCategoryName(categoryId, type) {
        const category = this.categories[type].find(cat => cat.id === categoryId);
        return category ? category.name : 'Sin categoría';
    }

    getDaysUntil(dateString) {
        if (!dateString) return null;
        const targetDate = new Date(dateString);
        const today = new Date();
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    updateCategoryOptions(type) {
        const categorySelect = document.getElementById('transactionCategory');
        if (!categorySelect) return;

        categorySelect.innerHTML = '<option value="">Seleccionar categoría...</option>';
        
        this.categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    setupInitialValues() {
        // Establecer fecha de hoy por defecto
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = ['transactionDate', 'budgetStartDate'];
        
        dateInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = today;
            }
        });

        // Configurar categorías iniciales
        this.updateCategoryOptions('expense');
    }

    getCurrentMonthData() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthTransactions = this.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        const totalIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalSavings = this.savingsGoals
            .reduce((sum, goal) => sum + goal.currentAmount, 0);

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            totalSavings,
            transactions: monthTransactions
        };
    }

    getFilteredTransactions() {
        let filtered = [...this.transactions];

        // Filtro por tipo
        const typeFilter = document.getElementById('filterTransactionType')?.value;
        if (typeFilter) {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Filtro por categoría
        const categoryFilter = document.getElementById('filterCategory')?.value;
        if (categoryFilter) {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        // Filtro por rango de fechas
        const dateRangeFilter = document.getElementById('filterDateRange')?.value;
        if (dateRangeFilter) {
            const now = new Date();
            let startDate;
            
            switch (dateRangeFilter) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }
            
            if (startDate) {
                filtered = filtered.filter(t => new Date(t.date) >= startDate);
            }
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getBudgetUsage(budget) {
        const budgetStart = new Date(budget.startDate);
        const budgetEnd = new Date(budget.endDate);
        
        const relevantTransactions = this.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transaction.type === 'expense' &&
                   transactionDate >= budgetStart &&
                   transactionDate <= budgetEnd;
        });

        const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = budget.totalAmount - spent;

        return { spent, remaining };
    }

    calculateEndDate(startDate, period) {
        const start = new Date(startDate);
        
        switch (period) {
            case 'weekly':
                start.setDate(start.getDate() + 7);
                break;
            case 'monthly':
                start.setMonth(start.getMonth() + 1);
                break;
            case 'yearly':
                start.setFullYear(start.getFullYear() + 1);
                break;
        }
        
        return start.toISOString().split('T')[0];
    }

    getBudgetCategories(form) {
        const categories = {};
        const formData = new FormData(form);
        
        // Por ahora, asignar todo el presupuesto como general
        // En el futuro se puede expandir para categorías específicas
        categories.general = parseFloat(formData.get('totalAmount'));
        
        return categories;
    }

    checkBudgetAlerts() {
        this.budgets.forEach(budget => {
            const usage = this.getBudgetUsage(budget);
            const percentage = (usage.spent / budget.totalAmount) * 100;
            
            if (percentage >= 90) {
                this.showNotification(`⚠️ Presupuesto "${budget.name}" al ${percentage.toFixed(1)}%`, 'warning');
            } else if (usage.remaining < 0) {
                this.showNotification(`🚨 Presupuesto "${budget.name}" excedido por ${this.formatCurrency(Math.abs(usage.remaining))}`, 'error');
            }
        });
    }

    updateDashboard() {
        this.renderDashboard();
        this.updateStats();
    }

    updateStats() {
        const currentMonthData = this.getCurrentMonthData();
        
        // Actualizar estadísticas en el header si existen
        const elements = {
            'totalIncome': currentMonthData.totalIncome,
            'totalExpenses': currentMonthData.totalExpenses,
            'currentBalance': currentMonthData.balance,
            'totalSavings': currentMonthData.totalSavings
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = this.formatCurrency(value);
            }
        });
    }

    renderCharts() {
        // Este método renderizaría gráficos usando Chart.js
        // Por simplicidad, se implementa como placeholder
        console.log('📊 Renderizando gráficos financieros...');
        
        // Aquí se implementarían gráficos de:
        // - Gastos por categoría (pie chart)
        // - Tendencia mensual (line chart)
        // - Progreso de presupuestos (bar chart)
    }

    // ===== MÉTODOS DE EDICIÓN Y ELIMINACIÓN =====

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        // Implementar modal de edición o formulario inline
        console.log('✏️ Editando transacción:', transaction);
        this.showNotification('Función de edición próximamente', 'info');
    }

    deleteTransaction(id) {
        if (!confirm('¿Eliminar esta transacción?')) return;

        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveData();
        this.renderTransactions();
        this.updateDashboard();
        
        this.showNotification('Transacción eliminada', 'success');
        this.dispatchEvent('financesTransactionDeleted', { id });
    }

    editBudget(id) {
        const budget = this.budgets.find(b => b.id === id);
        if (!budget) return;

        console.log('✏️ Editando presupuesto:', budget);
        this.showNotification('Función de edición próximamente', 'info');
    }

    deleteBudget(id) {
        if (!confirm('¿Eliminar este presupuesto?')) return;

        this.budgets = this.budgets.filter(b => b.id !== id);
        this.saveData();
        this.renderBudgets();
        this.updateDashboard();
        
        this.showNotification('Presupuesto eliminado', 'success');
        this.dispatchEvent('financesBudgetDeleted', { id });
    }

    editSavingsGoal(id) {
        const goal = this.savingsGoals.find(g => g.id === id);
        if (!goal) return;

        console.log('✏️ Editando meta de ahorro:', goal);
        this.showNotification('Función de edición próximamente', 'info');
    }

    deleteSavingsGoal(id) {
        if (!confirm('¿Eliminar esta meta de ahorro?')) return;

        this.savingsGoals = this.savingsGoals.filter(g => g.id !== id);
        this.saveData();
        this.renderSavingsGoals();
        this.updateDashboard();
        
        this.showNotification('Meta de ahorro eliminada', 'success');
        this.dispatchEvent('financesSavingsGoalDeleted', { id });
    }

    addToSavings(goalId) {
        const goal = this.savingsGoals.find(g => g.id === goalId);
        if (!goal) return;

        const amount = prompt(`¿Cuánto quieres agregar a "${goal.name}"?`);
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

        const addAmount = parseFloat(amount);
        goal.currentAmount += addAmount;

        // Crear transacción de ahorro
        const transaction = {
            id: this.generateId(),
            type: 'expense',
            amount: addAmount,
            category: 'savings',
            description: `Ahorro para: ${goal.name}`,
            date: new Date().toISOString().split('T')[0],
            account: 'ahorros',
            tags: ['ahorro', goal.name.toLowerCase()],
            createdAt: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveData();
        this.renderSavingsGoals();
        this.renderTransactions();
        this.updateDashboard();

        // Verificar si se completó la meta
        if (goal.currentAmount >= goal.targetAmount) {
            this.showNotification(`🎉 ¡Felicidades! Completaste la meta "${goal.name}"`, 'success');
            this.dispatchEvent('financesSavingsGoalCompleted', { goal });
        } else {
            this.showNotification(`Agregaste ${this.formatCurrency(addAmount)} a "${goal.name}"`, 'success');
        }
    }

    // ===== MÉTODOS DE EXPORTACIÓN =====

    exportTransactions() {
        const data = {
            transactions: this.transactions,
            budgets: this.budgets,
            savingsGoals: this.savingsGoals,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `finanzas-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Datos financieros exportados', 'success');
    }

    clearOldTransactions() {
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

        const originalCount = this.transactions.length;
        this.transactions = this.transactions.filter(transaction => 
            new Date(transaction.date) >= cutoffDate
        );

        const removedCount = originalCount - this.transactions.length;
        
        if (removedCount > 0) {
            this.saveData();
            this.renderTransactions();
            this.updateDashboard();
            this.showNotification(`Se eliminaron ${removedCount} transacciones antiguas`, 'info');
        } else {
            this.showNotification('No hay transacciones antiguas para eliminar', 'info');
        }
    }

    // ===== MÉTODOS DE REPORTES =====

    generateMonthlyReport() {
        const currentMonthData = this.getCurrentMonthData();
        const expensesByCategory = this.getExpensesByCategory();
        
        const report = {
            period: this.getCurrentPeriod(),
            summary: currentMonthData,
            expensesByCategory,
            budgetStatus: this.budgets.map(budget => ({
                name: budget.name,
                usage: this.getBudgetUsage(budget),
                totalAmount: budget.totalAmount
            })),
            savingsProgress: this.savingsGoals.map(goal => ({
                name: goal.name,
                progress: (goal.currentAmount / goal.targetAmount) * 100,
                remaining: goal.targetAmount - goal.currentAmount
            }))
        };

        console.log('📈 Reporte mensual generado:', report);
        return report;
    }

    getExpensesByCategory() {
        const expenses = this.transactions.filter(t => t.type === 'expense');
        const categories = {};

        expenses.forEach(expense => {
            if (!categories[expense.category]) {
                categories[expense.category] = {
                    total: 0,
                    count: 0,
                    name: this.getCategoryName(expense.category, 'expense')
                };
            }
            categories[expense.category].total += expense.amount;
            categories[expense.category].count++;
        });

        return categories;
    }

    // ===== UTILIDADES =====

    showNotification(message, type = 'info', icon = 'fas fa-info-circle') {
        if (window.ThemeManager && typeof window.ThemeManager.createToast === 'function') {
            window.ThemeManager.createToast(message, type, icon);
        } else {
            console.log(`💰 ${type.toUpperCase()}: ${message}`);
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                timestamp: new Date().toISOString(),
                ...detail
            }
        });
        document.dispatchEvent(event);
    }

    // ===== MÉTODOS PÚBLICOS PARA INTEGRACIÓN =====

    getFinancialSummary() {
        return {
            currentMonthData: this.getCurrentMonthData(),
            totalBudgets: this.budgets.length,
            totalSavingsGoals: this.savingsGoals.length,
            totalTransactions: this.transactions.length
        };
    }

    getTransactionsByDateRange(startDate, endDate) {
        return this.transactions.filter(transaction => {
            const date = new Date(transaction.date);
            return date >= new Date(startDate) && date <= new Date(endDate);
        });
    }

    addQuickExpense(amount, category, description) {
        const transaction = {
            id: this.generateId(),
            type: 'expense',
            amount: parseFloat(amount),
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            account: 'efectivo',
            tags: [],
            createdAt: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveData();
        this.updateDashboard();
        this.checkBudgetAlerts();

        this.dispatchEvent('financesQuickExpenseAdded', { transaction });
        return transaction;
    }

    addQuickIncome(amount, category, description) {
        const transaction = {
            id: this.generateId(),
            type: 'income',
            amount: parseFloat(amount),
            category: category,
            description: description,
            date: new Date().toISOString().split('T')[0],
            account: 'principal',
            tags: [],
            createdAt: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveData();
        this.updateDashboard();

        this.dispatchEvent('financesQuickIncomeAdded', { transaction });
        return transaction;
    }
}

// Crear instancia global del módulo de finanzas
window.finances = new FinancesManager();

// Debugging helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugFinances = () => {
        console.log('🔍 Debug Info - Finances:', window.finances.getFinancialSummary());
    };
    
    window.addTestTransaction = (type = 'expense') => {
        const categories = type === 'expense' ? 
            ['food', 'transport', 'housing'] : 
            ['salary', 'freelance', 'other_income'];
        
        const category = categories[Math.floor(Math.random() * categories.length)];
        const amount = Math.floor(Math.random() * 1000) + 100;
        
        if (type === 'expense') {
            window.finances.addQuickExpense(amount, category, `Gasto de prueba - ${category}`);
        } else {
            window.finances.addQuickIncome(amount, category, `Ingreso de prueba - ${category}`);
        }
    };
    
    console.log('🛠️ Debug mode: Usa debugFinances() y addTestTransaction() para debug');
}

console.log('💰 Módulo de Finanzas cargado correctamente');