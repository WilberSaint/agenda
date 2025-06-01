/**
 * App Controller - Agenda Personal Pro
 * Controlador principal que maneja la aplicación completa
 */

class AppController {
    constructor() {
        this.currentModule = 'agenda';
        this.modules = {
            agenda: {
                name: 'Agenda',
                icon: 'fas fa-calendar-check',
                active: true,
                initialized: false
            },
            habits: {
                name: 'Hábitos',
                icon: 'fas fa-repeat',
                active: false,
                comingSoon: false,
                initialized: false
            },
            goals: {
                name: 'Metas',
                icon: 'fas fa-bullseye',
                active: false,
                comingSoon: false,
                initialized: false
            },
            gym: {
                name: 'Gimnasio',
                icon: 'fas fa-dumbbell',
                active: false,
                comingSoon: false,
                initialized: false
            },
            finances: {
                name: 'Finanzas',
                icon: 'fas fa-wallet',
                active: false,
                comingSoon: false,
                initialized: false
            },
            dashboard: {
                name: 'Dashboard',
                icon: 'fas fa-chart-line',
                active: false,
                comingSoon: true
            }
        };
        
        this.isMobile = window.innerWidth <= 991.98;
        this.sidebarOpen = false;
        this.loadingScreen = null;
        this.installPrompt = null;
        
        this.init();
    }

    /**
     * Inicializar la aplicación
     */
    init() {
        console.log('🚀 Inicializando Agenda Personal Pro...');
        
        this.showLoadingScreen();
        this.bindEvents();
        this.initializeModules();
        this.handleMobileDetection();
        this.handlePWAInstall();
        this.loadUserPreferences();
        
        // Ocultar loading screen después de inicializar
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1000);

        //mostrar navbar en desktop
        // Si no es móvil, asegurar que el sidebar esté visible
        if (!this.isMobile) {
             this.openSidebar();
        }

        
        console.log('✅ Agenda Personal Pro inicializada correctamente');
    }

    /**
     * Mostrar pantalla de carga
     */
    showLoadingScreen() {
        this.loadingScreen = document.getElementById('loading-screen');
        const appContainer = document.getElementById('app-container');
        
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
        
        if (appContainer) {
            appContainer.style.display = 'none';
        }
    }

    /**
     * Ocultar pantalla de carga con animación suave
     */
    hideLoadingScreen() {
        const appContainer = document.getElementById('app-container');
        
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }
        
        if (appContainer) {
            appContainer.style.display = 'flex';
            appContainer.style.opacity = '0';
            appContainer.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                appContainer.style.opacity = '1';
            }, 100);
        }
    }

    /**
     * Vincular todos los eventos de la aplicación
     */
