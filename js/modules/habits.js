/**
 * Habits Module - Agenda Personal Pro
 * Módulo para manejo de hábitos diarios, tracking y streaks
 */

class HabitsModule {
    constructor() {
        this.habits = [];
        this.habitLogs = []; // Registro diario de hábitos
        this.currentEditId = null;
        this.storageKey = 'agenda-pro-habits';
        this.logsStorageKey = 'agenda-pro-habit-logs';
        this.isInitialized = false;
        this.filters = {
            category: '',
            difficulty: '',
            showArchived: false
        };
        
        console.log('🔄 Habits Module creado');
    }

    /**
     * Inicializar el módulo de hábitos
     */
    init() {
        if (this.isInitialized) {
            console.log('🔄 Habits Module ya estaba inicializado');
            return;
        }

        console.log('🔄 Inicializando Habits Module...');
        
        this.loadHabits();
        this.loadHabitLogs();
        this.bindEvents();
        this.renderHabits();
        this.renderTodayProgress();
        this.updateStats();
        this.checkMissedHabits();
        
        this.isInitialized = true;
        
        // Trigger event para notificar que el módulo está listo
        this.dispatchEvent('habitsModuleInitialized');
        
        console.log('✅ Habits Module inicializado correctamente');
    }

    /**
     * Métodos helper para manejar fechas locales
     */
    createLocalDate(dateStr) {
        if (!dateStr) return null;
        
        if (dateStr.includes('T')) {
            return new Date(dateStr);
        }
        
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
        return new Date(year, month - 1, day);
    }

    formatDateToString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getTodayString() {
        return this.formatDateToString(new Date());
    }

