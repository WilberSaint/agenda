/**
 * Theme Manager - Agenda Personal Pro
 * Maneja el cambio dinámico entre temas masculine y feminine
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'masculine'; // tema por defecto
        this.themes = {
            masculine: {
                name: 'Profesional',
                icon: 'fas fa-briefcase',
                description: 'Diseño elegante y profesional con tonos azul-gris',
                cssFile: 'css/themes/masculine.css',
                manifestThemeColor: '#334155'
            },
            feminine: {
                name: 'Elegante',
                icon: 'fas fa-heart',
                description: 'Diseño delicado y colorido con tonos rosa-violeta',
                cssFile: 'css/themes/feminine.css',
                manifestThemeColor: '#F8BBD9'
            }
        };
        
        this.init();
    }

    /**
     * Inicializar el Theme Manager
     */
    init() {
        this.loadSavedTheme();
        this.updateUI();
        this.bindEvents();
        
        // Aplicar tema inicial después de un pequeño delay para suavizar carga
        setTimeout(() => {
            this.applyTheme(this.currentTheme, false);
        }, 100);
        
        console.log(`🎨 Theme Manager inicializado - Tema actual: ${this.currentTheme}`);
    }

    /**
     * Cargar tema guardado del localStorage
     */
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('agenda-theme');
            if (savedTheme && this.themes[savedTheme]) {
                this.currentTheme = savedTheme;
            }
        } catch (error) {
            console.warn('No se pudo cargar el tema guardado:', error);
        }
    }

    /**
     * Guardar tema actual en localStorage
     */
    saveTheme() {
        try {
            localStorage.setItem('agenda-theme', this.currentTheme);
        } catch (error) {
            console.warn('No se pudo guardar el tema:', error);
        }
    }

    /**
     * Cambiar al tema especificado
     * @param {string} themeName - Nombre del tema (masculine/feminine)
     * @param {boolean} animate - Si aplicar animación de transición
     */
    switch(themeName, animate = true) {
        if (!this.themes[themeName]) {
            console.error(`Tema "${themeName}" no existe`);
            return;
        }

        if (this.currentTheme === themeName) {
            console.log(`Ya estás usando el tema "${themeName}"`);
            return;
        }

        const previousTheme = this.currentTheme;
        this.currentTheme = themeName;

        if (animate) {
            this.animateThemeChange(previousTheme, themeName);
        } else {
            this.applyTheme(themeName);
        }

        this.saveTheme();
        this.updateUI();
        this.showThemeChangeNotification(themeName);
        
        console.log(`🎨 Tema cambiado: ${previousTheme} → ${themeName}`);
    }

    /**
     * Aplicar tema con animación suave
     * @param {string} previousTheme - Tema anterior
     * @param {string} newTheme - Nuevo tema
     */
    animateThemeChange(previousTheme, newTheme) {
        const appContainer = document.getElementById('app-container');
        
        // Fase 1: Fade out
        appContainer.style.transition = 'opacity 0.3s ease';
        appContainer.style.opacity = '0.7';
        
        // Fase 2: Cambiar CSS (después de 150ms)
        setTimeout(() => {
            this.applyTheme(newTheme);
            
            // Fase 3: Fade in (después de otros 100ms)
            setTimeout(() => {
                appContainer.style.opacity = '1';
                
                // Limpiar estilos de transición después de la animación
                setTimeout(() => {
                    appContainer.style.transition = '';
                }, 300);
            }, 100);
        }, 150);
    }

    /**
     * Aplicar tema específico
     * @param {string} themeName - Nombre del tema
     * @param {boolean} updateMeta - Si actualizar meta tags
     */
    applyTheme(themeName, updateMeta = true) {
        const theme = this.themes[themeName];
        const themeCSS = document.getElementById('theme-css');
        
        if (themeCSS) {
            themeCSS.href = theme.cssFile;
        }

        if (updateMeta) {
            this.updateMetaTags(theme);
        }

        // Trigger custom event para otros módulos
        this.dispatchThemeChangeEvent(themeName);
    }

    /**
     * Actualizar meta tags del PWA según el tema
     * @param {object} theme - Configuración del tema
     */
    updateMetaTags(theme) {
        // Actualizar theme-color para PWA
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.content = theme.manifestThemeColor;
        }

        // Actualizar apple-mobile-web-app-status-bar-style
        const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (statusBarMeta) {
            statusBarMeta.content = this.currentTheme === 'feminine' ? 'black-translucent' : 'black-translucent';
        }
    }

    /**
     * Actualizar interfaz de usuario del selector de temas
     */
    updateUI() {
        const themeDropdownItems = document.querySelectorAll('#themeDropdown + .dropdown-menu .dropdown-item');
        
        themeDropdownItems.forEach(item => {
            const isActive = item.textContent.trim().toLowerCase().includes(this.themes[this.currentTheme].name.toLowerCase());
            
            if (isActive) {
                item.classList.add('active');
                item.innerHTML = `<i class="${this.themes[this.currentTheme].icon} me-2"></i>${this.themes[this.currentTheme].name} <i class="fas fa-check ms-auto text-success"></i>`;
            } else {
                item.classList.remove('active');
                // Restaurar contenido original
                const themeName = item.textContent.includes('Profesional') ? 'masculine' : 'feminine';
                const themeConfig = this.themes[themeName];
                item.innerHTML = `<i class="${themeConfig.icon} me-2"></i>${themeConfig.name}`;
            }
        });

        // Actualizar botón del dropdown
        const dropdownButton = document.getElementById('themeDropdown');
        if (dropdownButton) {
            const currentThemeConfig = this.themes[this.currentTheme];
            dropdownButton.innerHTML = `<i class="${currentThemeConfig.icon} me-1"></i><span class="d-none d-sm-inline">${currentThemeConfig.name}</span>`;
        }
    }

    /**
     * Vincular eventos del DOM
     */
    bindEvents() {
        // Event listeners para los items del dropdown
        document.addEventListener('click', (e) => {
            if (e.target.closest('.dropdown-item[onclick*="ThemeManager.switch"]')) {
                e.preventDefault();
                
                const item = e.target.closest('.dropdown-item');
                const themeName = item.textContent.includes('Profesional') ? 'masculine' : 'feminine';
                
                this.switch(themeName);
            }
        });

        // Keyboard shortcuts para cambio rápido de tema
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T para alternar tema
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggle();
            }
        });

        // Detectar cambios en prefers-color-scheme del sistema
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                this.handleSystemThemeChange(e.matches);
            });
        }
    }

    /**
     * Alternar entre temas disponibles
     */
    toggle() {
        const nextTheme = this.currentTheme === 'masculine' ? 'feminine' : 'masculine';
        this.switch(nextTheme);
    }

    /**
     * Manejar cambios en el tema del sistema
     * @param {boolean} isDark - Si el sistema está en modo oscuro
     */
    handleSystemThemeChange(isDark) {
        // Por ahora no hacemos nada, pero podríamos implementar
        // un tema oscuro automático en el futuro
        console.log(`Sistema cambió a modo ${isDark ? 'oscuro' : 'claro'}`);
    }

    /**
     * Mostrar notificación de cambio de tema
     * @param {string} themeName - Nombre del nuevo tema
     */
    showThemeChangeNotification(themeName) {
        const theme = this.themes[themeName];
        const message = `Tema cambiado a "${theme.name}"`;
        
        // Crear toast personalizado
        this.createToast(message, 'info', theme.icon);
    }

    /**
     * Crear toast de notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast (success, info, warning, danger)
     * @param {string} icon - Clase del ícono
     */
    createToast(message, type = 'info', icon = 'fas fa-info-circle') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toastId = `toast-${Date.now()}`;
        const bgClass = `bg-${type}`;
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body text-white">
                        <i class="${icon} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        // Mostrar toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 3000
        });
        
        toast.show();
        
        // Limpiar después de ocultarse
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    /**
     * Crear contenedor de toasts si no existe
     * @returns {HTMLElement} - Elemento contenedor
     */
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    }

    /**
     * Disparar evento personalizado de cambio de tema
     * @param {string} themeName - Nombre del tema
     */
    dispatchThemeChangeEvent(themeName) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: themeName,
                config: this.themes[themeName]
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Obtener información del tema actual
     * @returns {object} - Configuración del tema actual
     */
    getCurrentTheme() {
        return {
            name: this.currentTheme,
            config: this.themes[this.currentTheme]
        };
    }

    /**
     * Obtener lista de todos los temas disponibles
     * @returns {object} - Lista de temas
     */
    getAvailableThemes() {
        return this.themes;
    }

    /**
     * Verificar si un tema existe
     * @param {string} themeName - Nombre del tema
     * @returns {boolean} - Si el tema existe
     */
    isValidTheme(themeName) {
        return Object.keys(this.themes).includes(themeName);
    }

    /**
     * Resetear al tema por defecto
     */
    reset() {
        this.switch('masculine');
        localStorage.removeItem('agenda-theme');
        console.log('🎨 Tema reseteado al por defecto');
    }

    /**
     * Obtener estadísticas de uso de temas
     * @returns {object} - Estadísticas
     */
    getStats() {
        return {
            currentTheme: this.currentTheme,
            availableThemes: Object.keys(this.themes).length,
            supportedFeatures: {
                localStorage: typeof(Storage) !== "undefined",
                customEvents: typeof(CustomEvent) !== "undefined",
                matchMedia: !!window.matchMedia
            }
        };
    }
}

// Crear instancia global del Theme Manager
window.ThemeManager = new ThemeManager();

// Exponer métodos globales para compatibilidad con HTML onclick handlers
window.switchTheme = (themeName) => window.ThemeManager.switch(themeName);
window.toggleTheme = () => window.ThemeManager.toggle();

// Event listener para cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Theme Manager completamente cargado');
    
    // Ejemplo de cómo otros módulos pueden escuchar cambios de tema
    document.addEventListener('themeChanged', (e) => {
        console.log(`📢 Evento de cambio de tema detectado:`, e.detail);
        
        // Aquí otros módulos pueden reaccionar al cambio de tema
        // Por ejemplo, actualizar gráficos, recargar componentes, etc.
    });
});

// Debugging helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugThemes = () => {
        console.log('🔍 Debug Info - Themes:', window.ThemeManager.getStats());
        console.log('🔍 Current Theme:', window.ThemeManager.getCurrentTheme());
        console.log('🔍 Available Themes:', window.ThemeManager.getAvailableThemes());
    };
    
    console.log('🛠️ Debug mode: Usa debugThemes() para ver información de temas');
}