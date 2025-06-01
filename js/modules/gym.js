/**
 * Gym Module - Agenda Personal Pro
 * Módulo para seguimiento de entrenamientos, progreso de ejercicios y peso corporal
 */

class GymModule {
    constructor() {
        this.workouts = [];
        this.bodyWeightRecords = [];
        this.personalRecords = {};
        this.currentEditId = null;
        this.storageKey = 'agenda-pro-gym';
        this.isInitialized = false;
        this.filters = {
            muscleGroup: '',
            workoutType: '',
            showArchived: false
        };
        
        // Ejercicios predefinidos por grupo muscular
        this.exercises = {
            chest: [
                { name: 'Press Banca', type: 'compound', category: 'chest' },
                { name: 'Press Inclinado', type: 'compound', category: 'chest' },
                { name: 'Press Declinado', type: 'compound', category: 'chest' },
                { name: 'Flexiones', type: 'bodyweight', category: 'chest' },
                { name: 'Aperturas', type: 'isolation', category: 'chest' },
                { name: 'Fondos', type: 'bodyweight', category: 'chest' }
            ],
            back: [
                { name: 'Dominadas', type: 'bodyweight', category: 'back' },
                { name: 'Remo con Barra', type: 'compound', category: 'back' },
                { name: 'Jalones', type: 'compound', category: 'back' },
                { name: 'Remo con Mancuerna', type: 'compound', category: 'back' },
                { name: 'Peso Muerto', type: 'compound', category: 'back' },
                { name: 'Pullover', type: 'isolation', category: 'back' }
            ],
            shoulders: [
                { name: 'Press Militar', type: 'compound', category: 'shoulders' },
                { name: 'Press con Mancuernas', type: 'compound', category: 'shoulders' },
                { name: 'Elevaciones Laterales', type: 'isolation', category: 'shoulders' },
                { name: 'Elevaciones Frontales', type: 'isolation', category: 'shoulders' },
                { name: 'Pájaros', type: 'isolation', category: 'shoulders' },
                { name: 'Encogimientos', type: 'isolation', category: 'shoulders' }
            ],
            arms: [
                { name: 'Curl Bíceps', type: 'isolation', category: 'arms' },
                { name: 'Curl Martillo', type: 'isolation', category: 'arms' },
                { name: 'Press Francés', type: 'isolation', category: 'arms' },
                { name: 'Extensiones', type: 'isolation', category: 'arms' },
                { name: 'Curl con Barra', type: 'isolation', category: 'arms' },
                { name: 'Dips', type: 'bodyweight', category: 'arms' }
            ],
            legs: [
                { name: 'Sentadillas', type: 'compound', category: 'legs' },
                { name: 'Peso Muerto', type: 'compound', category: 'legs' },
                { name: 'Prensa', type: 'compound', category: 'legs' },
                { name: 'Estocadas', type: 'compound', category: 'legs' },
                { name: 'Curl Femoral', type: 'isolation', category: 'legs' },
                { name: 'Extensiones de Cuádriceps', type: 'isolation', category: 'legs' }
            ],
            core: [
                { name: 'Plancha', type: 'bodyweight', category: 'core' },
                { name: 'Abdominales', type: 'bodyweight', category: 'core' },
                { name: 'Russian Twists', type: 'bodyweight', category: 'core' },
                { name: 'Mountain Climbers', type: 'bodyweight', category: 'core' },
                { name: 'Elevaciones de Piernas', type: 'bodyweight', category: 'core' },
                { name: 'Dead Bug', type: 'bodyweight', category: 'core' }
            ]
        };
        
        console.log('💪 Gym Module creado');
    }

    /**
     * Inicializar el módulo de gimnasio
     */
    init() {
        if (this.isInitialized) {
            console.log('💪 Gym Module ya estaba inicializado');
            return;
        }

        console.log('💪 Inicializando Gym Module...');
        
        this.loadData();
        this.bindEvents();
        this.renderWorkouts();
        this.renderBodyWeightChart();
        this.updateStats();
        this.setTodayDate();
        this.calculatePersonalRecords();
        
        this.isInitialized = true;
        
        // Trigger event para notificar que el módulo está listo
        this.dispatchEvent('gymModuleInitialized');
        
        console.log('✅ Gym Module inicializado correctamente');
    }