bindEvents() {
    // Navigation events
    this.bindNavigationEvents();
    
    // Mobile events
    this.bindMobileEvents();
    
    // Window events
    this.bindWindowEvents();
    
    // Keyboard shortcuts
    this.bindKeyboardShortcuts();
    
    // PWA events
    this.bindPWAEvents();

    // ===== INTEGRACIÓN CON MÓDULO DE HÁBITOS =====
    // Event listeners para integración con hábitos
    document.addEventListener('habitsHabitCompleted', (e) => {
        console.log('🎉 Hábito completado:', e.detail.habit.name);
        
        // Opcional: Crear una tarea de celebración en la agenda
        if (window.agenda && e.detail.habit) {
            const celebrationTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `🎉 Completé: ${e.detail.habit.name}`,
                description: `¡Felicidades! Completaste tu hábito de ${e.detail.habit.name}`,
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

    document.addEventListener('habitsModuleInitialized', () => {
        console.log('✅ Módulo de Hábitos completamente inicializado');
    });

    // ===== INTEGRACIÓN CON MÓDULO DE METAS =====
    // Event listeners para integración con metas
    document.addEventListener('goalsGoalCompleted', (e) => {
        console.log('🎉 Meta completada:', e.detail.goal.title);
        
        // Crear tarea de celebración en agenda
        if (window.agenda && e.detail.goal) {
            const celebrationTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `🎉 Meta alcanzada: ${e.detail.goal.title}`,
                description: `¡Felicidades! Has completado tu meta: ${e.detail.goal.description || e.detail.goal.title}`,
                type: 'recordatorio',
                category: 'personal',
                priority: 'alta',
                date: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            window.agenda.tasks.unshift(celebrationTask);
            window.agenda.saveTasks();
            window.agenda.renderTasks();
            window.agenda.updateStats();
        }
    });

    document.addEventListener('goalsMilestoneCompleted', (e) => {
        console.log('🏁 Milestone completado:', e.detail.milestone.title);
        
        // Opcional: Crear recordatorio para revisar progreso
        if (window.agenda && e.detail.milestone && e.detail.goal) {
            const reminderTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `🏁 Milestone completado: ${e.detail.milestone.title}`,
                description: `¡Excelente progreso! Completaste un milestone de: ${e.detail.goal.title}`,
                type: 'recordatorio',
                category: 'personal',
                priority: 'media',
                date: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Opcional: Auto-agregar a agenda (comentar si no se desea)
            // window.agenda.tasks.unshift(reminderTask);
            // window.agenda.saveTasks();
            // window.agenda.renderTasks();
            // window.agenda.updateStats();
        }
    });

    document.addEventListener('goalsModuleInitialized', () => {
        console.log('✅ Módulo de Metas completamente inicializado');
    });

    // ===== INTEGRACIÓN CON MÓDULO DE GIMNASIO =====
    // Event listeners para integración con gimnasio
    document.addEventListener('gymWorkoutAdded', (e) => {
        console.log('💪 Nuevo entrenamiento agregado:', e.detail.workout.name);
        
        // Crear tarea de felicitación en agenda
        if (window.agenda && e.detail.workout) {
            const celebrationTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `💪 Entrenamiento completado: ${e.detail.workout.name}`,
                description: `¡Excelente! Completaste ${e.detail.workout.exercises.length} ejercicios en ${e.detail.workout.duration} minutos. Volumen total: ${e.detail.workout.totalVolume.toFixed(0)}kg`,
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
            // window.agenda.renderTasks();
            // window.agenda.updateStats();
        }
    });

    document.addEventListener('gymBodyWeightAdded', (e) => {
        console.log('⚖️ Peso corporal registrado:', e.detail.weight + 'kg');
        
        // Crear recordatorio para seguimiento si hay cambio significativo
        if (window.agenda && e.detail.weight) {
            const reminderTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `⚖️ Peso registrado: ${e.detail.weight}kg`,
                description: `Peso corporal actualizado${e.detail.notes ? ': ' + e.detail.notes : ''}`,
                type: 'recordatorio',
                category: 'personal',
                priority: 'baja',
                date: new Date().toISOString().split('T')[0],
                completed: true,
                createdAt: new Date().toISOString()
            };
            
            // Opcional: Auto-agregar a agenda (comentar si no se desea)
            // window.agenda.tasks.unshift(reminderTask);
            // window.agenda.saveTasks();
            // window.agenda.renderTasks();
            // window.agenda.updateStats();
        }
    });

    document.addEventListener('gymModuleInitialized', () => {
        console.log('✅ Módulo de Gimnasio completamente inicializado');
    });

    // ===== INTEGRACIÓN CON MÓDULO DE FINANZAS =====
    // Event listeners para integración con finanzas
    document.addEventListener('financesTransactionAdded', (e) => {
        console.log('💰 Nueva transacción:', e.detail.transaction);
        
        // Opcional: Crear recordatorio en agenda si es un gasto grande
        if (window.agenda && e.detail.transaction.type === 'expense' && e.detail.transaction.amount > 1000) {
            const reminderTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `💰 Gasto importante: ${e.detail.transaction.description}`,
                description: `Registraste un gasto de $${e.detail.transaction.amount} en ${e.detail.transaction.category}. Considera revisar tu presupuesto.`,
                type: 'recordatorio',
                category: 'pagos',
                priority: 'media',
                date: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Opcional: Auto-agregar a agenda (comentar si no se desea)
            // window.agenda.tasks.unshift(reminderTask);
            // window.agenda.saveTasks();
            // window.agenda.renderTasks();
            // window.agenda.updateStats();
        }
    });

    document.addEventListener('financesBudgetAdded', (e) => {
        console.log('📊 Nuevo presupuesto creado:', e.detail.budget.name);
        
        // Crear recordatorio para revisar presupuesto
        if (window.agenda && e.detail.budget) {
            const reminderTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `📊 Revisar presupuesto: ${e.detail.budget.name}`,
                description: `Presupuesto de $${e.detail.budget.totalAmount} creado. Recuerda monitorear tus gastos.`,
                type: 'recordatorio',
                category: 'pagos',
                priority: 'media',
                date: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Opcional: Auto-agregar a agenda (comentar si no se desea)
            // window.agenda.tasks.unshift(reminderTask);
            // window.agenda.saveTasks();
            // window.agenda.renderTasks();
            // window.agenda.updateStats();
        }
    });

    document.addEventListener('financesBudgetExceeded', (e) => {
        console.log('🚨 Presupuesto excedido:', e.detail.budget);
        
        // Crear tarea urgente en agenda
        if (window.agenda && e.detail.budget) {
            const alertTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `🚨 Presupuesto excedido: ${e.detail.budget.name}`,
                description: `Tu presupuesto "${e.detail.budget.name}" ha sido excedido. Revisa tus gastos y ajusta tu presupuesto.`,
                type: 'recordatorio',
                category: 'pagos',
                priority: 'urgente',
                date: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            window.agenda.tasks.unshift(alertTask);
            window.agenda.saveTasks();
            window.agenda.renderTasks();
            window.agenda.updateStats();
        }
    });

    document.addEventListener('financesSavingsGoalAdded', (e) => {
        console.log('🎯 Nueva meta de ahorro:', e.detail.savingsGoal.name);
        
        // Crear recordatorio para revisar progreso de ahorro
        if (window.agenda && e.detail.savingsGoal) {
            const reminderTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `🎯 Meta de ahorro: ${e.detail.savingsGoal.name}`,
                description: `Meta de $${e.detail.savingsGoal.targetAmount} creada. ¡Mantente enfocado en tu objetivo!`,
                type: 'recordatorio',
                category: 'personal',
                priority: 'media',
                date: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Opcional: Auto-agregar a agenda (comentar si no se desea)
            // window.agenda.tasks.unshift(reminderTask);
            // window.agenda.saveTasks();
            // window.agenda.renderTasks();
            // window.agenda.updateStats();
        }
    });

    document.addEventListener('financesSavingsGoalCompleted', (e) => {
        console.log('🎉 Meta de ahorro completada:', e.detail.goal);
        
        // Crear tarea de celebración en agenda
        if (window.agenda && e.detail.goal) {
            const celebrationTask = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: `🎉 Meta de ahorro alcanzada: ${e.detail.goal.name}`,
                description: `¡Felicidades! Completaste tu meta de ahorro: ${e.detail.goal.name} por $${e.detail.goal.targetAmount}`,
                type: 'recordatorio',
                category: 'personal',
                priority: 'alta',
                date: new Date().toISOString().split('T')[0],
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            window.agenda.tasks.unshift(celebrationTask);
            window.agenda.saveTasks();
            window.agenda.renderTasks();
            window.agenda.updateStats();
        }
    });

    document.addEventListener('financesModuleInitialized', () => {
        console.log('✅ Módulo de Finanzas completamente inicializado');
    });

    // ===== INTEGRACIÓN CRUZADA ENTRE MÓDULOS =====
    // Cuando se completa una tarea relacionada con ejercicio
    document.addEventListener('agendaTaskCompleted', (e) => {
        if (e.detail.task.category === 'personal' && 
            (e.detail.task.title.toLowerCase().includes('ejercicio') || 
             e.detail.task.title.toLowerCase().includes('gym') ||
             e.detail.task.title.toLowerCase().includes('entrenar'))) {
            console.log('💡 Sugerencia: Registra este entrenamiento en el módulo de Gimnasio');
        }

        // Cuando se completa una tarea relacionada con dinero
        if (e.detail.task.category === 'pagos' || 
            e.detail.task.title.toLowerCase().includes('pagar') ||
            e.detail.task.title.toLowerCase().includes('comprar') ||
            e.detail.task.title.toLowerCase().includes('gasto')) {
            console.log('💡 Sugerencia: Registra este gasto en el módulo de Finanzas');
            
            // Opcional: Mostrar notificación
            if (window.ThemeManager) {
                window.ThemeManager.createToast(
                    '💡 ¿Registrar este gasto en Finanzas?', 
                    'info', 
                    'fas fa-wallet'
                );
            }
        }
    });

    // Cuando se completa un hábito relacionado con metas
    document.addEventListener('habitsHabitCompleted', (e) => {
        console.log('🔗 Hábito completado, verificando si está relacionado con alguna meta...');
        
        // Verificar si el hábito está relacionado con finanzas
        if (e.detail.habit.name.toLowerCase().includes('ahorro') ||
            e.detail.habit.name.toLowerCase().includes('dinero') ||
            e.detail.habit.category === 'financial') {
            console.log('💰 Hábito financiero completado, considera actualizar tus metas de ahorro');
            
            // Opcional: Mostrar notificación
            if (window.ThemeManager) {
                window.ThemeManager.createToast(
                    '💰 ¡Buen hábito financiero! Revisa tus metas de ahorro', 
                    'success', 
                    'fas fa-piggy-bank'
                );
            }
        }
    });

    // Cuando se completa una meta relacionada con dinero
    document.addEventListener('goalsGoalCompleted', (e) => {
        if (e.detail.goal.category === 'financial') {
            console.log('🎯 Meta financiera completada, considera crear una nueva meta de ahorro');
            
            // Opcional: Mostrar notificación
            if (window.ThemeManager) {
                window.ThemeManager.createToast(
                    '🎯 Meta financiera completada! Crea una nueva en Finanzas', 
                    'success', 
                    'fas fa-wallet'
                );
            }
        }
    });

    // ===== EVENT LISTENERS PARA ACCIONES RÁPIDAS DE FINANZAS =====
    document.addEventListener('DOMContentLoaded', function() {
        // Exportar finanzas
        const exportBtn = document.getElementById('exportFinances');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (window.finances) {
                    window.finances.exportTransactions();
                } else {
                    console.warn('Módulo de finanzas no está disponible');
                }
            });
        }
        
        // Generar reporte
        const reportBtn = document.getElementById('generateReport');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                if (window.finances) {
                    const report = window.finances.generateMonthlyReport();
                    console.log('📈 Reporte generado:', report);
                    if (window.ThemeManager) {
                        window.ThemeManager.createToast('Reporte generado en consola', 'info', 'fas fa-chart-line');
                    }
                } else {
                    console.warn('Módulo de finanzas no está disponible');
                }
            });
        }
        
        // Limpiar transacciones antiguas
        const clearBtn = document.getElementById('clearOldFinances');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (window.finances) {
                    window.finances.clearOldTransactions();
                } else {
                    console.warn('Módulo de finanzas no está disponible');
                }
            });
        }

        // ===== EVENT LISTENER PARA SELECCIÓN DE EJERCICIOS =====
        // Script para manejar la selección de ejercicios
        const exerciseSelect = document.getElementById('exerciseName');
        const categoryInput = document.getElementById('exerciseCategory');
        
        if (exerciseSelect && categoryInput) {
            exerciseSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const category = selectedOption.getAttribute('data-category') || '';
                categoryInput.value = category;
            });
        }
        
        // Establecer fecha de hoy para el peso corporal
        const weightDate = document.getElementById('weightDate');
        if (weightDate) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            weightDate.value = todayStr;
        }

        // ===== EVENT LISTENERS PARA FORMULARIOS DE FINANZAS =====
        // Cambio de tipo de transacción para actualizar categorías
        const transactionType = document.getElementById('transactionType');
        if (transactionType) {
            transactionType.addEventListener('change', (e) => {
                if (window.finances) {
                    window.finances.updateCategoryOptions(e.target.value);
                }
            });
        }

        // Período de presupuesto
        const budgetPeriod = document.getElementById('budgetPeriod');
        if (budgetPeriod) {
            budgetPeriod.addEventListener('change', (e) => {
                if (window.finances) {
                    window.finances.currentBudgetPeriod = e.target.value;
                    window.finances.updateDashboard();
                }
            });
        }

        // Filtros de finanzas
        const financeFilters = ['filterTransactionType', 'filterCategory', 'filterDateRange'];
        financeFilters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    if (window.finances) {
                        window.finances.renderTransactions();
                    }
                });
            }
        });
    });

    // ===== FUNCIONES GLOBALES DE INTEGRACIÓN =====
    // Función para agregar gasto rápido desde otros módulos
    window.addQuickExpense = function(amount, description, category = 'other_expense') {
        if (window.finances) {
            return window.finances.addQuickExpense(amount, category, description);
        }
        console.warn('Módulo de finanzas no está disponible');
        return null;
    };

    // Función para agregar ingreso rápido desde otros módulos
    window.addQuickIncome = function(amount, description, category = 'other_income') {
        if (window.finances) {
            return window.finances.addQuickIncome(amount, category, description);
        }
        console.warn('Módulo de finanzas no está disponible');
        return null;
    };

    // Función para obtener resumen financiero desde otros módulos
    window.getFinancialSummary = function() {
        if (window.finances) {
            return window.finances.getFinancialSummary();
        }
        console.warn('Módulo de finanzas no está disponible');
        return null;
    };
}
//FIN DE bindEvents


    /**
     * Eventos de navegación
     */
    bindNavigationEvents() {
        // Navigation links en sidebar
        document.querySelectorAll('.sidebar .nav-link[data-module]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const moduleName = link.getAttribute('data-module');
                
                if (!link.classList.contains('disabled')) {
                    this.switchModule(moduleName);
                } else {
                    this.showComingSoonNotification(moduleName);
                }
            });
        });
    }

    /**
     * Eventos móviles
     */
    bindMobileEvents() {
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Sidebar overlay
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Touch events para swipe gestures
        this.bindSwipeGestures();
    }

    /**
     * Eventos de ventana
     */
    bindWindowEvents() {
        // Resize events
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Before unload - guardar estado
        window.addEventListener('beforeunload', () => {
            this.saveAppState();
        });

        // Online/offline events
        window.addEventListener('online', () => {
            this.handleConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleConnectionChange(false);
        });
    }

    /**
     * Atajos de teclado
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + número para cambiar módulos
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                const moduleIndex = parseInt(e.key) - 1;
                const moduleNames = Object.keys(this.modules);
                
                if (moduleNames[moduleIndex]) {
                    this.switchModule(moduleNames[moduleIndex]);
                }
            }

            // ESC para cerrar sidebar en móvil
            if (e.key === 'Escape' && this.sidebarOpen && this.isMobile) {
                this.closeSidebar();
            }

            // Ctrl/Cmd + K para búsqueda rápida (futuro)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showQuickSearch();
            }
        });
    }

    /**
     * Eventos PWA
     */
    bindPWAEvents() {
        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallButton();
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            this.hideInstallButton();
            this.showNotification('¡App instalada correctamente!', 'success', 'fas fa-check-circle');
        });
    }

    /**
     * Gestos de swipe para móvil
     */
    bindSwipeGestures() {
        let startX = 0;
        let startY = 0;
        const threshold = 100;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;

            // Swipe horizontal más pronunciado que vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                if (diffX > 0) {
                    // Swipe left - cerrar sidebar
                    if (this.sidebarOpen) {
                        this.closeSidebar();
                    }
                } else {
                    // Swipe right - abrir sidebar
                    if (!this.sidebarOpen && this.isMobile) {
                        this.openSidebar();
                    }
                }
            }

            startX = 0;
            startY = 0;
        }, { passive: true });
    }

    /**
     * Cambiar entre módulos
     * @param {string} moduleName - Nombre del módulo
     */
    switchModule(moduleName) {
        if (!this.modules[moduleName]) {
            console.error(`Módulo "${moduleName}" no existe`);
            return;
        }

        const module = this.modules[moduleName];
        
        if (module.comingSoon) {
            this.showComingSoonNotification(moduleName);
            return;
        }

        // Ocultar módulo actual
        this.hideCurrentModule();

        // Actualizar estado
        this.currentModule = moduleName;
        this.modules[moduleName].active = true;

        // Mostrar nuevo módulo
        this.showModule(moduleName);

        // Actualizar navegación
        this.updateNavigation();

        // Inicializar módulo si es necesario
        if (!module.initialized) {
            this.initializeModule(moduleName);
            module.initialized = true;
        }

        // Cerrar sidebar en móvil
        if (this.isMobile) {
            this.closeSidebar();
        }

        console.log(`📱 Módulo cambiado a: ${moduleName}`);
    }

    /**
     * Ocultar módulo actual
     */
    hideCurrentModule() {
        Object.keys(this.modules).forEach(moduleKey => {
            this.modules[moduleKey].active = false;
            const moduleElement = document.getElementById(`module-${moduleKey}`);
            if (moduleElement) {
                moduleElement.classList.remove('active');
            }
        });
    }

    /**
     * Mostrar módulo específico
     * @param {string} moduleName - Nombre del módulo
     */
    showModule(moduleName) {
        const moduleElement = document.getElementById(`module-${moduleName}`);
        if (moduleElement) {
            moduleElement.classList.add('active');
        }
    }

    /**
     * Actualizar navegación visual
     */
    updateNavigation() {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`.sidebar .nav-link[data-module="${this.currentModule}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * Inicializar módulos específicos
     */
    initializeModules() {
        // Inicializar módulo de agenda por defecto
        this.initializeModule('agenda');
        this.modules.agenda.initialized = true;
    }

    /**
     * Inicializar módulo específico
     * @param {string} moduleName - Nombre del módulo
     */
    initializeModule(moduleName) {
        switch (moduleName) {
            case 'agenda':
                // El módulo de agenda se inicializa automáticamente con su script
                break;
            case 'habits':
                this.initializeHabitsModule();
                break;
            case 'goals':
                this.initializeGoalsModule();
                break;
            case 'gym':
                this.initializeGymModule();
                break;
            case 'finances':
                this.initializeFinancesModule();
                break;    
            case 'dashboard':
                this.initializeDashboardModule();
                break;
        }
    }

    /**
     * Placeholder para módulos futuros
     */
    initializeHabitsModule() {
        console.log('🔄 Inicializando módulo de Hábitos...');
    
    // Verificar si el módulo de hábitos está disponible
    if (window.habits && typeof window.habits.init === 'function') {
        if (!window.habits.isInitialized) {
            window.habits.init();
        }
        console.log('✅ Módulo de Hábitos inicializado correctamente');
    } else {
        console.warn('⚠️ Módulo de Hábitos no encontrado');
    }
    }


initializeGoalsModule() {
    console.log('🎯 Inicializando módulo de Metas...');
    
    // Verificar si el módulo de metas está disponible
    if (window.goals && typeof window.goals.init === 'function') {
        if (!window.goals.isInitialized) {
            window.goals.init();
        }
        console.log('✅ Módulo de Metas inicializado correctamente');
    } else {
        console.warn('⚠️ Módulo de Metas no encontrado');
    }
}

// 2. ACTUALIZAR app.js - Método initializeGymModule():
initializeGymModule() {
    console.log('💪 Inicializando módulo de Gimnasio...');
    
    // Verificar si el módulo de gimnasio está disponible
    if (window.gym && typeof window.gym.init === 'function') {
        if (!window.gym.isInitialized) {
            window.gym.init();
        }
        console.log('✅ Módulo de Gimnasio inicializado correctamente');
    } else {
        console.warn('⚠️ Módulo de Gimnasio no encontrado');
    }
}

initializeFinancesModule() {
    console.log('💰 Inicializando módulo de Finanzas...');
    
    // Verificar si el módulo de finanzas está disponible
    if (window.finances && typeof window.finances.init === 'function') {
        if (!window.finances.isInitialized) {
            window.finances.init();
        }
        console.log('✅ Módulo de Finanzas inicializado correctamente');
    } else {
        console.warn('⚠️ Módulo de Finanzas no encontrado');
    }
}

    initializeDashboardModule() {
        console.log('📊 Inicializando Dashboard...');
        // TODO: Implementar cuando creemos el módulo
    }

    /**
     * Manejo de dispositivos móviles
     */
    handleMobileDetection() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');

        if (this.isMobile) {
            sidebar?.classList.remove('active');
            this.sidebarOpen = false;
        }
    }

    /**
     *  Listener de eventos
     */


    /**
     * Manejar cambios de tamaño de ventana
     */
    handleResize() {
        const newIsMobile = window.innerWidth <= 991.98;
        
        if (newIsMobile !== this.isMobile) {
            this.isMobile = newIsMobile;
            
            if (!this.isMobile) {
                // Cambió a desktop - mostrar sidebar
                this.openSidebar();
            } else {
                // Cambió a móvil - ocultar sidebar
                this.closeSidebar();
            }
        }
    }

    /**
     * Abrir sidebar
     */
    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.add('active');
        }
        
        if (overlay && this.isMobile) {
            overlay.classList.add('active');
        }
        
        this.sidebarOpen = true;
        
        // Prevenir scroll del body en móvil
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Cerrar sidebar
     */
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        this.sidebarOpen = false;
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
    }

    /**
     * Alternar sidebar
     */
    toggleSidebar() {
        if (this.sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * PWA Install functionality
     */
    handlePWAInstall() {
        const installButton = document.getElementById('install-button');
        
        if (installButton) {
            installButton.addEventListener('click', async () => {
                if (this.installPrompt) {
                    this.installPrompt.prompt();
                    const result = await this.installPrompt.userChoice;
                    
                    if (result.outcome === 'accepted') {
                        console.log('👍 Usuario aceptó instalar la PWA');
                    } else {
                        console.log('👎 Usuario rechazó instalar la PWA');
                    }
                    
                    this.installPrompt = null;
                    this.hideInstallButton();
                }
            });
        }
    }

    /**
     * Mostrar botón de instalación
     */
    showInstallButton() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.style.display = 'block';
        }
    }

    /**
     * Ocultar botón de instalación
     */
    hideInstallButton() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    /**
     * Manejar cambios de conexión
     * @param {boolean} isOnline - Si hay conexión
     */
    handleConnectionChange(isOnline) {
        const message = isOnline ? 'Conexión restaurada' : 'Sin conexión - Modo offline';
        const type = isOnline ? 'success' : 'warning';
        const icon = isOnline ? 'fas fa-wifi' : 'fas fa-wifi-slash';
        
        this.showNotification(message, type, icon);
        
        // Actualizar UI según estado de conexión
        document.body.classList.toggle('offline', !isOnline);
    }

    /**
     * Mostrar notificación "Próximamente"
     * @param {string} moduleName - Nombre del módulo
     */
    showComingSoonNotification(moduleName) {
        const module = this.modules[moduleName];
        const message = `${module.name} estará disponible pronto`;
        this.showNotification(message, 'info', module.icon);
    }

    /**
     * Búsqueda rápida (placeholder)
     */
    showQuickSearch() {
        this.showNotification('Búsqueda rápida próximamente', 'info', 'fas fa-search');
    }

    /**
     * Mostrar notificación
     * @param {string} message - Mensaje
     * @param {string} type - Tipo (success, info, warning, danger)
     * @param {string} icon - Clase del ícono
     */
    showNotification(message, type = 'info', icon = 'fas fa-info-circle') {
        if (window.ThemeManager && typeof window.ThemeManager.createToast === 'function') {
            window.ThemeManager.createToast(message, type, icon);
        } else {
            // Fallback simple
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Cargar preferencias del usuario
     */
    loadUserPreferences() {
        try {
            const preferences = localStorage.getItem('agenda-preferences');
            if (preferences) {
                this.userPreferences = JSON.parse(preferences);
            } else {
                this.userPreferences = this.getDefaultPreferences();
            }
        } catch (error) {
            console.warn('No se pudieron cargar las preferencias:', error);
            this.userPreferences = this.getDefaultPreferences();
        }
    }

    /**
     * Obtener preferencias por defecto
     * @returns {object} - Preferencias por defecto
     */
    getDefaultPreferences() {
        return {
            sidebarAutoClose: true,
            notifications: true,
            quickSearch: true,
            keyboardShortcuts: true
        };
    }

    /**
     * Guardar estado de la aplicación
     */
    saveAppState() {
        try {
            const appState = {
                currentModule: this.currentModule,
                sidebarOpen: this.sidebarOpen,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('agenda-app-state', JSON.stringify(appState));
        } catch (error) {
            console.warn('No se pudo guardar el estado de la app:', error);
        }
    }

    /**
     * Utilidad debounce
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera
     * @returns {Function} - Función debounced
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Obtener información de la aplicación
     * @returns {object} - Info de la app
     */
    getAppInfo() {
        return {
            version: '1.0.0',
            currentModule: this.currentModule,
            modules: this.modules,
            isMobile: this.isMobile,
            sidebarOpen: this.sidebarOpen,
            online: navigator.onLine,
            preferences: this.userPreferences
        };
    }
}

// Crear instancia global de la aplicación
window.AppController = new AppController();

// Debugging helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugApp = () => {
        console.log('🔍 Debug Info - App:', window.AppController.getAppInfo());
    };
    
    window.switchToModule = (moduleName) => {
        window.AppController.switchModule(moduleName);
    };
    
    console.log('🛠️ Debug mode: Usa debugApp() y switchToModule(name) para debug');
}

console.log('🎉 App Controller cargado - Agenda Personal Pro lista!');