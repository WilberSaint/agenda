/**
 * Goals Module - Agenda Personal Pro
 * Módulo para gestión de metas SMART, milestones y seguimiento de objetivos
 */

class GoalsModule {
    constructor() {
        this.goals = [];
        this.milestones = [];
        this.currentEditId = null;
        this.storageKey = 'agenda-pro-goals';
        this.isInitialized = false;
        this.filters = {
            status: '',
            category: '',
            priority: '',
            showCompleted: false
        };
        
        // Estados de metas
        this.goalStatuses = {
            planning: { name: 'Planificando', color: '#6b7280', icon: 'fas fa-lightbulb' },
            active: { name: 'Activo', color: '#3b82f6', icon: 'fas fa-play' },
            paused: { name: 'Pausado', color: '#f59e0b', icon: 'fas fa-pause' },
            completed: { name: 'Completado', color: '#10b981', icon: 'fas fa-check' },
            cancelled: { name: 'Cancelado', color: '#ef4444', icon: 'fas fa-times' }
        };
        
        // Categorías de metas
        this.goalCategories = {
            personal: { name: 'Personal', color: '#8b5cf6', icon: 'fas fa-user' },
            professional: { name: 'Profesional', color: '#3b82f6', icon: 'fas fa-briefcase' },
            health: { name: 'Salud', color: '#10b981', icon: 'fas fa-heartbeat' },
            financial: { name: 'Financiero', color: '#f59e0b', icon: 'fas fa-dollar-sign' },
            education: { name: 'Educación', color: '#ec4899', icon: 'fas fa-graduation-cap' },
            relationships: { name: 'Relaciones', color: '#14b8a6', icon: 'fas fa-users' },
            hobby: { name: 'Pasatiempos', color: '#84cc16', icon: 'fas fa-palette' },
            travel: { name: 'Viajes', color: '#06b6d4', icon: 'fas fa-plane' },
            other: { name: 'Otros', color: '#64748b', icon: 'fas fa-star' }
        };
        
        console.log('🎯 Goals Module creado');
    }

    /**
     * Inicializar el módulo de metas
     */
    init() {
        if (this.isInitialized) {
            console.log('🎯 Goals Module ya estaba inicializado');
            return;
        }

        console.log('🎯 Inicializando Goals Module...');
        
        this.loadData();
        this.bindEvents();
        this.renderGoals();
        this.renderUrgentGoals();
        this.renderRecentMilestones();
        this.updateStats();
        this.setTodayDate();
        this.checkDeadlineAlerts();
        
        this.isInitialized = true;
        
        // Trigger event para notificar que el módulo está listo
        this.dispatchEvent('goalsModuleInitialized');
        
        console.log('✅ Goals Module inicializado correctamente');
    }