    /**
     * Vincular eventos del DOM
     */
    bindEvents() {
        // Formulario principal
        const habitForm = document.getElementById('habitForm');
        if (habitForm) {
            habitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addHabit();
            });
        }

        // Formulario de edición
        const saveEditHabit = document.getElementById('saveEditHabit');
        if (saveEditHabit) {
            saveEditHabit.addEventListener('click', () => {
                this.saveEditHabit();
            });
        }

        // Filtros
        this.bindFilterEvents();

        // Botones de acción
        this.bindActionButtons();
    }

    /**
     * Vincular eventos de filtros
     */
    bindFilterEvents() {
        const filterCategory = document.getElementById('filterHabitCategory');
        const filterDifficulty = document.getElementById('filterHabitDifficulty');
        const filterArchived = document.getElementById('filterArchivedHabits');

        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.filters.category = filterCategory.value;
                this.renderHabits();
            });
        }

        if (filterDifficulty) {
            filterDifficulty.addEventListener('change', () => {
                this.filters.difficulty = filterDifficulty.value;
                this.renderHabits();
            });
        }

        if (filterArchived) {
            filterArchived.addEventListener('change', () => {
                this.filters.showArchived = filterArchived.checked;
                this.renderHabits();
            });
        }
    }

    /**
     * Vincular botones de acción
     */
    bindActionButtons() {
        const archiveCompleted = document.getElementById('archiveCompletedHabits');
        if (archiveCompleted) {
            archiveCompleted.addEventListener('click', () => {
                this.archiveCompletedHabits();
            });
        }

        const exportHabits = document.getElementById('exportHabits');
        if (exportHabits) {
            exportHabits.addEventListener('click', () => {
                this.exportHabitsData();
            });
        }
    }

    /**
     * Generar ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Agregar nuevo hábito
     */
    addHabit() {
        const name = document.getElementById('habitName')?.value.trim();
        const description = document.getElementById('habitDescription')?.value.trim();
        const category = document.getElementById('habitCategory')?.value;
        const difficulty = document.getElementById('habitDifficulty')?.value;
        const frequency = document.getElementById('habitFrequency')?.value;
        const targetValue = parseInt(document.getElementById('habitTargetValue')?.value) || 1;
        const unit = document.getElementById('habitUnit')?.value.trim() || 'veces';
        const icon = document.getElementById('habitIcon')?.value || 'fas fa-star';
        const color = document.getElementById('habitColor')?.value || '#60a5fa';

        if (!name) {
            this.showNotification('Por favor ingresa un nombre para el hábito', 'warning');
            return;
        }

        const habit = {
            id: this.generateId(),
            name,
            description,
            category,
            difficulty,
            frequency,
            targetValue,
            unit,
            icon,
            color,
            archived: false,
            createdAt: new Date().toISOString(),
            currentStreak: 0,
            bestStreak: 0,
            totalCompletions: 0
        };

        this.habits.unshift(habit);
        this.saveHabits();
        this.renderHabits();
        this.renderTodayProgress();
        this.updateStats();
        this.clearForm();
        this.showNotification('Hábito agregado correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('habitAdded', { habit });
    }

    /**
     * Limpiar formulario
     */
    clearForm() {
        const habitForm = document.getElementById('habitForm');
        if (habitForm) {
            habitForm.reset();
        }
    }

    /**
     * Renderizar progreso de hoy
     */
    renderTodayProgress() {
        const container = document.getElementById('todayHabitsProgress');
        if (!container) return;

        const today = this.getTodayString();
        const activeHabits = this.habits.filter(h => !h.archived);
        
        if (activeHabits.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-plus-circle fa-2x mb-2"></i>
                    <p>No hay hábitos activos</p>
                    <p class="small">Agrega tu primer hábito para comenzar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="today-habits-header mb-3">
                <h6><i class="fas fa-calendar-day me-2"></i>Hábitos de Hoy</h6>
                <small class="text-muted">${new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                })}</small>
            </div>
            <div class="today-habits-list">
                ${activeHabits.map(habit => {
                    const todayLog = this.getTodayLogForHabit(habit.id);
                    const completedValue = todayLog?.value || 0;
                    const isCompleted = completedValue >= habit.targetValue;
                    const progressPercent = Math.min((completedValue / habit.targetValue) * 100, 100);
                    
                    return `
                        <div class="habit-today-item ${isCompleted ? 'completed' : ''}" style="border-left-color: ${habit.color}">
                            <div class="d-flex align-items-center">
                                <div class="habit-icon me-3" style="color: ${habit.color}">
                                    <i class="${habit.icon}"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="habit-name">${this.escapeHtml(habit.name)}</div>
                                    <div class="habit-progress">
                                        <div class="progress mb-1" style="height: 6px;">
                                            <div class="progress-bar" style="width: ${progressPercent}%; background-color: ${habit.color};"></div>
                                        </div>
                                        <small class="text-muted">
                                            ${completedValue}/${habit.targetValue} ${habit.unit}
                                            ${isCompleted ? '✅' : ''}
                                        </small>
                                    </div>
                                </div>
                                <div class="habit-actions">
                                    <button class="btn btn-sm btn-outline-success" onclick="habits.incrementHabit('${habit.id}')" title="Incrementar">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" onclick="habits.decrementHabit('${habit.id}')" title="Decrementar">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Renderizar lista de hábitos
     */
    renderHabits() {
        const container = document.getElementById('habitsList');
        if (!container) return;

        const filteredHabits = this.getFilteredHabits();
        
        if (filteredHabits.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-search fa-3x mb-3"></i>
                    <h5>No hay hábitos para mostrar</h5>
                    <p>Ajusta los filtros o agrega nuevos hábitos</p>
                </div>
            `;
            return;
        }

        // Ordenar hábitos
        filteredHabits.sort((a, b) => {
            if (a.archived !== b.archived) {
                return a.archived - b.archived;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        container.innerHTML = filteredHabits.map(habit => this.createHabitHTML(habit)).join('');
    }

    /**
     * Crear HTML para un hábito
     */
    createHabitHTML(habit) {
        const streakData = this.calculateStreak(habit.id);
        const completionRate = this.getCompletionRate(habit.id, 30); // Últimos 30 días
        const todayLog = this.getTodayLogForHabit(habit.id);
        const todayCompleted = (todayLog?.value || 0) >= habit.targetValue;
        
        return `
            <div class="habit-item ${habit.archived ? 'archived' : ''}" data-id="${habit.id}">
                <div class="habit-header" style="border-left-color: ${habit.color}">
                    <div class="d-flex align-items-center">
                        <div class="habit-icon me-3" style="color: ${habit.color}">
                            <i class="${habit.icon} fa-lg"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="habit-name">${this.escapeHtml(habit.name)}</div>
                            <div class="habit-meta">
                                <span class="badge category-${habit.category} me-2">${this.getCategoryLabel(habit.category)}</span>
                                <span class="badge difficulty-${habit.difficulty}">${this.getDifficultyLabel(habit.difficulty)}</span>
                            </div>
                        </div>
                        <div class="today-status ${todayCompleted ? 'completed' : ''}">
                            ${todayCompleted ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="far fa-circle text-muted"></i>'}
                        </div>
                    </div>
                </div>
                
                <div class="habit-body">
                    ${habit.description ? `<p class="habit-description">${this.escapeHtml(habit.description)}</p>` : ''}
                    
                    <div class="habit-stats row text-center mb-3">
                        <div class="col-3">
                            <div class="stat-number text-warning">${streakData.current}</div>
                            <div class="stat-label">Racha Actual</div>
                        </div>
                        <div class="col-3">
                            <div class="stat-number text-success">${streakData.best}</div>
                            <div class="stat-label">Mejor Racha</div>
                        </div>
                        <div class="col-3">
                            <div class="stat-number text-info">${completionRate}%</div>
                            <div class="stat-label">Cumplimiento</div>
                        </div>
                        <div class="col-3">
                            <div class="stat-number text-primary">${habit.totalCompletions}</div>
                            <div class="stat-label">Total</div>
                        </div>
                    </div>
                    
                    <div class="habit-frequency mb-3">
                        <small class="text-muted">
                            <i class="fas fa-repeat me-1"></i>
                            ${this.getFrequencyLabel(habit.frequency)} • 
                            Meta: ${habit.targetValue} ${habit.unit}
                        </small>
                    </div>
                    
                    <div class="habit-calendar mb-3">
                        ${this.renderHabitCalendar(habit.id)}
                    </div>
                </div>
                
                <div class="habit-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="habits.editHabit('${habit.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="habits.viewHabitStats('${habit.id}')" title="Estadísticas">
                        <i class="fas fa-chart-line"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="habits.toggleArchiveHabit('${habit.id}')" title="${habit.archived ? 'Activar' : 'Archivar'}">
                        <i class="fas fa-${habit.archived ? 'undo' : 'archive'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="habits.deleteHabit('${habit.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar mini calendario de hábito (últimos 30 días)
     */
    renderHabitCalendar(habitId) {
        const days = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            days.push(date);
        }
        
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return '';
        
        return `
            <div class="habit-calendar-grid">
                ${days.map(date => {
                    const dateStr = this.formatDateToString(date);
                    const log = this.habitLogs.find(l => l.habitId === habitId && l.date === dateStr);
                    const completed = log && log.value >= habit.targetValue;
                    const hasValue = log && log.value > 0;
                    
                    return `
                        <div class="calendar-day ${completed ? 'completed' : hasValue ? 'partial' : ''}" 
                             title="${date.toLocaleDateString('es-ES')} - ${log ? log.value : 0}/${habit.targetValue} ${habit.unit}">
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Incrementar hábito de hoy
     */
    incrementHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = this.getTodayString();
        let todayLog = this.habitLogs.find(l => l.habitId === habitId && l.date === today);
        
        if (!todayLog) {
            todayLog = {
                id: this.generateId(),
                habitId,
                date: today,
                value: 0,
                notes: '',
                createdAt: new Date().toISOString()
            };
            this.habitLogs.push(todayLog);
        }
        
        todayLog.value = Math.min(todayLog.value + 1, habit.targetValue * 2); // Permitir hasta 2x el objetivo
        todayLog.updatedAt = new Date().toISOString();
        
        // Actualizar estadísticas del hábito
        this.updateHabitStats(habitId);
        
        this.saveHabitLogs();
        this.renderTodayProgress();
        this.renderHabits();
        this.updateStats();
        
        // Trigger event
        this.dispatchEvent('habitIncremented', { habit, log: todayLog });
        
        // Mostrar notificación si se completó el objetivo
        if (todayLog.value === habit.targetValue) {
            this.showNotification(`¡${habit.name} completado hoy!`, 'success');
        }
    }

    /**
     * Decrementar hábito de hoy
     */
    decrementHabit(habitId) {
        const today = this.getTodayString();
        const todayLog = this.habitLogs.find(l => l.habitId === habitId && l.date === today);
        
        if (todayLog && todayLog.value > 0) {
            todayLog.value--;
            todayLog.updatedAt = new Date().toISOString();
            
            // Actualizar estadísticas del hábito
            this.updateHabitStats(habitId);
            
            this.saveHabitLogs();
            this.renderTodayProgress();
            this.renderHabits();
            this.updateStats();
            
            const habit = this.habits.find(h => h.id === habitId);
            
            // Trigger event
            this.dispatchEvent('habitDecremented', { habit, log: todayLog });
        }
    }

    /**
     * Actualizar estadísticas de un hábito
     */
    updateHabitStats(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const streakData = this.calculateStreak(habitId);
        habit.currentStreak = streakData.current;
        habit.bestStreak = streakData.best;
        
        // Calcular total de completaciones
        const habitLogs = this.habitLogs.filter(l => l.habitId === habitId);
        habit.totalCompletions = habitLogs.filter(l => l.value >= habit.targetValue).length;
        
        this.saveHabits();
    }

    /**
     * Calcular racha de un hábito
     */
    calculateStreak(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return { current: 0, best: 0 };

        const logs = this.habitLogs
            .filter(l => l.habitId === habitId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        const today = new Date();
        let checkDate = new Date(today);
        
        // Calcular racha actual
        for (let i = 0; i < 365; i++) { // Máximo 1 año hacia atrás
            const dateStr = this.formatDateToString(checkDate);
            const log = logs.find(l => l.date === dateStr);
            
            if (log && log.value >= habit.targetValue) {
                if (i === 0 || tempStreak > 0) { // Solo continuar si es hoy o hay racha continua
                    tempStreak++;
                    if (i < 30) currentStreak = tempStreak; // Solo contar últimos 30 días para racha actual
                }
            } else {
                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak;
                }
                if (i === 0) {
                    // Si hoy no está completado, la racha actual es 0
                    currentStreak = 0;
                }
                tempStreak = 0;
            }
            
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
        }
        
        return { current: currentStreak, best: bestStreak };
    }

    /**
     * Obtener tasa de cumplimiento
     */
    getCompletionRate(habitId, days = 30) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return 0;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const relevantLogs = this.habitLogs.filter(l => {
            if (l.habitId !== habitId) return false;
            const logDate = this.createLocalDate(l.date);
            return logDate >= startDate;
        });
        
        const completedDays = relevantLogs.filter(l => l.value >= habit.targetValue).length;
        const possibleDays = Math.min(days, Math.ceil((new Date() - this.createLocalDate(habit.createdAt.split('T')[0])) / (1000 * 60 * 60 * 24)) + 1);
        
        return possibleDays > 0 ? Math.round((completedDays / possibleDays) * 100) : 0;
    }

    /**
     * Obtener log de hoy para un hábito
     */
    getTodayLogForHabit(habitId) {
        const today = this.getTodayString();
        return this.habitLogs.find(l => l.habitId === habitId && l.date === today);
    }

    /**
     * Obtener hábitos filtrados
     */
    getFilteredHabits() {
        return this.habits.filter(habit => {
            if (!this.filters.showArchived && habit.archived) return false;
            if (this.filters.category && habit.category !== this.filters.category) return false;
            if (this.filters.difficulty && habit.difficulty !== this.filters.difficulty) return false;
            return true;
        });
    }

    /**
     * Editar hábito
     */
    editHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        this.currentEditId = id;
        
        // Llenar el formulario de edición
        const elements = {
            editHabitId: document.getElementById('editHabitId'),
            editHabitName: document.getElementById('editHabitName'),
            editHabitDescription: document.getElementById('editHabitDescription'),
            editHabitCategory: document.getElementById('editHabitCategory'),
            editHabitDifficulty: document.getElementById('editHabitDifficulty'),
            editHabitFrequency: document.getElementById('editHabitFrequency'),
            editHabitTargetValue: document.getElementById('editHabitTargetValue'),
            editHabitUnit: document.getElementById('editHabitUnit'),
            editHabitIcon: document.getElementById('editHabitIcon'),
            editHabitColor: document.getElementById('editHabitColor')
        };

        if (elements.editHabitId) elements.editHabitId.value = habit.id;
        if (elements.editHabitName) elements.editHabitName.value = habit.name;
        if (elements.editHabitDescription) elements.editHabitDescription.value = habit.description;
        if (elements.editHabitCategory) elements.editHabitCategory.value = habit.category;
        if (elements.editHabitDifficulty) elements.editHabitDifficulty.value = habit.difficulty;
        if (elements.editHabitFrequency) elements.editHabitFrequency.value = habit.frequency;
        if (elements.editHabitTargetValue) elements.editHabitTargetValue.value = habit.targetValue;
        if (elements.editHabitUnit) elements.editHabitUnit.value = habit.unit;
        if (elements.editHabitIcon) elements.editHabitIcon.value = habit.icon;
        if (elements.editHabitColor) elements.editHabitColor.value = habit.color;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('editHabitModal'));
        modal.show();
    }

    /**
     * Guardar cambios de edición
     */
    saveEditHabit() {
        const id = this.currentEditId;
        const habit = this.habits.find(h => h.id === id);
        
        if (!habit) return;

        const name = document.getElementById('editHabitName')?.value.trim();
        if (!name) {
            this.showNotification('El nombre es requerido', 'warning');
            return;
        }

        habit.name = name;
        habit.description = document.getElementById('editHabitDescription')?.value.trim();
        habit.category = document.getElementById('editHabitCategory')?.value;
        habit.difficulty = document.getElementById('editHabitDifficulty')?.value;
        habit.frequency = document.getElementById('editHabitFrequency')?.value;
        habit.targetValue = parseInt(document.getElementById('editHabitTargetValue')?.value) || 1;
        habit.unit = document.getElementById('editHabitUnit')?.value.trim() || 'veces';
        habit.icon = document.getElementById('editHabitIcon')?.value || 'fas fa-star';
        habit.color = document.getElementById('editHabitColor')?.value || '#60a5fa';
        habit.updatedAt = new Date().toISOString();

        this.saveHabits();
        this.renderHabits();
        this.renderTodayProgress();
        this.updateStats();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editHabitModal'));
        if (modal) {
            modal.hide();
        }
        
        this.showNotification('Hábito actualizado correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('habitUpdated', { habit });
    }

    /**
     * Alternar archivo de hábito
     */
    toggleArchiveHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (habit) {
            habit.archived = !habit.archived;
            habit.updatedAt = new Date().toISOString();
            
            this.saveHabits();
            this.renderHabits();
            this.renderTodayProgress();
            this.updateStats();
            
            const action = habit.archived ? 'archivado' : 'activado';
            this.showNotification(`Hábito ${action}`, 'info');
            
            // Trigger event
            this.dispatchEvent('habitArchiveToggled', { habit });
        }
    }

    /**
     * Eliminar hábito
     */
    deleteHabit(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este hábito? También se eliminará todo su historial.')) {
            const habit = this.habits.find(h => h.id === id);
            
            // Eliminar hábito
            this.habits = this.habits.filter(h => h.id !== id);
            
            // Eliminar logs del hábito
            this.habitLogs = this.habitLogs.filter(l => l.habitId !== id);
            
            this.saveHabits();
            this.saveHabitLogs();
            this.renderHabits();
            this.renderTodayProgress();
            this.updateStats();
            this.showNotification('Hábito eliminado', 'info');
            
            // Trigger event
            this.dispatchEvent('habitDeleted', { habit });
        }
    }

    /**
     * Ver estadísticas detalladas de un hábito
     */
    viewHabitStats(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        // Implementar modal de estadísticas detalladas
        this.showNotification('Estadísticas detalladas próximamente', 'info');
    }

    /**
     * Archivar hábitos completados
     */
    archiveCompletedHabits() {
        const completedHabits = this.habits.filter(h => {
            if (h.archived) return false;
            const completionRate = this.getCompletionRate(h.id, 30);
            return completionRate >= 90; // 90% o más de cumplimiento
        });

        if (completedHabits.length === 0) {
            this.showNotification('No hay hábitos para archivar', 'info');
            return;
        }

        if (confirm(`¿Archivar ${completedHabits.length} hábito(s) con alta tasa de cumplimiento?`)) {
            completedHabits.forEach(habit => {
                habit.archived = true;
                habit.updatedAt = new Date().toISOString();
            });
            
            this.saveHabits();
            this.renderHabits();
            this.renderTodayProgress();
            this.updateStats();
            this.showNotification(`${completedHabits.length} hábito(s) archivado(s)`, 'success');
            
            // Trigger event
            this.dispatchEvent('habitsArchived', { count: completedHabits.length, habits: completedHabits });
        }
    }

    /**
     * Exportar datos de hábitos
     */
    exportHabitsData() {
        const data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            habits: this.habits,
            habitLogs: this.habitLogs
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `habits-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Respaldo de hábitos descargado', 'success');
        
        // Trigger event
        this.dispatchEvent('habitsExported', { count: this.habits.length });
    }

    /**
     * Verificar hábitos perdidos
     */
    checkMissedHabits() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.formatDateToString(yesterday);
        
        const activeHabits = this.habits.filter(h => !h.archived);
        const missedHabits = activeHabits.filter(habit => {
            const log = this.habitLogs.find(l => l.habitId === habit.id && l.date === yesterdayStr);
            return !log || log.value < habit.targetValue;
        });
        
        if (missedHabits.length > 0) {
            setTimeout(() => {
                this.showNotification(`${missedHabits.length} hábito(s) no completado(s) ayer`, 'warning');
            }, 3000);
        }
    }

    /**
     * Actualizar estadísticas generales
     */
    updateStats() {
        const totalHabits = this.habits.filter(h => !h.archived).length;
        const todayCompleted = this.habits.filter(h => {
            if (h.archived) return false;
            const todayLog = this.getTodayLogForHabit(h.id);
            return todayLog && todayLog.value >= h.targetValue;
        }).length;
        const todayPending = totalHabits - todayCompleted;
        const averageStreak = totalHabits > 0 ? 
            Math.round(this.habits.filter(h => !h.archived).reduce((sum, h) => sum + h.currentStreak, 0) / totalHabits) : 0;

        const elements = {
            totalHabits: document.getElementById('totalHabits'),
            todayCompleted: document.getElementById('todayCompletedHabits'),
            todayPending: document.getElementById('todayPendingHabits'),
            averageStreak: document.getElementById('averageStreak')
        };

        if (elements.totalHabits) elements.totalHabits.textContent = totalHabits;
        if (elements.todayCompleted) elements.todayCompleted.textContent = todayCompleted;
        if (elements.todayPending) elements.todayPending.textContent = todayPending;
        if (elements.averageStreak) elements.averageStreak.textContent = averageStreak;

        // Trigger event
        this.dispatchEvent('habitsStatsUpdated', { totalHabits, todayCompleted, todayPending, averageStreak });
    }

    /**
     * Obtener etiquetas descriptivas
     */
    getCategoryLabel(category) {
        const labels = {
            health: 'Salud',
            fitness: 'Fitness',
            productivity: 'Productividad',
            learning: 'Aprendizaje',
            social: 'Social',
            spiritual: 'Espiritual',
            creative: 'Creativo',
            financial: 'Financiero',
            other: 'Otro'
        };
        return labels[category] || category;
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            easy: 'Fácil',
            medium: 'Medio',
            hard: 'Difícil'
        };
        return labels[difficulty] || difficulty;
    }

    getFrequencyLabel(frequency) {
        const labels = {
            daily: 'Diario',
            weekly: 'Semanal',
            workdays: 'Días laborales',
            weekends: 'Fines de semana'
        };
        return labels[frequency] || frequency;
    }

    /**
     * Cargar hábitos del localStorage
     */
    loadHabits() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.habits = saved ? JSON.parse(saved) : [];
            console.log(`📥 Hábitos cargados: ${this.habits.length}`);
        } catch (error) {
            console.error('Error cargando hábitos:', error);
            this.habits = [];
            this.showNotification('Error al cargar los hábitos', 'danger');
        }
    }

    /**
     * Guardar hábitos en localStorage
     */
    saveHabits() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.habits));
            console.log(`💾 Hábitos guardados: ${this.habits.length}`);
        } catch (error) {
            console.error('Error guardando hábitos:', error);
            this.showNotification('Error al guardar los hábitos', 'danger');
        }
    }

    /**
     * Cargar logs de hábitos del localStorage
     */
    loadHabitLogs() {
        try {
            const saved = localStorage.getItem(this.logsStorageKey);
            this.habitLogs = saved ? JSON.parse(saved) : [];
            console.log(`📥 Logs de hábitos cargados: ${this.habitLogs.length}`);
        } catch (error) {
            console.error('Error cargando logs de hábitos:', error);
            this.habitLogs = [];
            this.showNotification('Error al cargar el historial de hábitos', 'danger');
        }
    }

    /**
     * Guardar logs de hábitos en localStorage
     */
    saveHabitLogs() {
        try {
            localStorage.setItem(this.logsStorageKey, JSON.stringify(this.habitLogs));
            console.log(`💾 Logs de hábitos guardados: ${this.habitLogs.length}`);
        } catch (error) {
            console.error('Error guardando logs de hábitos:', error);
            this.showNotification('Error al guardar el historial de hábitos', 'danger');
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
     * Escapar HTML para prevenir XSS
     */
    escapeHtml(text) {
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
     * Disparar evento personalizado
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`habits${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
            detail: {
                module: 'habits',
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
        const totalHabits = this.habits.length;
        const activeHabits = this.habits.filter(h => !h.archived).length;
        const archivedHabits = this.habits.filter(h => h.archived).length;
        const totalLogs = this.habitLogs.length;
        
        const todayCompleted = this.habits.filter(h => {
            if (h.archived) return false;
            const todayLog = this.getTodayLogForHabit(h.id);
            return todayLog && todayLog.value >= h.targetValue;
        }).length;

        return {
            totalHabits,
            activeHabits,
            archivedHabits,
            todayCompleted,
            todayPending: activeHabits - todayCompleted,
            totalLogs,
            byCategory: {
                health: this.habits.filter(h => h.category === 'health').length,
                fitness: this.habits.filter(h => h.category === 'fitness').length,
                productivity: this.habits.filter(h => h.category === 'productivity').length,
                learning: this.habits.filter(h => h.category === 'learning').length,
                social: this.habits.filter(h => h.category === 'social').length,
                spiritual: this.habits.filter(h => h.category === 'spiritual').length,
                creative: this.habits.filter(h => h.category === 'creative').length,
                financial: this.habits.filter(h => h.category === 'financial').length,
                other: this.habits.filter(h => h.category === 'other').length
            },
            byDifficulty: {
                easy: this.habits.filter(h => h.difficulty === 'easy').length,
                medium: this.habits.filter(h => h.difficulty === 'medium').length,
                hard: this.habits.filter(h => h.difficulty === 'hard').length
            }
        };
    }

    /**
     * Resetear módulo
     */
    reset() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los hábitos y su historial?')) {
            this.habits = [];
            this.habitLogs = [];
            this.saveHabits();
            this.saveHabitLogs();
            this.renderHabits();
            this.renderTodayProgress();
            this.updateStats();
            this.showNotification('Todos los hábitos han sido eliminados', 'info');
            
            // Trigger event
            this.dispatchEvent('moduleReset');
        }
    }

    /**
     * Importar hábitos desde archivo JSON
     */
    importHabits(data) {
        try {
            if (data.habits && Array.isArray(data.habits)) {
                const validHabits = data.habits.filter(habit => 
                    habit.id && habit.name && habit.category && habit.difficulty
                );
                
                this.habits = [...this.habits, ...validHabits];
                
                if (data.habitLogs && Array.isArray(data.habitLogs)) {
                    const validLogs = data.habitLogs.filter(log => 
                        log.id && log.habitId && log.date
                    );
                    this.habitLogs = [...this.habitLogs, ...validLogs];
                    this.saveHabitLogs();
                }
                
                this.saveHabits();
                this.renderHabits();
                this.renderTodayProgress();
                this.updateStats();
                
                this.showNotification(`${validHabits.length} hábito(s) importado(s) correctamente`, 'success');
                
                // Trigger event
                this.dispatchEvent('habitsImported', { count: validHabits.length, habits: validHabits });
            }
        } catch (error) {
            console.error('Error importando hábitos:', error);
            this.showNotification('Error al importar los hábitos', 'danger');
        }
    }

    /**
     * Destruir módulo (cleanup)
     */
    destroy() {
        console.log('🔄 Habits Module destruido');
        this.isInitialized = false;
    }
}

// Crear instancia global del módulo de hábitos
window.habits = new HabitsModule();

// Compatibilidad con código existente
window.HabitsModule = HabitsModule;

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.habits && !window.habits.isInitialized) {
        window.habits.init();
    }
});

// Event listeners para integración con otros módulos
document.addEventListener('habitsHabitAdded', (e) => {
    console.log('✅ Nuevo hábito agregado:', e.detail.habit.name);
});

document.addEventListener('habitsHabitCompleted', (e) => {
    console.log('🎉 Hábito completado:', e.detail.habit.name);
});

// Debugging helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugHabits = () => {
        console.log('🔍 Debug Info - Habits:', window.habits.getStats());
        console.log('🔍 Total hábitos:', window.habits.habits.length);
        console.log('🔍 Total logs:', window.habits.habitLogs.length);
        console.log('🔍 Hábitos:', window.habits.habits);
    };
    
    console.log('🛠️ Debug mode: Usa debugHabits() para ver información del módulo');
}

console.log('🔄 Habits Module cargado correctamente');