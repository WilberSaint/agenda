/**
 * Agenda Module - Agenda Personal Pro
 * Módulo principal para manejo de tareas, recordatorios y listas
 */

class AgendaModule {
    constructor() {
        this.tasks = [];
        this.currentEditId = null;
        this.storageKey = 'agenda-personal-tasks';
        this.isInitialized = false;
        this.filters = {
            type: '',
            category: '',
            priority: '',
            showCompleted: false
        };
        
        console.log('📅 Agenda Module creado');
    }

    /**
     * Inicializar el módulo de agenda
     */
    init() {
        if (this.isInitialized) {
            console.log('📅 Agenda Module ya estaba inicializado');
            return;
        }

        console.log('📅 Inicializando Agenda Module...');
        
        this.loadTasks();
        this.bindEvents();
        this.renderTasks();
        this.renderThreeDayView();
        this.updateStats();
        this.setTodayDate();
        this.checkMonthlyPendingTasks();
        
        this.isInitialized = true;
        
        // Trigger event para notificar que el módulo está listo
        this.dispatchEvent('agendaModuleInitialized');
        
        console.log('✅ Agenda Module inicializado correctamente');
    }

    /**
     * Métodos helper para manejar fechas locales correctamente
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

    /**
     * Vincular eventos del DOM
     */
    bindEvents() {
        // Formulario principal
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }

        // Cambio de tipo de tarea
        const taskType = document.getElementById('taskType');
        if (taskType) {
            taskType.addEventListener('change', (e) => {
                this.toggleChecklistSection(e.target.value);
            });
        }

        // Formulario de edición
        const saveEditTask = document.getElementById('saveEditTask');
        if (saveEditTask) {
            saveEditTask.addEventListener('click', () => {
                this.saveEditTask();
            });
        }

        const editTaskType = document.getElementById('editTaskType');
        if (editTaskType) {
            editTaskType.addEventListener('change', (e) => {
                this.toggleEditChecklistSection(e.target.value);
            });
        }

        // Pestañas
        document.querySelectorAll('#taskTabs button').forEach(tab => {
            tab.addEventListener('shown.bs.tab', () => {
                this.renderTasksByTab();
            });
        });

        // Filtros
        this.bindFilterEvents();