    /**
     * Vincular eventos del DOM
     */
    bindEvents() {
        // Formulario de metas
        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addGoal();
            });
        }

        // Formulario de milestones
        const milestoneForm = document.getElementById('milestoneForm');
        if (milestoneForm) {
            milestoneForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addMilestone();
            });
        }

        // Cambio de tipo de meta
        const goalType = document.getElementById('goalType');
        if (goalType) {
            goalType.addEventListener('change', (e) => {
                this.toggleQuantifiableFields(e.target.value);
            });
        }

        // Cambio de tipo de meta en edición
        const editGoalType = document.getElementById('editGoalType');
        if (editGoalType) {
            editGoalType.addEventListener('change', (e) => {
                this.toggleEditQuantifiableFields(e.target.value);
            });
        }

        // Filtros
        this.bindFilterEvents();

        // Botones de acción
        this.bindActionButtons();

        // Pestañas
        document.querySelectorAll('#goalsTabs button').forEach(tab => {
            tab.addEventListener('shown.bs.tab', () => {
                this.renderCurrentTab();
            });
        });
    }

    /**
     * Vincular eventos de filtros
     */
    bindFilterEvents() {
        const filterStatus = document.getElementById('filterGoalStatus');
        const filterCategory = document.getElementById('filterGoalCategory');
        const filterPriority = document.getElementById('filterGoalPriority');
        const filterCompleted = document.getElementById('filterCompletedGoals');

        if (filterStatus) {
            filterStatus.addEventListener('change', () => {
                this.filters.status = filterStatus.value;
                this.renderGoals();
            });
        }

        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.filters.category = filterCategory.value;
                this.renderGoals();
            });
        }

        if (filterPriority) {
            filterPriority.addEventListener('change', () => {
                this.filters.priority = filterPriority.value;
                this.renderGoals();
            });
        }

        if (filterCompleted) {
            filterCompleted.addEventListener('change', () => {
                this.filters.showCompleted = filterCompleted.checked;
                this.renderGoals();
            });
        }
    }

    /**
     * Vincular botones de acción
     */
    bindActionButtons() {
        const exportGoals = document.getElementById('exportGoals');
        if (exportGoals) {
            exportGoals.addEventListener('click', () => {
                this.exportGoals();
            });
        }

        const archiveCompletedGoals = document.getElementById('archiveCompletedGoals');
        if (archiveCompletedGoals) {
            archiveCompletedGoals.addEventListener('click', () => {
                this.archiveCompletedGoals();
            });
        }

        // Editar meta
        const saveEditGoal = document.getElementById('saveEditGoal');
        if (saveEditGoal) {
            saveEditGoal.addEventListener('click', () => {
                this.saveEditGoal();
            });
        }
    }

    /**
     * Mostrar/ocultar campos cuantificables
     */
    toggleQuantifiableFields(type) {
        const quantifiableSection = document.getElementById('quantifiableSection');
        if (quantifiableSection) {
            quantifiableSection.style.display = type === 'quantifiable' ? 'block' : 'none';
        }
    }

    /**
     * Mostrar/ocultar campos cuantificables en edición
     */
    toggleEditQuantifiableFields(type) {
        const editQuantifiableSection = document.getElementById('editQuantifiableSection');
        if (editQuantifiableSection) {
            editQuantifiableSection.style.display = type === 'quantifiable' ? 'block' : 'none';
        }
    }

    /**
     * Establecer fecha de hoy por defecto
     */
    setTodayDate() {
        const goalStartDate = document.getElementById('goalStartDate');
        if (goalStartDate && !goalStartDate.value) {
            const today = new Date();
            const todayStr = this.formatDateToString(today);
            goalStartDate.value = todayStr;
        }
    }

    /**
     * Generar ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Agregar nueva meta
     */
    addGoal() {
        const title = document.getElementById('goalTitle')?.value.trim();
        const description = document.getElementById('goalDescription')?.value.trim();
        const type = document.getElementById('goalType')?.value;
        const category = document.getElementById('goalCategory')?.value;
        const priority = document.getElementById('goalPriority')?.value;
        const startDate = document.getElementById('goalStartDate')?.value;
        const deadline = document.getElementById('goalDeadline')?.value;

        if (!title || !type || !category || !priority || !deadline) {
            this.showNotification('Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        // Validar que la fecha límite sea futura
        if (new Date(deadline) <= new Date()) {
            this.showNotification('La fecha límite debe ser futura', 'warning');
            return;
        }

        let currentValue = 0;
        let targetValue = 1;
        let unit = '';

        // Para metas cuantificables
        if (type === 'quantifiable') {
            currentValue = parseFloat(document.getElementById('goalCurrentValue')?.value) || 0;
            targetValue = parseFloat(document.getElementById('goalTargetValue')?.value);
            unit = document.getElementById('goalUnit')?.value.trim();

            if (!targetValue || targetValue <= 0) {
                this.showNotification('Por favor ingresa un valor objetivo válido', 'warning');
                return;
            }

            if (currentValue >= targetValue) {
                this.showNotification('El valor actual debe ser menor al objetivo', 'warning');
                return;
            }
        }

        const goal = {
            id: this.generateId(),
            title,
            description,
            type,
            category,
            priority,
            status: 'planning',
            startDate: startDate || this.formatDateToString(new Date()),
            deadline,
            currentValue,
            targetValue,
            unit,
            progress: type === 'quantifiable' ? (currentValue / targetValue) * 100 : 0,
            milestones: [],
            archived: false,
            createdAt: new Date().toISOString()
        };

        this.goals.unshift(goal);
        this.saveData();
        this.renderGoals();
        this.renderUrgentGoals();
        this.updateStats();
        this.clearGoalForm();
        this.showNotification('Meta creada correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('goalAdded', { goal });
    }

    /**
     * Agregar milestone a meta
     */
    addMilestone() {
        const goalId = document.getElementById('milestoneGoalSelect')?.value;
        const title = document.getElementById('milestoneTitle')?.value.trim();
        const description = document.getElementById('milestoneDescription')?.value.trim();
        const deadline = document.getElementById('milestoneDeadline')?.value;

        if (!goalId || !title) {
            this.showNotification('Por favor selecciona una meta y agrega un título', 'warning');
            return;
        }

        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) {
            this.showNotification('Meta no encontrada', 'error');
            return;
        }

        const milestone = {
            id: this.generateId(),
            goalId,
            title,
            description,
            deadline,
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString()
        };

        this.milestones.unshift(milestone);
        goal.milestones.push(milestone.id);
        
        this.saveData();
        this.renderGoals();
        this.renderRecentMilestones();
        this.updateMilestoneSelect();
        this.clearMilestoneForm();
        this.showNotification('Milestone agregado correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('milestoneAdded', { milestone, goal });
    }

    /**
     * Actualizar progreso de meta cuantificable
     */
    updateGoalProgress(goalId, newValue) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || goal.type !== 'quantifiable') return;

        goal.currentValue = newValue;
        goal.progress = Math.min((newValue / goal.targetValue) * 100, 100);
        
        // Verificar si se completó
        if (goal.progress >= 100 && goal.status !== 'completed') {
            goal.status = 'completed';
            goal.completedAt = new Date().toISOString();
            this.showNotification(`¡Meta "${goal.title}" completada!`, 'success');
            
            // Trigger event
            this.dispatchEvent('goalCompleted', { goal });
        }

        this.saveData();
        this.renderGoals();
        this.updateStats();
        
        // Trigger event
        this.dispatchEvent('goalProgressUpdated', { goal, newValue });
    }

    /**
     * Cambiar estado de meta
     */
    changeGoalStatus(goalId, newStatus) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const oldStatus = goal.status;
        goal.status = newStatus;
        
        if (newStatus === 'completed') {
            goal.completedAt = new Date().toISOString();
            if (goal.type === 'binary') {
                goal.progress = 100;
            }
            
            // Trigger event para meta completada
            this.dispatchEvent('goalCompleted', { goal });
        } else if (newStatus === 'active' && oldStatus === 'planning') {
            goal.startedAt = new Date().toISOString();
        }

        this.saveData();
        this.renderGoals();
        this.updateStats();
        this.showNotification(`Meta marcada como "${this.goalStatuses[newStatus].name}"`, 'info');
        
        // Trigger event
        this.dispatchEvent('goalStatusChanged', { goal, oldStatus, newStatus });
    }

    /**
     * Completar milestone
     */
    completeMilestone(milestoneId) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        milestone.completed = !milestone.completed;
        milestone.completedAt = milestone.completed ? new Date().toISOString() : null;

        const goal = this.goals.find(g => g.id === milestone.goalId);
        if (goal) {
            // Actualizar progreso de la meta basado en milestones completados
            const goalMilestones = this.milestones.filter(m => m.goalId === goal.id);
            const completedMilestones = goalMilestones.filter(m => m.completed);
            
            if (goal.type === 'binary' && goalMilestones.length > 0) {
                goal.progress = (completedMilestones.length / goalMilestones.length) * 100;
                
                // Si se completan todos los milestones, completar la meta
                if (goal.progress >= 100 && goal.status !== 'completed') {
                    goal.status = 'completed';
                    goal.completedAt = new Date().toISOString();
                    this.showNotification(`¡Meta "${goal.title}" completada!`, 'success');
                    this.dispatchEvent('goalCompleted', { goal });
                }
            }
        }

        this.saveData();
        this.renderGoals();
        this.renderRecentMilestones();
        this.showNotification(`Milestone ${milestone.completed ? 'completado' : 'marcado como pendiente'}`, 'success');
        
        // Trigger event
        this.dispatchEvent('milestoneCompleted', { milestone, goal });
    }

    /**
     * Renderizar vista de metas urgentes
     */
    renderUrgentGoals() {
        const container = document.getElementById('urgentGoalsSummary');
        if (!container) return;

        const urgentGoals = this.getUrgentGoals();
        
        if (urgentGoals.length === 0) {
            container.innerHTML = '<div class="text-center py-3 text-muted">No hay metas urgentes</div>';
            return;
        }

        container.innerHTML = `
            <h6 class="mb-3">Metas Urgentes (próximas a vencer)</h6>
            ${urgentGoals.map(goal => `
                <div class="urgent-goal-item mb-2 p-2 border rounded" onclick="goals.highlightGoal('${goal.id}')">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${this.escapeHtml(goal.title)}</div>
                            <div class="small text-muted">
                                <i class="fas fa-clock"></i> 
                                ${this.getDaysUntilDeadline(goal.deadline)} días restantes
                            </div>
                        </div>
                        <div class="goal-progress-circle">
                            ${this.createProgressCircle(goal.progress, 30)}
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    }

    /**
     * Renderizar milestones recientes
     */
    renderRecentMilestones() {
        const container = document.getElementById('recentMilestonesSummary');
        if (!container) return;

        const recentMilestones = this.getRecentMilestones();
        
        if (recentMilestones.length === 0) {
            container.innerHTML = '<div class="text-center py-3 text-muted">No hay milestones recientes</div>';
            return;
        }

        container.innerHTML = `
            <h6 class="mb-3">Milestones Recientes</h6>
            ${recentMilestones.map(milestone => {
                const goal = this.goals.find(g => g.id === milestone.goalId);
                return `
                    <div class="milestone-item mb-2 p-2 border rounded ${milestone.completed ? 'completed' : ''}">
                        <div class="d-flex align-items-center">
                            <input type="checkbox" class="form-check-input me-2" ${milestone.completed ? 'checked' : ''} 
                                   onchange="goals.completeMilestone('${milestone.id}')">
                            <div class="flex-grow-1">
                                <div class="milestone-title">${this.escapeHtml(milestone.title)}</div>
                                <div class="small text-muted">
                                    Meta: ${goal ? this.escapeHtml(goal.title) : 'Meta eliminada'}
                                    ${milestone.deadline ? ` • Vence: ${this.formatDate(milestone.deadline)}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }

    /**
     * Renderizar lista de metas
     */
    renderGoals() {
        const container = document.getElementById('goalsList');
        const emptyState = document.getElementById('emptyGoalsState');
        
        if (!container) return;
        
        const filteredGoals = this.getFilteredGoals();
        
        if (filteredGoals.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-muted">No hay metas para mostrar</div>';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = filteredGoals.map(goal => this.createGoalHTML(goal)).join('');
        
        // Actualizar select de milestones
        this.updateMilestoneSelect();
    }

    /**
     * Obtener metas filtradas
     */
    getFilteredGoals() {
        let filtered = [...this.goals];

        // Filtro por estado
        if (this.filters.status) {
            filtered = filtered.filter(g => g.status === this.filters.status);
        }

        // Filtro por categoría
        if (this.filters.category) {
            filtered = filtered.filter(g => g.category === this.filters.category);
        }

        // Filtro por prioridad
        if (this.filters.priority) {
            filtered = filtered.filter(g => g.priority === this.filters.priority);
        }

        // Filtro de completadas
        if (!this.filters.showCompleted) {
            filtered = filtered.filter(g => g.status !== 'completed' && !g.archived);
        }

        // Ordenar por prioridad y fecha límite
        filtered.sort((a, b) => {
            const priorityOrder = { urgente: 4, alta: 3, media: 2, baja: 1 };
            
            if (a.priority !== b.priority) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            
            return new Date(a.deadline) - new Date(b.deadline);
        });

        return filtered;
    }

    /**
     * Crear HTML para una meta
     */
    createGoalHTML(goal) {
        const status = this.goalStatuses[goal.status];
        const category = this.goalCategories[goal.category];
        const isUrgent = this.isGoalUrgent(goal);
        const daysLeft = this.getDaysUntilDeadline(goal.deadline);
        const goalMilestones = this.milestones.filter(m => m.goalId === goal.id);
        const completedMilestones = goalMilestones.filter(m => m.completed);

        return `
            <div class="goal-item priority-${goal.priority} ${goal.status} ${isUrgent ? 'urgent' : ''}" data-id="${goal.id}">
                <div class="d-flex align-items-start">
                    <div class="goal-progress-circle me-3">
                        ${this.createProgressCircle(goal.progress, 50)}
                    </div>
                    
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <div class="goal-title fw-bold">${this.escapeHtml(goal.title)}</div>
                                <div class="goal-meta">
                                    <span class="badge" style="background-color: ${status.color};">
                                        <i class="${status.icon} me-1"></i>${status.name}
                                    </span>
                                    <span class="badge" style="background-color: ${category.color};">
                                        <i class="${category.icon} me-1"></i>${category.name}
                                    </span>
                                    <span class="badge priority-${goal.priority}">${this.getPriorityLabel(goal.priority)}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${goal.description ? `<div class="goal-description">${this.escapeHtml(goal.description)}</div>` : ''}
                        
                        <div class="goal-details">
                            <div class="goal-dates">
                                <span><i class="fas fa-calendar-start"></i> Inicio: ${this.formatDate(goal.startDate)}</span>
                                <span><i class="fas fa-calendar-times"></i> Límite: ${this.formatDate(goal.deadline)}</span>
                                <span class="${daysLeft <= 7 ? 'text-danger' : daysLeft <= 30 ? 'text-warning' : ''}">
                                    <i class="fas fa-hourglass-half"></i> ${daysLeft} días restantes
                                </span>
                            </div>
                            
                            ${goal.type === 'quantifiable' ? `
                                <div class="goal-progress-details">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span>Progreso: ${goal.currentValue} / ${goal.targetValue} ${goal.unit}</span>
                                        <span>${goal.progress.toFixed(1)}%</span>
                                    </div>
                                    <div class="progress" style="height: 6px;">
                                        <div class="progress-bar goal-progress" style="width: ${goal.progress}%; background-color: ${status.color};"></div>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${goalMilestones.length > 0 ? `
                                <div class="goal-milestones">
                                    <small class="text-muted">
                                        <i class="fas fa-flag-checkered"></i> 
                                        Milestones: ${completedMilestones.length}/${goalMilestones.length} completados
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="goal-actions ms-3">
                        ${goal.type === 'quantifiable' && goal.status === 'active' ? `
                            <button class="btn btn-sm btn-outline-success" onclick="goals.promptUpdateProgress('${goal.id}')" title="Actualizar progreso">
                                <i class="fas fa-plus"></i>
                            </button>
                        ` : ''}
                        
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" title="Cambiar estado">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                            <ul class="dropdown-menu">
                                ${Object.entries(this.goalStatuses).map(([statusKey, statusInfo]) => `
                                    <li><a class="dropdown-item ${goal.status === statusKey ? 'active' : ''}" 
                                           onclick="goals.changeGoalStatus('${goal.id}', '${statusKey}')">
                                        <i class="${statusInfo.icon} me-2"></i>${statusInfo.name}
                                    </a></li>
                                `).join('')}
                            </ul>
                        </div>
                        
                        <button class="btn btn-sm btn-outline-primary" onclick="goals.editGoal('${goal.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="goals.duplicateGoal('${goal.id}')" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="goals.deleteGoal('${goal.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Crear círculo de progreso
     */
    createProgressCircle(percentage, size = 50) {
        const radius = (size - 6) / 2;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        
        let color = '#3b82f6';
        if (percentage >= 100) color = '#10b981';
        else if (percentage >= 75) color = '#06b6d4';
        else if (percentage >= 50) color = '#f59e0b';
        else if (percentage >= 25) color = '#ef4444';

        return `
            <svg width="${size}" height="${size}" class="progress-circle">
                <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                        fill="none" stroke="#e5e7eb" stroke-width="3"/>
                <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                        fill="none" stroke="${color}" stroke-width="3"
                        stroke-dasharray="${strokeDasharray}" 
                        stroke-dashoffset="${strokeDashoffset}"
                        transform="rotate(-90 ${size/2} ${size/2})"/>
                <text x="${size/2}" y="${size/2}" text-anchor="middle" dy=".3em" 
                      class="progress-text" style="font-size: ${size/4}px; font-weight: bold;">
                    ${Math.round(percentage)}%
                </text>
            </svg>
        `;
    }

    /**
     * Solicitar actualización de progreso
     */
    promptUpdateProgress(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal || goal.type !== 'quantifiable') return;

        const newValue = parseFloat(prompt(
            `Meta: ${goal.title}\nProgreso actual: ${goal.currentValue} ${goal.unit}\nObjetivo: ${goal.targetValue} ${goal.unit}\n\n¿Cuál es tu progreso actual?`,
            goal.currentValue
        ));
        
        if (isNaN(newValue) || newValue < 0) {
            this.showNotification('Por favor ingresa un valor válido', 'warning');
            return;
        }

        if (newValue > goal.targetValue) {
            if (confirm('El valor ingresado supera tu objetivo. ¿Quieres continuar?')) {
                this.updateGoalProgress(goalId, newValue);
            }
        } else {
            this.updateGoalProgress(goalId, newValue);
        }
    }

    /**
     * Resaltar meta específica
     */
    highlightGoal(id) {
        setTimeout(() => {
            const goalElement = document.querySelector(`[data-id="${id}"]`);
            if (goalElement) {
                goalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                goalElement.style.transform = 'scale(1.02)';
                goalElement.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.4)';
                
                setTimeout(() => {
                    goalElement.style.transform = '';
                    goalElement.style.boxShadow = '';
                }, 2000);
            }
        }, 100);
    }

    /**
     * Editar meta
     */
    editGoal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        this.currentEditId = id;
        
        // Llenar el formulario de edición
        const elements = {
            editGoalId: document.getElementById('editGoalId'),
            editGoalTitle: document.getElementById('editGoalTitle'),
            editGoalDescription: document.getElementById('editGoalDescription'),
            editGoalType: document.getElementById('editGoalType'),
            editGoalCategory: document.getElementById('editGoalCategory'),
            editGoalPriority: document.getElementById('editGoalPriority'),
            editGoalStartDate: document.getElementById('editGoalStartDate'),
            editGoalDeadline: document.getElementById('editGoalDeadline'),
            editGoalCurrentValue: document.getElementById('editGoalCurrentValue'),
            editGoalTargetValue: document.getElementById('editGoalTargetValue'),
            editGoalUnit: document.getElementById('editGoalUnit')
        };

        if (elements.editGoalId) elements.editGoalId.value = goal.id;
        if (elements.editGoalTitle) elements.editGoalTitle.value = goal.title;
        if (elements.editGoalDescription) elements.editGoalDescription.value = goal.description;
        if (elements.editGoalType) elements.editGoalType.value = goal.type;
        if (elements.editGoalCategory) elements.editGoalCategory.value = goal.category;
        if (elements.editGoalPriority) elements.editGoalPriority.value = goal.priority;
        if (elements.editGoalStartDate) elements.editGoalStartDate.value = goal.startDate;
        if (elements.editGoalDeadline) elements.editGoalDeadline.value = goal.deadline;
        if (elements.editGoalCurrentValue) elements.editGoalCurrentValue.value = goal.currentValue;
        if (elements.editGoalTargetValue) elements.editGoalTargetValue.value = goal.targetValue;
        if (elements.editGoalUnit) elements.editGoalUnit.value = goal.unit;

        // Mostrar campos cuantificables si es necesario
        this.toggleEditQuantifiableFields(goal.type);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('editGoalModal'));
        modal.show();
    }

    /**
     * Guardar cambios de edición
     */
    saveEditGoal() {
        const id = this.currentEditId;
        const goal = this.goals.find(g => g.id === id);
        
        if (!goal) return;

        const title = document.getElementById('editGoalTitle')?.value.trim();
        const description = document.getElementById('editGoalDescription')?.value.trim();
        const type = document.getElementById('editGoalType')?.value;
        const category = document.getElementById('editGoalCategory')?.value;
        const priority = document.getElementById('editGoalPriority')?.value;
        const startDate = document.getElementById('editGoalStartDate')?.value;
        const deadline = document.getElementById('editGoalDeadline')?.value;

        if (!title || !type || !category || !priority || !deadline) {
            this.showNotification('Por favor completa todos los campos obligatorios', 'warning');
            return;
        }

        goal.title = title;
        goal.description = description;
        goal.type = type;
        goal.category = category;
        goal.priority = priority;
        goal.startDate = startDate;
        goal.deadline = deadline;

        // Para metas cuantificables
        if (type === 'quantifiable') {
            const currentValue = parseFloat(document.getElementById('editGoalCurrentValue')?.value) || 0;
            const targetValue = parseFloat(document.getElementById('editGoalTargetValue')?.value);
            const unit = document.getElementById('editGoalUnit')?.value.trim();

            if (!targetValue || targetValue <= 0) {
                this.showNotification('Por favor ingresa un valor objetivo válido', 'warning');
                return;
            }

            goal.currentValue = currentValue;
            goal.targetValue = targetValue;
            goal.unit = unit;
            goal.progress = (currentValue / targetValue) * 100;
        }

        this.saveData();
        this.renderGoals();
        this.updateStats();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editGoalModal'));
        if (modal) {
            modal.hide();
        }
        
        this.showNotification('Meta actualizada correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('goalUpdated', { goal });
    }

    /**
     * Duplicar meta
     */
    duplicateGoal(id) {
        const originalGoal = this.goals.find(g => g.id === id);
        if (!originalGoal) return;

        const duplicatedGoal = {
            ...originalGoal,
            id: this.generateId(),
            title: `${originalGoal.title} (Copia)`,
            status: 'planning',
            progress: originalGoal.type === 'quantifiable' ? (originalGoal.currentValue / originalGoal.targetValue) * 100 : 0,
            milestones: [],
            archived: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.goals.unshift(duplicatedGoal);
        this.saveData();
        this.renderGoals();
        this.updateStats();
        this.showNotification('Meta duplicada correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('goalDuplicated', { originalGoal, duplicatedGoal });
    }

    /**
     * Eliminar meta
     */
    deleteGoal(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta meta? También se eliminarán sus milestones.')) {
            const goal = this.goals.find(g => g.id === id);
            
            // Eliminar milestones relacionados
            this.milestones = this.milestones.filter(m => m.goalId !== id);
            
            // Eliminar meta
            this.goals = this.goals.filter(g => g.id !== id);
            
            this.saveData();
            this.renderGoals();
            this.renderRecentMilestones();
            this.updateStats();
            this.updateMilestoneSelect();
            this.showNotification('Meta eliminada', 'info');
            
            // Trigger event
            this.dispatchEvent('goalDeleted', { goal });
        }
    }

    /**
     * Archivar metas completadas
     */
    archiveCompletedGoals() {
        const completedGoals = this.goals.filter(g => g.status === 'completed' && !g.archived);
        
        if (completedGoals.length === 0) {
            this.showNotification('No hay metas completadas para archivar', 'info');
            return;
        }

        if (confirm(`¿Archivar ${completedGoals.length} meta(s) completada(s)?`)) {
            completedGoals.forEach(goal => {
                goal.archived = true;
            });
            
            this.saveData();
            this.renderGoals();
            this.updateStats();
            this.showNotification(`${completedGoals.length} meta(s) archivada(s)`, 'success');
            
            // Trigger event
            this.dispatchEvent('goalsArchived', { count: completedGoals.length, goals: completedGoals });
        }
    }

    /**
     * Exportar metas
     */
    exportGoals() {
        const data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            goals: this.goals,
            milestones: this.milestones
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `metas-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Metas exportadas correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('dataExported', { goalCount: this.goals.length, milestoneCount: this.milestones.length });
    }

    /**
     * Actualizar estadísticas
     */
    updateStats() {
        const totalGoals = this.goals.filter(g => !g.archived).length;
        const activeGoals = this.goals.filter(g => g.status === 'active').length;
        const completedGoals = this.goals.filter(g => g.status === 'completed').length;
        const urgentGoals = this.getUrgentGoals().length;

        const elements = {
            totalGoals: document.getElementById('totalGoals'),
            activeGoals: document.getElementById('activeGoals'),
            completedGoals: document.getElementById('completedGoals'),
            urgentGoals: document.getElementById('urgentGoals')
        };

        if (elements.totalGoals) elements.totalGoals.textContent = totalGoals;
        if (elements.activeGoals) elements.activeGoals.textContent = activeGoals;
        if (elements.completedGoals) elements.completedGoals.textContent = completedGoals;
        if (elements.urgentGoals) elements.urgentGoals.textContent = urgentGoals;

        // Trigger event
        this.dispatchEvent('statsUpdated', { totalGoals, activeGoals, completedGoals, urgentGoals });
    }

    /**
     * Actualizar select de milestones
     */
    updateMilestoneSelect() {
        const select = document.getElementById('milestoneGoalSelect');
        if (!select) return;

        const activeGoals = this.goals.filter(g => g.status === 'active' || g.status === 'planning');
        
        select.innerHTML = '<option value="">Seleccionar meta...</option>' +
            activeGoals.map(goal => `
                <option value="${goal.id}">${this.escapeHtml(goal.title)}</option>
            `).join('');
    }

    /**
     * Renderizar pestaña actual
     */
    renderCurrentTab() {
        // Por ahora solo tenemos una pestaña, pero preparado para futuras expansiones
        this.renderGoals();
    }

    /**
     * Obtener metas urgentes
     */
    getUrgentGoals() {
        const now = new Date();
        return this.goals.filter(goal => {
            if (goal.status === 'completed' || goal.archived) return false;
            const deadline = new Date(goal.deadline);
            const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
            return daysLeft <= 30 && daysLeft >= 0;
        });
    }

    /**
     * Obtener milestones recientes
     */
    getRecentMilestones() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return this.milestones
            .filter(milestone => {
                const createdDate = new Date(milestone.createdAt);
                return createdDate >= thirtyDaysAgo;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
    }

    /**
     * Verificar alertas de fechas límite
     */
    checkDeadlineAlerts() {
        const urgentGoals = this.getUrgentGoals();
        const overdueGoals = this.getOverdueGoals();
        
        if (overdueGoals.length > 0) {
            setTimeout(() => {
                this.showNotification(`Tienes ${overdueGoals.length} meta(s) vencida(s)`, 'danger');
            }, 2000);
        } else if (urgentGoals.length > 0) {
            setTimeout(() => {
                this.showNotification(`Tienes ${urgentGoals.length} meta(s) próxima(s) a vencer`, 'warning');
            }, 2000);
        }
    }

    /**
     * Obtener metas vencidas
     */
    getOverdueGoals() {
        const now = new Date();
        return this.goals.filter(goal => {
            if (goal.status === 'completed' || goal.archived) return false;
            const deadline = new Date(goal.deadline);
            return deadline < now;
        });
    }

    /**
     * Verificar si una meta es urgente
     */
    isGoalUrgent(goal) {
        if (goal.status === 'completed' || goal.archived) return false;
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft >= 0;
    }

    /**
     * Obtener días hasta fecha límite
     */
    getDaysUntilDeadline(deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Limpiar formularios
     */
    clearGoalForm() {
        const form = document.getElementById('goalForm');
        if (form) {
            form.reset();
        }

        const quantifiableSection = document.getElementById('quantifiableSection');
        if (quantifiableSection) {
            quantifiableSection.style.display = 'none';
        }

        this.setTodayDate();
    }

    clearMilestoneForm() {
        const form = document.getElementById('milestoneForm');
        if (form) {
            form.reset();
        }
    }

    /**
     * Métodos helper
     */
    getPriorityLabel(priority) {
        const labels = {
            urgente: 'Urgente',
            alta: 'Alta',
            media: 'Media',
            baja: 'Baja'
        };
        return labels[priority] || priority;
    }

    formatDateToString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Cargar datos del localStorage
     */
    loadData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.goals = data.goals || [];
                this.milestones = data.milestones || [];
            }
            console.log(`🎯 Datos cargados: ${this.goals.length} metas, ${this.milestones.length} milestones`);
        } catch (error) {
            console.error('Error cargando datos de metas:', error);
            this.showNotification('Error al cargar las metas', 'danger');
        }
    }

    /**
     * Guardar datos en localStorage
     */
    saveData() {
        try {
            const data = {
                goals: this.goals,
                milestones: this.milestones
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log(`🎯 Datos guardados: ${this.goals.length} metas, ${this.milestones.length} milestones`);
        } catch (error) {
            console.error('Error guardando datos de metas:', error);
            this.showNotification('Error al guardar las metas', 'danger');
        }
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info', icon = null) {
        if (window.ThemeManager && typeof window.ThemeManager.createToast === 'function') {
            const iconClass = icon || this.getNotificationIcon(type);
            window.ThemeManager.createToast(message, type, iconClass);
        } else {
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Obtener ícono para notificación
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            danger: 'fas fa-times-circle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    /**
     * Disparar evento personalizado
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`goals${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
            detail: {
                module: 'goals',
                ...detail
            }
        });
        
        document.dispatchEvent(event);
        console.log(`📢 Evento disparado: ${eventName}`, detail);
    }

    /**
     * Obtener estadísticas del módulo
     */
    getStats() {
        const totalGoals = this.goals.filter(g => !g.archived).length;
        const activeGoals = this.goals.filter(g => g.status === 'active').length;
        const completedGoals = this.goals.filter(g => g.status === 'completed').length;
        const urgentGoals = this.getUrgentGoals().length;
        const overdueGoals = this.getOverdueGoals().length;
        const avgProgress = totalGoals > 0 ? 
            this.goals.filter(g => !g.archived).reduce((sum, g) => sum + g.progress, 0) / totalGoals : 0;

        return {
            totalGoals,
            activeGoals,
            completedGoals,
            urgentGoals,
            overdueGoals,
            avgProgress: Math.round(avgProgress),
            totalMilestones: this.milestones.length,
            completedMilestones: this.milestones.filter(m => m.completed).length,
            byCategory: this.getGoalsByCategory(),
            byStatus: this.getGoalsByStatus()
        };
    }

    /**
     * Obtener metas por categoría
     */
    getGoalsByCategory() {
        const breakdown = {};
        Object.keys(this.goalCategories).forEach(category => {
            breakdown[category] = this.goals.filter(g => g.category === category && !g.archived).length;
        });
        return breakdown;
    }

    /**
     * Obtener metas por estado
     */
    getGoalsByStatus() {
        const breakdown = {};
        Object.keys(this.goalStatuses).forEach(status => {
            breakdown[status] = this.goals.filter(g => g.status === status && !g.archived).length;
        });
        return breakdown;
    }

    /**
     * Resetear módulo
     */
    reset() {
        if (confirm('¿Estás seguro de que quieres eliminar todas las metas y milestones?')) {
            this.goals = [];
            this.milestones = [];
            this.saveData();
            this.renderGoals();
            this.renderUrgentGoals();
            this.renderRecentMilestones();
            this.updateStats();
            this.updateMilestoneSelect();
            this.showNotification('Todas las metas han sido eliminadas', 'info');
            
            // Trigger event
            this.dispatchEvent('moduleReset');
        }
    }

    /**
     * Importar metas desde archivo JSON
     */
    importGoals(goalsData) {
        try {
            if (Array.isArray(goalsData.goals)) {
                const validGoals = goalsData.goals.filter(goal => 
                    goal.id && goal.title && goal.type && goal.category && goal.priority
                );
                
                this.goals = [...this.goals, ...validGoals];
            }
            
            if (Array.isArray(goalsData.milestones)) {
                const validMilestones = goalsData.milestones.filter(milestone => 
                    milestone.id && milestone.title && milestone.goalId
                );
                
                this.milestones = [...this.milestones, ...validMilestones];
            }
            
            this.saveData();
            this.renderGoals();
            this.renderUrgentGoals();
            this.renderRecentMilestones();
            this.updateStats();
            this.updateMilestoneSelect();
            
            const totalImported = (goalsData.goals?.length || 0) + (goalsData.milestones?.length || 0);
            this.showNotification(`${totalImported} elementos importados correctamente`, 'success');
            
            // Trigger event
            this.dispatchEvent('dataImported', { goals: goalsData.goals?.length || 0, milestones: goalsData.milestones?.length || 0 });
        } catch (error) {
            console.error('Error importando metas:', error);
            this.showNotification('Error al importar las metas', 'danger');
        }
    }

    /**
     * Destruir módulo (cleanup)
     */
    destroy() {
        console.log('🎯 Goals Module destruido');
        this.isInitialized = false;
    }
}

// Crear instancia global del módulo de metas
window.goals = new GoalsModule();

// Compatibilidad con código existente
window.GoalsModule = GoalsModule;

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.goals && !window.goals.isInitialized) {
        // Solo inicializar si el módulo está activo
        setTimeout(() => {
            if (document.getElementById('module-goals')) {
                window.goals.init();
            }
        }, 500);
    }
});

// Event listeners para integración con otros módulos
document.addEventListener('goalsGoalCompleted', (e) => {
    console.log('🎉 Meta completada:', e.detail.goal.title);
});

document.addEventListener('goalsMilestoneCompleted', (e) => {
    console.log('🏁 Milestone completado:', e.detail.milestone.title);
});

document.addEventListener('goalsModuleInitialized', () => {
    console.log('✅ Módulo de Metas completamente inicializado');
});

// Debugging helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugGoals = () => {
        console.log('🔍 Debug Info - Goals:', window.goals.getStats());
        console.log('🔍 Metas:', window.goals.goals.length);
        console.log('🔍 Milestones:', window.goals.milestones.length);
    };
    
    console.log('🛠️ Debug mode: Usa debugGoals() para ver información del módulo');
}

console.log('🎯 Goals Module cargado correctamente');