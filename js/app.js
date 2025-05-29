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
                comingSoon: true
            },
            goals: {
                name: 'Metas',
                icon: 'fas fa-bullseye',
                active: false,
                comingSoon: true
            },
            gym: {
                name: 'Gimnasio',
                icon: 'fas fa-dumbbell',
                active: false,
                comingSoon: true
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
    }

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
        // TODO: Implementar cuando creemos el módulo
    }

    initializeGoalsModule() {
        console.log('🎯 Inicializando módulo de Metas...');
        // TODO: Implementar cuando creemos el módulo
    }

    initializeGymModule() {
        console.log('💪 Inicializando módulo de Gimnasio...');
        // TODO: Implementar cuando creemos el módulo
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