        // Botones de acción
        this.bindActionButtons();
    }

    /**
     * Vincular eventos de filtros
     */
    bindFilterEvents() {
        const filterType = document.getElementById('filterType');
        const filterCategory = document.getElementById('filterCategory');
        const filterPriority = document.getElementById('filterPriority');
        const filterCompleted = document.getElementById('filterCompleted');

        if (filterType) {
            filterType.addEventListener('change', () => {
                this.filters.type = filterType.value;
                this.renderTasksByTab();
            });
        }

        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.filters.category = filterCategory.value;
                this.renderTasksByTab();
            });
        }

        if (filterPriority) {
            filterPriority.addEventListener('change', () => {
                this.filters.priority = filterPriority.value;
                this.renderTasksByTab();
            });
        }

        if (filterCompleted) {
            filterCompleted.addEventListener('change', () => {
                this.filters.showCompleted = filterCompleted.checked;
                this.renderTasksByTab();
            });
        }
    }

    /**
     * Vincular botones de acción
     */
    bindActionButtons() {
        const clearCompleted = document.getElementById('clearCompleted');
        if (clearCompleted) {
            clearCompleted.addEventListener('click', () => {
                this.clearCompleted();
            });
        }

        const exportToGoogle = document.getElementById('exportToGoogle');
        if (exportToGoogle) {
            exportToGoogle.addEventListener('click', () => {
                this.exportToGoogleCalendar();
            });
        }
    }

    /**
     * Mostrar/ocultar sección de checklist
     */
    toggleChecklistSection(type) {
        const checklistSection = document.getElementById('checklistSection');
        if (checklistSection) {
            checklistSection.style.display = type === 'checklist' ? 'block' : 'none';
        }
    }

    toggleEditChecklistSection(type) {
        const editChecklistSection = document.getElementById('editChecklistSection');
        if (editChecklistSection) {
            editChecklistSection.style.display = type === 'checklist' ? 'block' : 'none';
        }
    }

    /**
     * Agregar item a checklist
     */
    addChecklistItem(button) {
        const input = button.parentElement.querySelector('input');
        const text = input.value.trim();
        
        if (!text) {
            this.showNotification('Por favor ingresa un item para la lista', 'warning');
            return;
        }

        const container = document.getElementById('checklistItems');
        const newItem = document.createElement('div');
        newItem.className = 'input-group mb-2';
        newItem.innerHTML = `
            <input type="text" class="form-control app-input" value="${this.escapeHtml(text)}" readonly>
            <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.insertBefore(newItem, container.lastElementChild);
        input.value = '';
        input.focus();
    }

    /**
     * Agregar item a checklist en edición
     */
    addEditChecklistItem() {
        const container = document.getElementById('editChecklistItems');
        const newItem = document.createElement('div');
        newItem.className = 'input-group mb-2';
        newItem.innerHTML = `
            <input type="text" class="form-control app-input checklist-input" placeholder="Nuevo item...">
            <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(newItem);
        newItem.querySelector('input').focus();
    }

    /**
     * Establecer fecha de hoy por defecto
     */
    setTodayDate() {
        const taskDate = document.getElementById('taskDate');
        if (taskDate) {
            const today = new Date();
            const todayStr = this.formatDateToString(today);
            taskDate.value = todayStr;
        }
    }

    /**
     * Generar ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Agregar nueva tarea
     */
    addTask() {
        const title = document.getElementById('taskTitle')?.value.trim();
        const description = document.getElementById('taskDescription')?.value.trim();
        const type = document.getElementById('taskType')?.value;
        const category = document.getElementById('taskCategory')?.value;
        const priority = document.getElementById('taskPriority')?.value;
        const date = document.getElementById('taskDate')?.value;
        const time = document.getElementById('taskTime')?.value;

        if (!title) {
            this.showNotification('Por favor ingresa un título para la tarea', 'warning');
            return;
        }

        // Recopilar items de checklist si es necesario
        let checklistItems = [];
        if (type === 'checklist') {
            const items = document.querySelectorAll('#checklistItems input[readonly]');
            checklistItems = Array.from(items).map(input => ({
                id: this.generateId(),
                text: input.value,
                completed: false
            }));
        }

        // Establecer fecha de vencimiento para pendientes (1 mes) usando fecha local
        let dueDate = date;
        if (type === 'pendiente' && date) {
            const dateObj = this.createLocalDate(date);
            dateObj.setMonth(dateObj.getMonth() + 1);
            dueDate = this.formatDateToString(dateObj);
        }

        const task = {
            id: this.generateId(),
            title,
            description,
            type,
            category,
            priority,
            date,
            time,
            dueDate: type === 'pendiente' ? dueDate : date,
            checklistItems: checklistItems,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.renderThreeDayView();
        this.updateStats();
        this.clearForm();
        this.showNotification('Tarea agregada correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('taskAdded', { task });
    }

    /**
     * Limpiar formulario
     */
    clearForm() {
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.reset();
        }

        const checklistItems = document.getElementById('checklistItems');
        if (checklistItems) {
            checklistItems.innerHTML = `
                <div class="input-group mb-2">
                    <input type="text" class="form-control app-input" placeholder="Agregar item...">
                    <button type="button" class="btn btn-primary" onclick="agenda.addChecklistItem(this)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
        }

        const checklistSection = document.getElementById('checklistSection');
        if (checklistSection) {
            checklistSection.style.display = 'none';
        }

        this.setTodayDate();
    }

    /**
     * Renderizar vista de 3 días usando fechas locales
     */
    renderThreeDayView() {
        const container = document.getElementById('threeDayView');
        if (!container) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const days = [];
        for (let i = 0; i < 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }

        const dayNames = ['Hoy', 'Mañana', 'Pasado Mañana'];
        
        container.innerHTML = days.map((date, index) => {
            const dateStr = this.formatDateToString(date);
            
            const dayTasks = this.tasks.filter(task => 
                task.date === dateStr && !task.completed
            );

            return `
                <div class="col-md-4">
                    <div class="day-card">
                        <div class="day-header">
                            ${dayNames[index]}
                            <div class="small">${date.toLocaleDateString('es-ES', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'short' 
                            })}</div>
                        </div>
                        <div class="day-tasks">
                            ${dayTasks.length === 0 ? 
                                '<div class="text-center text-muted small">Sin tareas programadas</div>' :
                                dayTasks.map(task => `
                                    <div class="day-task-item" onclick="agenda.highlightTask('${task.id}')">
                                        <div class="d-flex align-items-center">
                                            <span class="badge category-${task.category} me-2">${this.getTypeIcon(task.type)}</span>
                                            <small class="flex-grow-1">${this.escapeHtml(task.title)}</small>
                                            ${task.time ? `<small class="text-muted">${task.time}</small>` : ''}
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Obtener icono por tipo
     */
    getTypeIcon(type) {
        const icons = {
            pendiente: '<i class="fas fa-clock"></i>',
            recordatorio: '<i class="fas fa-bell"></i>',
            checklist: '<i class="fas fa-list-check"></i>'
        };
        return icons[type] || '<i class="fas fa-clock"></i>';
    }

    /**
     * Resaltar tarea específica
     */
    highlightTask(id) {
        // Cambiar a la pestaña "Todas"
        const allTab = document.getElementById('all-tab');
        if (allTab) {
            const allTabInstance = new bootstrap.Tab(allTab);
            allTabInstance.show();
        }
        
        setTimeout(() => {
            const taskElement = document.querySelector(`[data-id="${id}"]`);
            if (taskElement) {
                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                taskElement.style.transform = 'scale(1.02)';
                taskElement.style.boxShadow = '0 8px 30px rgba(51, 65, 85, 0.4)';
                
                setTimeout(() => {
                    taskElement.style.transform = '';
                    taskElement.style.boxShadow = '';
                }, 2000);
            }
        }, 100);
    }

    /**
     * Renderizar tareas por pestaña activa
     */
    renderTasksByTab() {
        const activeTab = document.querySelector('#taskTabs .nav-link.active');
        if (!activeTab) return;
        
        const activeTabId = activeTab.id;
        
        switch (activeTabId) {
            case 'all-tab':
                this.renderTasksInContainer('taskList', this.getFilteredTasks());
                break;
            case 'pending-tab':
                this.renderTasksInContainer('pendingList', this.getFilteredTasks().filter(t => t.type === 'pendiente'));
                break;
            case 'checklist-tab':
                this.renderTasksInContainer('checklistList', this.getFilteredTasks().filter(t => t.type === 'checklist'));
                break;
            case 'reminders-tab':
                this.renderTasksInContainer('reminderList', this.getFilteredTasks().filter(t => t.type === 'recordatorio'));
                break;
        }
    }

    /**
     * Renderizar tareas en contenedor específico
     */
    renderTasksInContainer(containerId, tasks) {
        const container = document.getElementById(containerId);
        const emptyState = document.getElementById('emptyState');
        
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-muted">No hay tareas para mostrar</div>';
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Ordenar tareas
        tasks.sort((a, b) => {
            const priorityOrder = { urgente: 4, alta: 3, media: 2, baja: 1 };
            
            if (a.priority !== b.priority) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            
            if (a.date !== b.date) {
                return new Date(a.date || '9999-12-31') - new Date(b.date || '9999-12-31');
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        container.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
    }

    /**
     * Renderizar todas las tareas
     */
    renderTasks() {
        this.renderTasksByTab();
        this.renderThreeDayView();
    }

    /**
     * Crear HTML para una tarea
     */
    createTaskHTML(task) {
        const isOverdue = this.isOverdue(task);
        const dateTime = this.formatDateTime(task.date, task.time);
        const typeLabel = this.getTypeLabel(task.type);
        
        let checklistHTML = '';
        if (task.type === 'checklist' && task.checklistItems) {
            const completedItems = task.checklistItems.filter(item => item.completed).length;
            const totalItems = task.checklistItems.length;
            
            checklistHTML = `
                <div class="checklist-progress mb-2">
                    <small class="text-muted">
                        <i class="fas fa-check-circle text-success"></i> 
                        ${completedItems}/${totalItems} completados
                    </small>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar" style="width: ${totalItems > 0 ? (completedItems/totalItems)*100 : 0}%;"></div>
                    </div>
                </div>
                <div class="checklist-items mb-2">
                    ${task.checklistItems.map(item => `
                        <div class="checklist-item ${item.completed ? 'completed' : ''}">
                            <input type="checkbox" class="form-check-input me-2" ${item.completed ? 'checked' : ''} 
                                   onchange="agenda.toggleChecklistItem('${task.id}', '${item.id}')">
                            <span class="checklist-text">${this.escapeHtml(item.text)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
                <div class="d-flex align-items-start">
                    <input type="checkbox" class="task-checkbox me-3" ${task.completed ? 'checked' : ''} 
                           onchange="agenda.toggleTask('${task.id}')">
                    
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <div class="task-title flex-grow-1">${this.escapeHtml(task.title)}</div>
                            <span class="badge category-${task.category} category-badge me-2">${this.getCategoryLabel(task.category)}</span>
                        </div>
                        
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                        
                        ${checklistHTML}
                        
                        <div class="task-datetime">
                            ${dateTime ? `<span><i class="fas fa-calendar"></i> ${dateTime}</span>` : ''}
                            ${task.type === 'pendiente' && task.dueDate ? `<span><i class="fas fa-hourglass-end"></i> Vence: ${this.formatDate(task.dueDate)}</span>` : ''}
                            ${isOverdue ? '<span class="overdue-indicator"><i class="fas fa-exclamation-triangle"></i> Vencida</span>' : ''}
                        </div>
                        
                        <div class="d-flex align-items-center gap-2 flex-wrap mt-2">
                            <span class="badge priority-${task.priority} priority-badge">${this.getPriorityLabel(task.priority)}</span>
                            <span class="badge bg-light text-dark">${typeLabel}</span>
                        </div>
                    </div>
                    
                    <div class="task-actions ms-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="agenda.editTask('${task.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="agenda.duplicateTask('${task.id}')" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="agenda.deleteTask('${task.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Alternar item de checklist
     */
    toggleChecklistItem(taskId, itemId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.checklistItems) {
            const item = task.checklistItems.find(i => i.id === itemId);
            if (item) {
                item.completed = !item.completed;
                
                // Verificar si todos los items están completados
                const allCompleted = task.checklistItems.every(i => i.completed);
                if (allCompleted && !task.completed) {
                    task.completed = true;
                    this.showNotification('Lista de tareas completada', 'success');
                }
                
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                
                // Trigger event
                this.dispatchEvent('checklistItemToggled', { task, item });
            }
        }
    }

    /**
     * Obtener tareas filtradas
     */
    getFilteredTasks() {
        return this.tasks.filter(task => {
            if (!this.filters.showCompleted && task.completed) return false;
            if (this.filters.type && task.type !== this.filters.type) return false;
            if (this.filters.category && task.category !== this.filters.category) return false;
            if (this.filters.priority && task.priority !== this.filters.priority) return false;
            return true;
        });
    }

    /**
     * Verificar si una tarea está vencida usando fechas locales
     */
    isOverdue(task) {
        if (!task.date || task.completed) return false;
        
        const checkDate = task.type === 'pendiente' ? task.dueDate : task.date;
        if (!checkDate) return false;
        
        const taskDate = this.createLocalDate(checkDate);
        if (task.time) {
            const [hours, minutes] = task.time.split(':');
            taskDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
            taskDate.setHours(23, 59, 59, 999);
        }
        
        const now = new Date();
        
        return taskDate < now;
    }

    /**
     * Verificar tareas pendientes mensuales
     */
    checkMonthlyPendingTasks() {
        const pendingTasks = this.tasks.filter(t => 
            t.type === 'pendiente' && !t.completed && this.isOverdue(t)
        );
        
        if (pendingTasks.length > 0) {
            setTimeout(() => {
                this.showNotification(`Tienes ${pendingTasks.length} pendiente(s) vencida(s)`, 'warning');
            }, 2000);
        }
    }

    /**
     * Formatear fecha usando fecha local
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = this.createLocalDate(dateStr);
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    /**
     * Formatear fecha y hora usando fecha local
     */
    formatDateTime(date, time) {
        if (!date) return '';
        
        const dateObj = this.createLocalDate(date);
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        
        let formatted = dateObj.toLocaleDateString('es-ES', options);
        
        if (time) {
            formatted += ` a las ${time}`;
        }
        
        return formatted;
    }

    /**
     * Obtener etiqueta de tipo
     */
    getTypeLabel(type) {
        const labels = {
            pendiente: 'Pendiente',
            recordatorio: 'Recordatorio',
            checklist: 'Lista de tareas'
        };
        return labels[type] || type;
    }

    /**
     * Obtener etiqueta de categoría
     */
    getCategoryLabel(category) {
        const labels = {
            personal: 'Personal',
            trabajo: 'Trabajo',
            compras: 'Compras',
            comida: 'Comida/Mercado',
            pagos: 'Pagos',
            citas: 'Citas',
            otros: 'Otros'
        };
        return labels[category] || category;
    }

    /**
     * Obtener etiqueta de prioridad
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

    /**
     * Alternar estado completado de tarea
     */
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            
            // Si es un checklist, marcar todos los items
            if (task.type === 'checklist' && task.checklistItems) {
                task.checklistItems.forEach(item => {
                    item.completed = task.completed;
                });
            }
            
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const action = task.completed ? 'completada' : 'marcada como pendiente';
            this.showNotification(`Tarea ${action}`, 'info');
            
            // Trigger event
            this.dispatchEvent('taskToggled', { task });
        }
    }

    /**
     * Editar tarea
     */
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.currentEditId = id;
        
        // Llenar el formulario de edición
        const elements = {
            editTaskId: document.getElementById('editTaskId'),
            editTaskTitle: document.getElementById('editTaskTitle'),
            editTaskDescription: document.getElementById('editTaskDescription'),
            editTaskType: document.getElementById('editTaskType'),
            editTaskCategory: document.getElementById('editTaskCategory'),
            editTaskPriority: document.getElementById('editTaskPriority'),
            editTaskDate: document.getElementById('editTaskDate'),
            editTaskTime: document.getElementById('editTaskTime')
        };

        if (elements.editTaskId) elements.editTaskId.value = task.id;
        if (elements.editTaskTitle) elements.editTaskTitle.value = task.title;
        if (elements.editTaskDescription) elements.editTaskDescription.value = task.description;
        if (elements.editTaskType) elements.editTaskType.value = task.type;
        if (elements.editTaskCategory) elements.editTaskCategory.value = task.category;
        if (elements.editTaskPriority) elements.editTaskPriority.value = task.priority;
        if (elements.editTaskDate) elements.editTaskDate.value = task.date;
        if (elements.editTaskTime) elements.editTaskTime.value = task.time;

        // Mostrar sección de checklist si es necesario
        this.toggleEditChecklistSection(task.type);
        
        // Cargar items de checklist
        if (task.type === 'checklist' && task.checklistItems) {
            const container = document.getElementById('editChecklistItems');
            if (container) {
                container.innerHTML = task.checklistItems.map(item => `
                    <div class="input-group mb-2">
                        <input type="text" class="form-control app-input checklist-input" value="${this.escapeHtml(item.text)}">
                        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        modal.show();
    }

    /**
     * Guardar cambios de edición
     */
    saveEditTask() {
        const id = this.currentEditId;
        const task = this.tasks.find(t => t.id === id);
        
        if (!task) return;

        const title = document.getElementById('editTaskTitle')?.value.trim();
        if (!title) {
            this.showNotification('El título es requerido', 'warning');
            return;
        }

        const oldType = task.type;
        const newType = document.getElementById('editTaskType')?.value;

        task.title = title;
        task.description = document.getElementById('editTaskDescription')?.value.trim();
        task.type = newType;
        task.category = document.getElementById('editTaskCategory')?.value;
        task.priority = document.getElementById('editTaskPriority')?.value;
        task.date = document.getElementById('editTaskDate')?.value;
        task.time = document.getElementById('editTaskTime')?.value;

        // Actualizar fecha de vencimiento para pendientes usando fecha local
        if (newType === 'pendiente' && task.date) {
            const dateObj = this.createLocalDate(task.date);
            dateObj.setMonth(dateObj.getMonth() + 1);
            task.dueDate = this.formatDateToString(dateObj);
        }

        // Manejar items de checklist
        if (newType === 'checklist') {
            const inputs = document.querySelectorAll('#editChecklistItems .checklist-input');
            task.checklistItems = Array.from(inputs)
                .map(input => input.value.trim())
                .filter(text => text)
                .map(text => ({
                    id: this.generateId(),
                    text: text,
                    completed: false
                }));
        } else if (oldType === 'checklist') {
            // Limpiar checklist items si cambió de tipo
            delete task.checklistItems;
        }

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
        if (modal) {
            modal.hide();
        }
        
        this.showNotification('Tarea actualizada correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('taskUpdated', { task });
    }

    /**
     * Duplicar tarea
     */
    duplicateTask(id) {
        const originalTask = this.tasks.find(t => t.id === id);
        if (!originalTask) return;

        const duplicatedTask = {
            ...originalTask,
            id: this.generateId(),
            title: `${originalTask.title} (Copia)`,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Duplicar items de checklist
        if (originalTask.checklistItems) {
            duplicatedTask.checklistItems = originalTask.checklistItems.map(item => ({
                ...item,
                id: this.generateId(),
                completed: false
            }));
        }

        this.tasks.unshift(duplicatedTask);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Tarea duplicada correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('taskDuplicated', { originalTask, duplicatedTask });
    }

    /**
     * Eliminar tarea
     */
    deleteTask(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            const task = this.tasks.find(t => t.id === id);
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Tarea eliminada', 'info');
            
            // Trigger event
            this.dispatchEvent('taskDeleted', { task });
        }
    }

    /**
     * Limpiar tareas completadas
     */
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No hay tareas completadas para eliminar', 'info');
            return;
        }

        if (confirm(`¿Eliminar ${completedCount} tarea(s) completada(s)?`)) {
            const completedTasks = this.tasks.filter(t => t.completed);
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification(`${completedCount} tarea(s) completada(s) eliminada(s)`, 'success');
            
            // Trigger event
            this.dispatchEvent('completedTasksCleared', { count: completedCount, tasks: completedTasks });
        }
    }

    /**
     * Actualizar estadísticas
     */
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const urgent = this.tasks.filter(t => t.priority === 'urgente' && !t.completed).length;

        const elements = {
            totalTasks: document.getElementById('totalTasks'),
            completedTasks: document.getElementById('completedTasks'),
            pendingTasks: document.getElementById('pendingTasks'),
            urgentTasks: document.getElementById('urgentTasks')
        };

        if (elements.totalTasks) elements.totalTasks.textContent = total;
        if (elements.completedTasks) elements.completedTasks.textContent = completed;
        if (elements.pendingTasks) elements.pendingTasks.textContent = pending;
        if (elements.urgentTasks) elements.urgentTasks.textContent = urgent;

        // Trigger event
        this.dispatchEvent('statsUpdated', { total, completed, pending, urgent });
    }

    /**
     * Exportar a Google Calendar
     */
    exportToGoogleCalendar() {
        const pendingTasks = this.tasks.filter(t => !t.completed && t.date);
        
        if (pendingTasks.length === 0) {
            this.showNotification('No hay tareas pendientes con fecha para exportar', 'warning');
            return;
        }

        const icsContent = this.generateICSContent(pendingTasks);
        this.downloadICS(icsContent);
        
        this.showNotification(`${pendingTasks.length} tarea(s) exportada(s) correctamente`, 'success');
        
        setTimeout(() => {
            alert(`¡Archivo descargado exitosamente!\n\nPara importar a Google Calendar:\n1. Ve a calendar.google.com\n2. Haz clic en el botón "+" junto a "Otros calendarios"\n3. Selecciona "Importar"\n4. Sube el archivo .ics descargado\n5. Elige el calendario donde importar\n6. Haz clic en "Importar"\n\n¡Disfruta tu agenda organizada!`);
        }, 1000);
        
        // Trigger event
        this.dispatchEvent('tasksExported', { count: pendingTasks.length, tasks: pendingTasks });
    }

    /**
     * Generar contenido ICS usando fechas locales
     */
    generateICSContent(tasks) {
        let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Agenda Personal Pro//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

        tasks.forEach(task => {
            const startDate = this.createLocalDate(task.date);
            if (task.time) {
                const [hours, minutes] = task.time.split(':');
                startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            } else {
                startDate.setHours(9, 0, 0, 0);
            }
            
            const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));
            
            const formatDate = (date) => {
                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };

            let description = '';
            if (task.description) {
                description = task.description
                    .replace(/\\/g, '\\\\')
                    .replace(/,/g, '\\,')
                    .replace(/;/g, '\\;')
                    .replace(/\r\n/g, '\\n')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\n');
            }
            
            if (task.checklistItems && task.checklistItems.length > 0) {
                if (description) description += '\\n\\n';
                description += 'Lista de tareas:\\n' + 
                    task.checklistItems.map(item => `- ${item.text.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\\/g, '\\\\')}`).join('\\n');
            }
            
            if (description) description += '\\n\\n';
            description += `Categoría: ${this.getCategoryLabel(task.category).replace(/,/g, '\\,')}\\n`;
            description += `Prioridad: ${this.getPriorityLabel(task.priority).replace(/,/g, '\\,')}\\n`;
            description += `Tipo: ${this.getTypeLabel(task.type).replace(/,/g, '\\,')}`;

            const escapedTitle = task.title
                .replace(/,/g, '\\,')
                .replace(/;/g, '\\;')
                .replace(/\\/g, '\\\\');

            ics += `BEGIN:VEVENT
UID:${task.id}@agenda-personal-pro.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${escapedTitle}
DESCRIPTION:${description}
CATEGORIES:${this.getCategoryLabel(task.category).replace(/,/g, '\\,')}
PRIORITY:${this.getPriorityNumber(task.priority)}
STATUS:CONFIRMED
END:VEVENT
`;
        });

        ics += 'END:VCALENDAR';
        return ics;
    }

    /**
     * Obtener número de prioridad para ICS
     */
    getPriorityNumber(priority) {
        const priorities = {
            urgente: 1,
            alta: 3,
            media: 5,
            baja: 7
        };
        return priorities[priority] || 5;
    }

    /**
     * Descargar archivo ICS
     */
    downloadICS(content) {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `agenda-personal-${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Cargar tareas del localStorage
     */
    loadTasks() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.tasks = saved ? JSON.parse(saved) : [];
            console.log(`📥 Tareas cargadas: ${this.tasks.length}`);
        } catch (error) {
            console.error('Error cargando tareas:', error);
            this.tasks = [];
            this.showNotification('Error al cargar las tareas', 'danger');
        }
    }

    /**
     * Guardar tareas en localStorage
     */
    saveTasks() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
            console.log(`💾 Tareas guardadas: ${this.tasks.length}`);
        } catch (error) {
            console.error('Error guardando tareas:', error);
            this.showNotification('Error al guardar las tareas', 'danger');
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
        const event = new CustomEvent(`agenda${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
            detail: {
                module: 'agenda',
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
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const urgent = this.tasks.filter(t => t.priority === 'urgente' && !t.completed).length;
        const overdue = this.tasks.filter(t => this.isOverdue(t)).length;

        return {
            total,
            completed,
            pending,
            urgent,
            overdue,
            byType: {
                pendiente: this.tasks.filter(t => t.type === 'pendiente').length,
                recordatorio: this.tasks.filter(t => t.type === 'recordatorio').length,
                checklist: this.tasks.filter(t => t.type === 'checklist').length
            },
            byCategory: {
                personal: this.tasks.filter(t => t.category === 'personal').length,
                trabajo: this.tasks.filter(t => t.category === 'trabajo').length,
                compras: this.tasks.filter(t => t.category === 'compras').length,
                comida: this.tasks.filter(t => t.category === 'comida').length,
                pagos: this.tasks.filter(t => t.category === 'pagos').length,
                citas: this.tasks.filter(t => t.category === 'citas').length,
                otros: this.tasks.filter(t => t.category === 'otros').length
            }
        };
    }

    /**
     * Resetear módulo
     */
    reset() {
        if (confirm('¿Estás seguro de que quieres eliminar todas las tareas?')) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Todas las tareas han sido eliminadas', 'info');
            
            // Trigger event
            this.dispatchEvent('moduleReset');
        }
    }

    /**
     * Importar tareas desde archivo JSON
     */
    importTasks(tasksData) {
        try {
            if (Array.isArray(tasksData)) {
                const validTasks = tasksData.filter(task => 
                    task.id && task.title && task.type && task.category && task.priority
                );
                
                this.tasks = [...this.tasks, ...validTasks];
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                
                this.showNotification(`${validTasks.length} tareas importadas correctamente`, 'success');
                
                // Trigger event
                this.dispatchEvent('tasksImported', { count: validTasks.length, tasks: validTasks });
            }
        } catch (error) {
            console.error('Error importando tareas:', error);
            this.showNotification('Error al importar las tareas', 'danger');
        }
    }

    /**
     * Exportar tareas como JSON
     */
    exportTasks() {
        const data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            tasks: this.tasks
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `agenda-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Respaldo de tareas descargado', 'success');
        
        // Trigger event
        this.dispatchEvent('tasksExportedJSON', { count: this.tasks.length });
    }

    /**
     * Destruir módulo (cleanup)
     */
    destroy() {
        // Remover event listeners si es necesario
        console.log('📅 Agenda Module destruido');
        this.isInitialized = false;
    }
}

// Crear instancia global del módulo de agenda
window.agenda = new AgendaModule();

// Compatibilidad con código existente
window.AgendaModule = AgendaModule;

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.agenda && !window.agenda.isInitialized) {
        window.agenda.init();
    }
});

// Event listeners para integración con otros módulos
document.addEventListener('agendaTaskAdded', (e) => {
    console.log('✅ Nueva tarea agregada:', e.detail.task.title);
});

document.addEventListener('agendaTaskCompleted', (e) => {
    console.log('🎉 Tarea completada:', e.detail.task.title);
});

// Debugging helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugAgenda = () => {
        console.log('🔍 Debug Info - Agenda:', window.agenda.getStats());
        console.log('🔍 Total tareas:', window.agenda.tasks.length);
        console.log('🔍 Tareas:', window.agenda.tasks);
    };
    
    console.log('🛠️ Debug mode: Usa debugAgenda() para ver información del módulo');
}

console.log('📅 Agenda Module cargado correctamente');