    /**
     * Vincular eventos del DOM
     */
    bindEvents() {
        // Formulario de entrenamiento
        const workoutForm = document.getElementById('workoutForm');
        if (workoutForm) {
            workoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addWorkout();
            });
        }

        // Formulario de peso corporal
        const bodyWeightForm = document.getElementById('bodyWeightForm');
        if (bodyWeightForm) {
            bodyWeightForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBodyWeight();
            });
        }

        // Agregar ejercicio al entrenamiento
        const addExerciseBtn = document.getElementById('addExerciseToWorkout');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => {
                this.addExerciseToWorkout();
            });
        }

        // Filtros
        this.bindFilterEvents();

        // Botones de acción
        this.bindActionButtons();

        // Event listener para cambio de ejercicio
        const exerciseSelect = document.getElementById('exerciseName');
        if (exerciseSelect) {
            exerciseSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const category = selectedOption.getAttribute('data-category') || '';
                const categoryInput = document.getElementById('exerciseCategory');
                if (categoryInput) {
                    categoryInput.value = category;
                }
            });
        }
    }

    /**
     * Vincular eventos de filtros
     */
    bindFilterEvents() {
        const filterMuscleGroup = document.getElementById('filterMuscleGroup');
        const filterWorkoutType = document.getElementById('filterWorkoutType');
        const filterArchived = document.getElementById('filterArchivedWorkouts');

        if (filterMuscleGroup) {
            filterMuscleGroup.addEventListener('change', () => {
                this.filters.muscleGroup = filterMuscleGroup.value;
                this.renderWorkouts();
            });
        }

        if (filterWorkoutType) {
            filterWorkoutType.addEventListener('change', () => {
                this.filters.workoutType = filterWorkoutType.value;
                this.renderWorkouts();
            });
        }

        if (filterArchived) {
            filterArchived.addEventListener('change', () => {
                this.filters.showArchived = filterArchived.checked;
                this.renderWorkouts();
            });
        }
    }

    /**
     * Vincular botones de acción
     */
    bindActionButtons() {
        const exportWorkouts = document.getElementById('exportWorkouts');
        if (exportWorkouts) {
            exportWorkouts.addEventListener('click', () => {
                this.exportWorkouts();
            });
        }

        const clearOldWorkouts = document.getElementById('clearOldWorkouts');
        if (clearOldWorkouts) {
            clearOldWorkouts.addEventListener('click', () => {
                this.clearOldWorkouts();
            });
        }

        // Editar entrenamiento
        const saveEditWorkout = document.getElementById('saveEditWorkout');
        if (saveEditWorkout) {
            saveEditWorkout.addEventListener('click', () => {
                this.saveEditWorkout();
            });
        }
    }

    /**
     * Establecer fecha de hoy por defecto
     */
    setTodayDate() {
        const workoutDate = document.getElementById('workoutDate');
        const weightDate = document.getElementById('weightDate');
        
        if (workoutDate) {
            const today = new Date();
            const todayStr = this.formatDateToString(today);
            workoutDate.value = todayStr;
        }
        
        if (weightDate) {
            const today = new Date();
            const todayStr = this.formatDateToString(today);
            weightDate.value = todayStr;
        }
    }

    /**
     * Generar ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Agregar ejercicio al entrenamiento actual
     */
    addExerciseToWorkout() {
        const exerciseName = document.getElementById('exerciseName')?.value;
        
        if (!exerciseName) {
            this.showNotification('Por favor selecciona un ejercicio', 'warning');
            return;
        }

        const exerciseContainer = document.getElementById('workoutExercises');
        if (!exerciseContainer) return;

        const exerciseId = this.generateId();
        const exerciseHTML = this.createExerciseFormHTML(exerciseId, exerciseName);
        
        exerciseContainer.insertAdjacentHTML('beforeend', exerciseHTML);
        
        // Limpiar selección
        document.getElementById('exerciseName').value = '';
        document.getElementById('exerciseCategory').value = '';
    }

    /**
     * Crear HTML para formulario de ejercicio
     */
    createExerciseFormHTML(exerciseId, exerciseName) {
        return `
            <div class="exercise-form-item border rounded p-3 mb-3" data-exercise-id="${exerciseId}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${this.escapeHtml(exerciseName)}</h6>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.exercise-form-item').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <input type="hidden" name="exerciseName[]" value="${this.escapeHtml(exerciseName)}">
                
                <div class="exercise-sets" id="sets-${exerciseId}">
                    <div class="row mb-2">
                        <div class="col-3"><small class="text-muted">Serie</small></div>
                        <div class="col-3"><small class="text-muted">Peso (kg)</small></div>
                        <div class="col-3"><small class="text-muted">Reps</small></div>
                        <div class="col-3"><small class="text-muted">Descanso (seg)</small></div>
                    </div>
                    ${this.createSetFormHTML(exerciseId, 1)}
                </div>
                
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="gym.addSetToExercise('${exerciseId}')">
                    <i class="fas fa-plus me-1"></i>
                    Agregar Serie
                </button>
            </div>
        `;
    }

    /**
     * Crear HTML para formulario de serie
     */
    createSetFormHTML(exerciseId, setNumber) {
        return `
            <div class="row mb-2 set-form-row">
                <div class="col-3">
                    <input type="text" class="form-control form-control-sm" value="${setNumber}" readonly>
                </div>
                <div class="col-3">
                    <input type="number" class="form-control form-control-sm" name="weight[]" 
                           min="0" step="0.5" placeholder="0">
                </div>
                <div class="col-3">
                    <input type="number" class="form-control form-control-sm" name="reps[]" 
                           min="1" placeholder="0">
                </div>
                <div class="col-3">
                    <input type="number" class="form-control form-control-sm" name="rest[]" 
                           min="0" placeholder="60">
                </div>
            </div>
        `;
    }

    /**
     * Agregar serie a ejercicio
     */
    addSetToExercise(exerciseId) {
        const setsContainer = document.getElementById(`sets-${exerciseId}`);
        if (!setsContainer) return;

        const setRows = setsContainer.querySelectorAll('.set-form-row');
        const setNumber = setRows.length;
        
        setsContainer.insertAdjacentHTML('beforeend', this.createSetFormHTML(exerciseId, setNumber));
    }

    /**
     * Agregar nuevo entrenamiento
     */
    addWorkout() {
        const name = document.getElementById('workoutName')?.value.trim();
        const date = document.getElementById('workoutDate')?.value;
        const duration = parseInt(document.getElementById('workoutDuration')?.value);
        const notes = document.getElementById('workoutNotes')?.value.trim();

        if (!name || !date) {
            this.showNotification('Por favor completa el nombre y fecha del entrenamiento', 'warning');
            return;
        }

        // Recopilar ejercicios
        const exercises = this.collectExercisesFromForm();
        
        if (exercises.length === 0) {
            this.showNotification('Por favor agrega al menos un ejercicio', 'warning');
            return;
        }

        const workout = {
            id: this.generateId(),
            name,
            date,
            duration: duration || 60,
            notes,
            exercises,
            totalVolume: this.calculateTotalVolume(exercises),
            createdAt: new Date().toISOString()
        };

        this.workouts.unshift(workout);
        this.updatePersonalRecords(exercises);
        this.saveData();
        this.renderWorkouts();
        this.updateStats();
        this.clearWorkoutForm();
        this.showNotification('Entrenamiento registrado correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('workoutAdded', { workout });
    }

    /**
     * Recopilar ejercicios del formulario
     */
    collectExercisesFromForm() {
        const exercises = [];
        const exerciseItems = document.querySelectorAll('.exercise-form-item');
        
        exerciseItems.forEach(item => {
            const exerciseId = item.getAttribute('data-exercise-id');
            const exerciseName = item.querySelector('input[name="exerciseName[]"]').value;
            
            const weights = Array.from(item.querySelectorAll('input[name="weight[]"]')).map(input => parseFloat(input.value) || 0);
            const reps = Array.from(item.querySelectorAll('input[name="reps[]"]')).map(input => parseInt(input.value) || 0);
            const rest = Array.from(item.querySelectorAll('input[name="rest[]"]')).map(input => parseInt(input.value) || 60);
            
            const sets = weights.map((weight, index) => ({
                set: index + 1,
                weight: weight,
                reps: reps[index] || 0,
                rest: rest[index] || 60
            })).filter(set => set.reps > 0);
            
            if (sets.length > 0) {
                exercises.push({
                    id: exerciseId,
                    name: exerciseName,
                    sets: sets,
                    category: this.getExerciseCategory(exerciseName)
                });
            }
        });
        
        return exercises;
    }

    /**
     * Calcular volumen total
     */
    calculateTotalVolume(exercises) {
        return exercises.reduce((total, exercise) => {
            return total + exercise.sets.reduce((exerciseTotal, set) => {
                return exerciseTotal + (set.weight * set.reps);
            }, 0);
        }, 0);
    }

    /**
     * Actualizar récords personales
     */
    updatePersonalRecords(exercises) {
        exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
                const exerciseName = exercise.name;
                const currentPR = this.personalRecords[exerciseName] || { weight: 0, reps: 0, oneRM: 0 };
                
                // Actualizar peso máximo
                if (set.weight > currentPR.weight) {
                    currentPR.weight = set.weight;
                    currentPR.reps = set.reps;
                }
                
                // Calcular 1RM estimado (fórmula de Brzycki)
                const oneRM = set.weight * (36 / (37 - set.reps));
                if (oneRM > currentPR.oneRM) {
                    currentPR.oneRM = Math.round(oneRM * 10) / 10;
                }
                
                this.personalRecords[exerciseName] = currentPR;
            });
        });
    }

    /**
     * Calcular récords personales desde histórico
     */
    calculatePersonalRecords() {
        this.personalRecords = {};
        
        this.workouts.forEach(workout => {
            this.updatePersonalRecords(workout.exercises);
        });
    }

    /**
     * Agregar registro de peso corporal
     */
    addBodyWeight() {
        const weight = parseFloat(document.getElementById('bodyWeight')?.value);
        const date = document.getElementById('weightDate')?.value;
        const notes = document.getElementById('weightNotes')?.value.trim();

        if (!weight || weight <= 0 || !date) {
            this.showNotification('Por favor ingresa un peso válido y fecha', 'warning');
            return;
        }

        // Verificar si ya existe un registro para esta fecha
        const existingRecord = this.bodyWeightRecords.find(record => record.date === date);
        if (existingRecord) {
            if (confirm('Ya existe un registro para esta fecha. ¿Quieres actualizarlo?')) {
                existingRecord.weight = weight;
                existingRecord.notes = notes;
                existingRecord.updatedAt = new Date().toISOString();
            } else {
                return;
            }
        } else {
            const record = {
                id: this.generateId(),
                weight,
                date,
                notes,
                createdAt: new Date().toISOString()
            };
            
            this.bodyWeightRecords.push(record);
        }

        // Ordenar por fecha
        this.bodyWeightRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        this.saveData();
        this.renderBodyWeightChart();
        this.clearBodyWeightForm();
        this.showNotification('Peso corporal registrado correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('bodyWeightAdded', { weight, date, notes });
    }

    /**
     * Renderizar lista de entrenamientos
     */
    renderWorkouts() {
        const container = document.getElementById('workoutsList');
        const emptyState = document.getElementById('emptyGymState');
        
        if (!container) return;
        
        const filteredWorkouts = this.getFilteredWorkouts();
        
        if (filteredWorkouts.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-muted">No hay entrenamientos para mostrar</div>';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = filteredWorkouts.map(workout => this.createWorkoutHTML(workout)).join('');
    }

    /**
     * Obtener entrenamientos filtrados
     */
    getFilteredWorkouts() {
        let filtered = [...this.workouts];

        // Filtro por grupo muscular
        if (this.filters.muscleGroup) {
            filtered = filtered.filter(workout => 
                workout.exercises.some(exercise => 
                    this.getExerciseCategory(exercise.name) === this.filters.muscleGroup
                )
            );
        }

        // Filtro por tipo de entrenamiento
        if (this.filters.workoutType) {
            filtered = filtered.filter(workout => 
                workout.exercises.some(exercise => 
                    this.getExerciseType(exercise.name) === this.filters.workoutType
                )
            );
        }

        // Filtro de archivados
        if (!this.filters.showArchived) {
            filtered = filtered.filter(workout => !workout.archived);
        }

        // Ordenar por fecha más reciente
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        return filtered;
    }

    /**
     * Crear HTML para un entrenamiento
     */
    createWorkoutHTML(workout) {
        const exerciseList = workout.exercises.map(exercise => {
            const bestSet = exercise.sets.reduce((best, set) => 
                (set.weight * set.reps) > (best.weight * best.reps) ? set : best
            );
            
            return `
                <div class="exercise-summary">
                    <span class="exercise-name">${this.escapeHtml(exercise.name)}</span>
                    <span class="exercise-best">${bestSet.weight}kg x ${bestSet.reps}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="workout-item ${workout.archived ? 'archived' : ''}" data-id="${workout.id}">
                <div class="d-flex align-items-start">
                    <div class="workout-icon me-3">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <div class="workout-name fw-bold">${this.escapeHtml(workout.name)}</div>
                                <div class="workout-meta">
                                    <span><i class="fas fa-calendar"></i> ${this.formatDate(workout.date)}</span>
                                    <span><i class="fas fa-clock"></i> ${workout.duration} min</span>
                                    <span><i class="fas fa-weight-hanging"></i> ${workout.totalVolume.toFixed(0)} kg</span>
                                </div>
                            </div>
                        </div>
                        
                        ${workout.notes ? `<div class="workout-notes">${this.escapeHtml(workout.notes)}</div>` : ''}
                        
                        <div class="workout-exercises">
                            ${exerciseList}
                        </div>
                    </div>
                    
                    <div class="workout-actions ms-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="gym.editWorkout('${workout.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="gym.duplicateWorkout('${workout.id}')" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="gym.toggleArchiveWorkout('${workout.id}')" title="${workout.archived ? 'Desarchivar' : 'Archivar'}">
                            <i class="fas fa-${workout.archived ? 'box-open' : 'archive'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="gym.deleteWorkout('${workout.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar gráfico de peso corporal
     */
    renderBodyWeightChart() {
        const container = document.getElementById('weightProgressChart');
        if (!container) return;

        if (this.bodyWeightRecords.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-muted">No hay registros de peso</div>';
            return;
        }

        // Tomar últimos 10 registros
        const recentRecords = this.bodyWeightRecords.slice(-10);
        
        const chartHTML = `
            <h6 class="mb-3">Progreso de Peso Corporal</h6>
            <div class="weight-chart">
                ${recentRecords.map((record, index) => {
                    const isLatest = index === recentRecords.length - 1;
                    const prevRecord = index > 0 ? recentRecords[index - 1] : null;
                    const change = prevRecord ? record.weight - prevRecord.weight : 0;
                    
                    return `
                        <div class="weight-record ${isLatest ? 'latest' : ''}">
                            <div class="weight-date">${this.formatDate(record.date)}</div>
                            <div class="weight-value">
                                ${record.weight.toFixed(1)} kg
                                ${change !== 0 ? `<span class="weight-change ${change > 0 ? 'positive' : 'negative'}">${change > 0 ? '+' : ''}${change.toFixed(1)}</span>` : ''}
                            </div>
                            ${record.notes ? `<div class="weight-notes">${this.escapeHtml(record.notes)}</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        container.innerHTML = chartHTML;
    }

    /**
     * Actualizar estadísticas
     */
    updateStats() {
        const totalWorkouts = this.workouts.length;
        const thisWeek = this.getWorkoutsInRange('week').length;
        const thisMonth = this.getWorkoutsInRange('month').length;
        const totalVolume = this.workouts.reduce((sum, workout) => sum + workout.totalVolume, 0);

        const elements = {
            totalWorkouts: document.getElementById('totalWorkouts'),
            workoutsThisWeek: document.getElementById('workoutsThisWeek'),
            workoutsThisMonth: document.getElementById('workoutsThisMonth'),
            totalVolumeLifted: document.getElementById('totalVolumeLifted')
        };

        if (elements.totalWorkouts) elements.totalWorkouts.textContent = totalWorkouts;
        if (elements.workoutsThisWeek) elements.workoutsThisWeek.textContent = thisWeek;
        if (elements.workoutsThisMonth) elements.workoutsThisMonth.textContent = thisMonth;
        if (elements.totalVolumeLifted) elements.totalVolumeLifted.textContent = Math.round(totalVolume).toLocaleString();

        // Actualizar estadísticas rápidas
        this.updateQuickStats();
        
        // Trigger event
        this.dispatchEvent('statsUpdated', { totalWorkouts, thisWeek, thisMonth, totalVolume });
    }

    /**
     * Actualizar estadísticas rápidas
     */
    updateQuickStats() {
        const quickStatsContainer = document.getElementById('quickGymStats');
        if (!quickStatsContainer) return;

        const recentWorkouts = this.getWorkoutsInRange('week');
        const avgDuration = recentWorkouts.length > 0 ? 
            recentWorkouts.reduce((sum, w) => sum + w.duration, 0) / recentWorkouts.length : 0;
        
        const currentWeight = this.bodyWeightRecords.length > 0 ? 
            this.bodyWeightRecords[this.bodyWeightRecords.length - 1].weight : 0;

        const topPRs = Object.entries(this.personalRecords)
            .sort((a, b) => b[1].oneRM - a[1].oneRM)
            .slice(0, 3);

        quickStatsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-3 text-center">
                    <div class="stat-item">
                        <div class="stat-number text-primary">${recentWorkouts.length}</div>
                        <div class="stat-label">Esta Semana</div>
                    </div>
                </div>
                <div class="col-md-3 text-center">
                    <div class="stat-item">
                        <div class="stat-number text-success">${Math.round(avgDuration)}</div>
                        <div class="stat-label">Min Promedio</div>
                    </div>
                </div>
                <div class="col-md-3 text-center">
                    <div class="stat-item">
                        <div class="stat-number text-info">${currentWeight ? currentWeight.toFixed(1) : '-'}</div>
                        <div class="stat-label">Peso Actual (kg)</div>
                    </div>
                </div>
                <div class="col-md-3 text-center">
                    <div class="stat-item">
                        <div class="stat-number text-warning">${topPRs.length}</div>
                        <div class="stat-label">Récords Personales</div>
                    </div>
                </div>
            </div>
            
            ${topPRs.length > 0 ? `
                <div class="mt-3">
                    <h6>Top Récords Personales (1RM estimado):</h6>
                    <div class="personal-records">
                        ${topPRs.map(([exercise, pr]) => `
                            <div class="pr-item">
                                <span class="pr-exercise">${exercise}</span>
                                <span class="pr-weight">${pr.oneRM} kg</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    /**
     * Obtener entrenamientos en rango de tiempo
     */
    getWorkoutsInRange(range) {
        const now = new Date();
        let startDate;

        switch (range) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return this.workouts.filter(workout => new Date(workout.date) >= startDate);
    }

    /**
     * Editar entrenamiento
     */
    editWorkout(id) {
        const workout = this.workouts.find(w => w.id === id);
        if (!workout) return;

        this.currentEditId = id;
        
        // Llenar el formulario de edición
        const elements = {
            editWorkoutId: document.getElementById('editWorkoutId'),
            editWorkoutName: document.getElementById('editWorkoutName'),
            editWorkoutDate: document.getElementById('editWorkoutDate'),
            editWorkoutDuration: document.getElementById('editWorkoutDuration'),
            editWorkoutNotes: document.getElementById('editWorkoutNotes')
        };

        if (elements.editWorkoutId) elements.editWorkoutId.value = workout.id;
        if (elements.editWorkoutName) elements.editWorkoutName.value = workout.name;
        if (elements.editWorkoutDate) elements.editWorkoutDate.value = workout.date;
        if (elements.editWorkoutDuration) elements.editWorkoutDuration.value = workout.duration;
        if (elements.editWorkoutNotes) elements.editWorkoutNotes.value = workout.notes;

        // Cargar ejercicios
        this.loadExercisesInEditModal(workout.exercises);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('editWorkoutModal'));
        modal.show();
    }

    /**
     * Cargar ejercicios en modal de edición
     */
    loadExercisesInEditModal(exercises) {
        const container = document.getElementById('editWorkoutExercises');
        if (!container) return;

        container.innerHTML = exercises.map(exercise => `
            <div class="exercise-edit-item border rounded p-3 mb-3">
                <h6>${this.escapeHtml(exercise.name)}</h6>
                <div class="sets-summary">
                    ${exercise.sets.map(set => `
                        <div class="set-summary">
                            Serie ${set.set}: ${set.weight}kg x ${set.reps} reps
                            ${set.rest ? `(${set.rest}s descanso)` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Guardar cambios de edición
     */
    saveEditWorkout() {
        const id = this.currentEditId;
        const workout = this.workouts.find(w => w.id === id);
        
        if (!workout) return;

        const name = document.getElementById('editWorkoutName')?.value.trim();
        const date = document.getElementById('editWorkoutDate')?.value;
        const duration = parseInt(document.getElementById('editWorkoutDuration')?.value);
        const notes = document.getElementById('editWorkoutNotes')?.value.trim();

        if (!name || !date) {
            this.showNotification('El nombre y fecha son requeridos', 'warning');
            return;
        }

        workout.name = name;
        workout.date = date;
        workout.duration = duration || 60;
        workout.notes = notes;

        this.saveData();
        this.renderWorkouts();
        this.updateStats();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editWorkoutModal'));
        if (modal) {
            modal.hide();
        }
        
        this.showNotification('Entrenamiento actualizado correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('workoutUpdated', { workout });
    }

    /**
     * Duplicar entrenamiento
     */
    duplicateWorkout(id) {
        const originalWorkout = this.workouts.find(w => w.id === id);
        if (!originalWorkout) return;

        const duplicatedWorkout = {
            ...originalWorkout,
            id: this.generateId(),
            name: `${originalWorkout.name} (Copia)`,
            date: this.formatDateToString(new Date()),
            createdAt: new Date().toISOString()
        };

        this.workouts.unshift(duplicatedWorkout);
        this.saveData();
        this.renderWorkouts();
        this.updateStats();
        this.showNotification('Entrenamiento duplicado correctamente', 'success');
        
        // Trigger event
        this.dispatchEvent('workoutDuplicated', { originalWorkout, duplicatedWorkout });
    }

    /**
     * Alternar archivo de entrenamiento
     */
    toggleArchiveWorkout(id) {
        const workout = this.workouts.find(w => w.id === id);
        if (!workout) return;

        workout.archived = !workout.archived;
        
        this.saveData();
        this.renderWorkouts();
        this.showNotification(`Entrenamiento ${workout.archived ? 'archivado' : 'desarchivado'}`, 'info');
        
        // Trigger event
        this.dispatchEvent('workoutArchived', { workout, archived: workout.archived });
    }

    /**
     * Eliminar entrenamiento
     */
    deleteWorkout(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) {
            const workout = this.workouts.find(w => w.id === id);
            this.workouts = this.workouts.filter(w => w.id !== id);
            this.calculatePersonalRecords(); // Recalcular récords
            this.saveData();
            this.renderWorkouts();
            this.updateStats();
            this.showNotification('Entrenamiento eliminado', 'info');
            
            // Trigger event
            this.dispatchEvent('workoutDeleted', { workout });
        }
    }

    /**
     * Limpiar entrenamientos antiguos
     */
    clearOldWorkouts() {
        const months = parseInt(prompt('¿Eliminar entrenamientos anteriores a cuántos meses? (ej: 6)'));
        
        if (isNaN(months) || months <= 0) {
            this.showNotification('Por favor ingresa un número válido de meses', 'warning');
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);

        const oldWorkouts = this.workouts.filter(w => new Date(w.date) < cutoffDate);
        
        if (oldWorkouts.length === 0) {
            this.showNotification('No hay entrenamientos antiguos para eliminar', 'info');
            return;
        }

        if (confirm(`¿Eliminar ${oldWorkouts.length} entrenamientos anteriores a ${cutoffDate.toLocaleDateString()}?`)) {
            this.workouts = this.workouts.filter(w => new Date(w.date) >= cutoffDate);
            this.calculatePersonalRecords(); // Recalcular récords
            this.saveData();
            this.renderWorkouts();
            this.updateStats();
            this.showNotification(`${oldWorkouts.length} entrenamientos antiguos eliminados`, 'success');
            
            // Trigger event
            this.dispatchEvent('oldWorkoutsCleared', { count: oldWorkouts.length });
        }
    }

    /**
     * Exportar entrenamientos
     */
    exportWorkouts() {
        const data = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            workouts: this.workouts,
            bodyWeightRecords: this.bodyWeightRecords,
            personalRecords: this.personalRecords
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `entrenamientos-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Datos de gimnasio exportados', 'success');
        
        // Trigger event
        this.dispatchEvent('dataExported', { 
            workoutCount: this.workouts.length,
            bodyWeightCount: this.bodyWeightRecords.length,
            personalRecordCount: Object.keys(this.personalRecords).length
        });
    }

    /**
     * Limpiar formularios
     */
    clearWorkoutForm() {
        const form = document.getElementById('workoutForm');
        if (form) {
            form.reset();
        }

        const exercisesContainer = document.getElementById('workoutExercises');
        if (exercisesContainer) {
            exercisesContainer.innerHTML = '';
        }

        this.setTodayDate();
    }

    clearBodyWeightForm() {
        const form = document.getElementById('bodyWeightForm');
        if (form) {
            form.reset();
            this.setTodayDate();
        }
    }

    /**
     * Métodos helper
     */
    getExerciseCategory(exerciseName) {
        for (const [category, exercises] of Object.entries(this.exercises)) {
            if (exercises.some(ex => ex.name === exerciseName)) {
                return category;
            }
        }
        return 'other';
    }

    getExerciseType(exerciseName) {
        for (const exercises of Object.values(this.exercises)) {
            const exercise = exercises.find(ex => ex.name === exerciseName);
            if (exercise) {
                return exercise.type;
            }
        }
        return 'compound';
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
                this.workouts = data.workouts || [];
                this.bodyWeightRecords = data.bodyWeightRecords || [];
                this.personalRecords = data.personalRecords || {};
            }
            console.log(`💪 Datos cargados: ${this.workouts.length} entrenamientos, ${this.bodyWeightRecords.length} registros de peso`);
        } catch (error) {
            console.error('Error cargando datos del gimnasio:', error);
            this.showNotification('Error al cargar los datos del gimnasio', 'danger');
        }
    }

    /**
     * Guardar datos en localStorage
     */
    saveData() {
        try {
            const data = {
                workouts: this.workouts,
                bodyWeightRecords: this.bodyWeightRecords,
                personalRecords: this.personalRecords
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log(`💪 Datos guardados: ${this.workouts.length} entrenamientos, ${this.bodyWeightRecords.length} registros de peso`);
        } catch (error) {
            console.error('Error guardando datos del gimnasio:', error);
            this.showNotification('Error al guardar los datos del gimnasio', 'danger');
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
        const event = new CustomEvent(`gym${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
            detail: {
                module: 'gym',
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
        const totalWorkouts = this.workouts.length;
        const totalVolume = this.workouts.reduce((sum, w) => sum + w.totalVolume, 0);
        const avgDuration = totalWorkouts > 0 ? 
            this.workouts.reduce((sum, w) => sum + w.duration, 0) / totalWorkouts : 0;

        return {
            totalWorkouts,
            totalVolume: Math.round(totalVolume),
            avgDuration: Math.round(avgDuration),
            bodyWeightRecords: this.bodyWeightRecords.length,
            personalRecords: Object.keys(this.personalRecords).length,
            thisWeek: this.getWorkoutsInRange('week').length,
            thisMonth: this.getWorkoutsInRange('month').length,
            currentWeight: this.bodyWeightRecords.length > 0 ? 
                this.bodyWeightRecords[this.bodyWeightRecords.length - 1].weight : 0,
            topPRs: Object.entries(this.personalRecords)
                .sort((a, b) => b[1].oneRM - a[1].oneRM)
                .slice(0, 5)
        };
    }

    /**
     * Resetear módulo
     */
    reset() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos del gimnasio?')) {
            this.workouts = [];
            this.bodyWeightRecords = [];
            this.personalRecords = {};
            this.saveData();
            this.renderWorkouts();
            this.renderBodyWeightChart();
            this.updateStats();
            this.showNotification('Todos los datos del gimnasio han sido eliminados', 'info');
            
            // Trigger event
            this.dispatchEvent('moduleReset');
        }
    }

    /**
     * Destruir módulo (cleanup)
     */
    destroy() {
        console.log('💪 Gym Module destruido');
        this.isInitialized = false;
    }
}

// Crear instancia global del módulo de gimnasio
window.gym = new GymModule();

// Compatibilidad con código existente
window.GymModule = GymModule;

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.gym && !window.gym.isInitialized) {
        // Solo inicializar si el módulo está activo
        setTimeout(() => {
            if (document.getElementById('module-gym')) {
                window.gym.init();
            }
        }, 500);
    }
});

// Event listeners para integración con otros módulos
document.addEventListener('gymWorkoutAdded', (e) => {
    console.log('💪 Nuevo entrenamiento agregado:', e.detail.workout.name);
    
    // Crear tarea de felicitación en agenda si está disponible
    if (window.agenda) {
        const celebrationTask = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            title: `💪 Entrenamiento completado: ${e.detail.workout.name}`,
            description: `¡Excelente! Completaste ${e.detail.workout.exercises.length} ejercicios en ${e.detail.workout.duration} minutos`,
            type: 'recordatorio',
            category: 'personal',
            priority: 'baja',
            date: new Date().toISOString().split('T')[0],
            completed: true,
            createdAt: new Date().toISOString()
        };
        
        // Opcional: Auto-agregar a agenda (comentar si no se desea)
        // window.agenda.tasks.unshift(celebrationTask);
        // window.agenda.saveTasks();
    }
});

document.addEventListener('gymBodyWeightAdded', (e) => {
    console.log('⚖️ Peso corporal registrado:', e.detail.weight + 'kg');
});

// Debugging helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugGym = () => {
        console.log('🔍 Debug Info - Gym:', window.gym.getStats());
        console.log('🔍 Entrenamientos:', window.gym.workouts.length);
        console.log('🔍 Registros de peso:', window.gym.bodyWeightRecords.length);
        console.log('🔍 Récords personales:', Object.keys(window.gym.personalRecords).length);
    };
    
    console.log('🛠️ Debug mode: Usa debugGym() para ver información del módulo');
}

console.log('💪 Gym Module cargado correctamente');