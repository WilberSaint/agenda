/**
 * Storage Manager - Agenda Personal Pro
 * Sistema centralizado de almacenamiento para todos los módulos
 */

class StorageManager {
    constructor() {
        this.storagePrefix = 'agenda-pro-';
        this.version = '1.0.0';
        this.isAvailable = this.checkStorageAvailability();
        this.encryptionEnabled = false; // Para futuras implementaciones
        
        // Definir esquemas de datos para cada módulo
        this.dataSchemas = {
            tasks: {
                key: 'tasks',
                version: '1.0.0',
                defaultValue: [],
                validator: this.validateTasksData.bind(this)
            },
            habits: {
                key: 'habits',
                version: '1.0.0',
                defaultValue: [],
                validator: this.validateHabitsData.bind(this)
            },
            goals: {
                key: 'goals',
                version: '1.0.0',
                defaultValue: [],
                validator: this.validateGoalsData.bind(this)
            },
            gym: {
                key: 'gym-sessions',
                version: '1.0.0',
                defaultValue: [],
                validator: this.validateGymData.bind(this)
            },
            settings: {
                key: 'app-settings',
                version: '1.0.0',
                defaultValue: this.getDefaultSettings(),
                validator: this.validateSettingsData.bind(this)
            },
            theme: {
                key: 'theme-preference',
                version: '1.0.0',
                defaultValue: 'masculine',
                validator: this.validateThemeData.bind(this)
            },
            appState: {
                key: 'app-state',
                version: '1.0.0',
                defaultValue: this.getDefaultAppState(),
                validator: this.validateAppStateData.bind(this)
            }
        };

        this.init();
    }

    /**
     * Inicializar el Storage Manager
     */
    init() {
        console.log('💾 Inicializando Storage Manager...');
        
        if (!this.isAvailable) {
            console.warn('⚠️ localStorage no disponible, usando memoria temporal');
            this.initMemoryStorage();
        }

        this.migrateDataIfNeeded();
        this.cleanupOldData();
        this.bindEvents();
        
        console.log('✅ Storage Manager inicializado correctamente');
    }

    /**
     * Verificar disponibilidad de localStorage
     */
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Inicializar almacenamiento en memoria como fallback
     */
    initMemoryStorage() {
        this.memoryStorage = {};
        
        // Simular API de localStorage
        this.storage = {
            getItem: (key) => this.memoryStorage[key] || null,
            setItem: (key, value) => this.memoryStorage[key] = value,
            removeItem: (key) => delete this.memoryStorage[key],
            clear: () => this.memoryStorage = {}
        };
    }

    /**
     * Obtener referencia al storage (localStorage o memoria)
     */
    getStorage() {
        return this.isAvailable ? localStorage : this.storage;
    }

    /**
     * Vincular eventos
     */
    bindEvents() {
        // Escuchar eventos de otros módulos para auto-guardar
        document.addEventListener('agendaTaskAdded', (e) => {
            this.handleTaskEvent('added', e.detail);
        });

        document.addEventListener('agendaTaskUpdated', (e) => {
            this.handleTaskEvent('updated', e.detail);
        });

        document.addEventListener('agendaTaskDeleted', (e) => {
            this.handleTaskEvent('deleted', e.detail);
        });

        // Auto-backup periódico
        this.startAutoBackup();

        // Cleanup al cerrar ventana
        window.addEventListener('beforeunload', () => {
            this.performCleanup();
        });
    }

    /**
     * ===== MÉTODOS PRINCIPALES DE STORAGE =====
     */

    /**
     * Guardar datos de un módulo específico
     * @param {string} module - Nombre del módulo
     * @param {any} data - Datos a guardar
     * @returns {boolean} - Si se guardó correctamente
     */
    save(module, data) {
        try {
            const schema = this.dataSchemas[module];
            if (!schema) {
                throw new Error(`Esquema no encontrado para módulo: ${module}`);
            }

            // Validar datos
            if (!schema.validator(data)) {
                throw new Error(`Datos inválidos para módulo: ${module}`);
            }

            const storageData = {
                version: schema.version,
                timestamp: new Date().toISOString(),
                data: data
            };

            const key = this.getStorageKey(schema.key);
            const serializedData = JSON.stringify(storageData);
            
            this.getStorage().setItem(key, serializedData);

            console.log(`💾 Datos guardados para ${module}: ${this.formatBytes(serializedData.length)}`);
            
            // Trigger event
            this.dispatchEvent('dataStored', { module, size: serializedData.length });
            
            return true;
        } catch (error) {
            console.error(`❌ Error guardando datos de ${module}:`, error);
            this.dispatchEvent('storageError', { module, error: error.message, operation: 'save' });
            return false;
        }
    }

    /**
     * Cargar datos de un módulo específico
     * @param {string} module - Nombre del módulo
     * @returns {any} - Datos del módulo o valor por defecto
     */
    load(module) {
        try {
            const schema = this.dataSchemas[module];
            if (!schema) {
                throw new Error(`Esquema no encontrado para módulo: ${module}`);
            }

            const key = this.getStorageKey(schema.key);
            const serializedData = this.getStorage().getItem(key);

            if (!serializedData) {
                console.log(`📂 No hay datos guardados para ${module}, usando valores por defecto`);
                return schema.defaultValue;
            }

            const storageData = JSON.parse(serializedData);
            
            // Verificar versión y migrar si es necesario
            if (storageData.version !== schema.version) {
                console.log(`🔄 Migrando datos de ${module} de v${storageData.version} a v${schema.version}`);
                const migratedData = this.migrateModuleData(module, storageData);
                if (migratedData) {
                    this.save(module, migratedData);
                    return migratedData;
                }
            }

            // Validar datos cargados
            if (!schema.validator(storageData.data)) {
                console.warn(`⚠️ Datos inválidos en ${module}, usando valores por defecto`);
                return schema.defaultValue;
            }

            console.log(`📂 Datos cargados para ${module}: ${this.formatBytes(serializedData.length)}`);
            
            // Trigger event
            this.dispatchEvent('dataLoaded', { module, size: serializedData.length });
            
            return storageData.data;
        } catch (error) {
            console.error(`❌ Error cargando datos de ${module}:`, error);
            this.dispatchEvent('storageError', { module, error: error.message, operation: 'load' });
            return this.dataSchemas[module]?.defaultValue || null;
        }
    }

    /**
     * Eliminar datos de un módulo
     * @param {string} module - Nombre del módulo
     * @returns {boolean} - Si se eliminó correctamente
     */
    remove(module) {
        try {
            const schema = this.dataSchemas[module];
            if (!schema) {
                throw new Error(`Esquema no encontrado para módulo: ${module}`);
            }

            const key = this.getStorageKey(schema.key);
            this.getStorage().removeItem(key);
            
            console.log(`🗑️ Datos eliminados para ${module}`);
            
            // Trigger event
            this.dispatchEvent('dataRemoved', { module });
            
            return true;
        } catch (error) {
            console.error(`❌ Error eliminando datos de ${module}:`, error);
            this.dispatchEvent('storageError', { module, error: error.message, operation: 'remove' });
            return false;
        }
    }

    /**
     * ===== MÉTODOS DE RESPALDO Y RESTAURACIÓN =====
     */

    /**
     * Crear respaldo completo de todos los datos
     * @returns {object} - Objeto con todos los datos
     */
    createFullBackup() {
        const backup = {
            version: this.version,
            timestamp: new Date().toISOString(),
            app: 'Agenda Personal Pro',
            modules: {}
        };

        Object.keys(this.dataSchemas).forEach(module => {
            backup.modules[module] = this.load(module);
        });

        console.log('📦 Respaldo completo creado');
        
        // Trigger event
        this.dispatchEvent('backupCreated', { backup });
        
        return backup;
    }

    /**
     * Restaurar desde un respaldo completo
     * @param {object} backup - Objeto de respaldo
     * @returns {boolean} - Si se restauró correctamente
     */
    restoreFromBackup(backup) {
        try {
            if (!backup || !backup.modules) {
                throw new Error('Formato de respaldo inválido');
            }

            let restoredModules = 0;
            
            Object.keys(backup.modules).forEach(module => {
                if (this.dataSchemas[module]) {
                    if (this.save(module, backup.modules[module])) {
                        restoredModules++;
                    }
                }
            });

            console.log(`📥 Respaldo restaurado: ${restoredModules} módulos`);
            
            // Trigger event
            this.dispatchEvent('backupRestored', { modules: restoredModules });
            
            return true;
        } catch (error) {
            console.error('❌ Error restaurando respaldo:', error);
            this.dispatchEvent('storageError', { error: error.message, operation: 'restore' });
            return false;
        }
    }

    /**
     * Descargar respaldo como archivo JSON
     */
    downloadBackup() {
        const backup = this.createFullBackup();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { 
            type: 'application/json' 
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `agenda-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('💾 Respaldo descargado');
        
        // Trigger event
        this.dispatchEvent('backupDownloaded', { size: blob.size });
    }

    /**
     * ===== MÉTODOS DE VALIDACIÓN =====
     */

    validateTasksData(data) {
        return Array.isArray(data) && data.every(task => 
            task.id && task.title && task.type && task.category && task.priority
        );
    }

    validateHabitsData(data) {
        return Array.isArray(data) && data.every(habit => 
            habit.id && habit.name && habit.frequency
        );
    }

    validateGoalsData(data) {
        return Array.isArray(data) && data.every(goal => 
            goal.id && goal.title && goal.deadline
        );
    }

    validateGymData(data) {
        return Array.isArray(data) && data.every(session => 
            session.id && session.date && session.exercises
        );
    }

    validateSettingsData(data) {
        return typeof data === 'object' && data !== null && 
               typeof data.notifications === 'boolean' &&
               typeof data.autoBackup === 'boolean';
    }

    validateThemeData(data) {
        return typeof data === 'string' && ['masculine', 'feminine'].includes(data);
    }

    validateAppStateData(data) {
        return typeof data === 'object' && data !== null &&
               typeof data.currentModule === 'string';
    }

    /**
     * ===== CONFIGURACIONES POR DEFECTO =====
     */

    getDefaultSettings() {
        return {
            notifications: true,
            autoBackup: true,
            backupInterval: 24, // horas
            maxBackups: 5,
            dataRetention: 365, // días
            exportFormat: 'json'
        };
    }

    getDefaultAppState() {
        return {
            currentModule: 'agenda',
            sidebarOpen: false,
            lastActive: new Date().toISOString(),
            sessionId: this.generateSessionId()
        };
    }

    /**
     * ===== MÉTODOS DE UTILIDAD =====
     */

    getStorageKey(key) {
        return `${this.storagePrefix}${key}`;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * ===== MÉTODOS DE MANTENIMIENTO =====
     */

    /**
     * Obtener información de uso del storage
     */
    getStorageInfo() {
        const info = {
            available: this.isAvailable,
            version: this.version,
            modules: {},
            totalSize: 0,
            freeSpace: null
        };

        Object.keys(this.dataSchemas).forEach(module => {
            const key = this.getStorageKey(this.dataSchemas[module].key);
            const data = this.getStorage().getItem(key);
            const size = data ? data.length : 0;
            
            info.modules[module] = {
                size: size,
                sizeFormatted: this.formatBytes(size),
                hasData: !!data
            };
            
            info.totalSize += size;
        });

        info.totalSizeFormatted = this.formatBytes(info.totalSize);

        // Calcular espacio libre (solo para localStorage)
        if (this.isAvailable) {
            try {
                const used = JSON.stringify(localStorage).length;
                const quota = 10 * 1024 * 1024; // Estimado: 10MB
                info.freeSpace = quota - used;
                info.freeSpaceFormatted = this.formatBytes(info.freeSpace);
            } catch (e) {
                info.freeSpace = 'No disponible';
            }
        }

        return info;
    }

    /**
     * Limpiar datos antiguos
     */
    cleanupOldData() {
        const settings = this.load('settings');
        const retentionDays = settings.dataRetention || 365;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // Implementar cleanup específico por módulo
        console.log(`🧹 Cleanup de datos anteriores a ${cutoffDate.toISOString().split('T')[0]}`);
    }

    /**
     * Migrar datos si es necesario
     */
    migrateDataIfNeeded() {
        // Verificar si hay datos de versiones anteriores
        const oldTasksKey = 'agenda-personal-tasks'; // Clave antigua
        const oldTasks = localStorage.getItem(oldTasksKey);
        
        if (oldTasks && !this.getStorage().getItem(this.getStorageKey('tasks'))) {
            console.log('🔄 Migrando datos de versión anterior...');
            try {
                const parsedTasks = JSON.parse(oldTasks);
                this.save('tasks', parsedTasks);
                localStorage.removeItem(oldTasksKey);
                console.log('✅ Migración completada');
            } catch (error) {
                console.error('❌ Error en migración:', error);
            }
        }
    }

    /**
     * Migrar datos de un módulo específico
     */
    migrateModuleData(module, oldData) {
        // Implementar lógica de migración específica por módulo
        console.log(`🔄 Migrando ${module}...`);
        return oldData.data; // Por ahora, retornar datos tal como están
    }

    /**
     * Auto-backup periódico
     */
    startAutoBackup() {
        const settings = this.load('settings');
        if (settings.autoBackup) {
            const intervalHours = settings.backupInterval || 24;
            const intervalMs = intervalHours * 60 * 60 * 1000;
            
            setInterval(() => {
                this.performAutoBackup();
            }, intervalMs);
            
            console.log(`⏰ Auto-backup configurado cada ${intervalHours} horas`);
        }
    }

    /**
     * Realizar auto-backup
     */
    performAutoBackup() {
        try {
            const backup = this.createFullBackup();
            const backupKey = this.getStorageKey(`auto-backup-${Date.now()}`);
            this.getStorage().setItem(backupKey, JSON.stringify(backup));
            
            // Limpiar backups antiguos
            this.cleanupOldBackups();
            
            console.log('🔄 Auto-backup realizado');
        } catch (error) {
            console.error('❌ Error en auto-backup:', error);
        }
    }

    /**
     * Limpiar backups antiguos
     */
    cleanupOldBackups() {
        const settings = this.load('settings');
        const maxBackups = settings.maxBackups || 5;
        
        // Obtener todos los backups automáticos
        const backupKeys = [];
        const storage = this.getStorage();
        
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.includes('auto-backup-')) {
                backupKeys.push(key);
            }
        }
        
        // Eliminar backups excedentes (mantener solo los más recientes)
        if (backupKeys.length > maxBackups) {
            backupKeys.sort().slice(0, backupKeys.length - maxBackups).forEach(key => {
                storage.removeItem(key);
            });
        }
    }

    /**
     * Cleanup general
     */
    performCleanup() {
        // Guardar estado de la app
        const appState = {
            currentModule: window.AppController?.currentModule || 'agenda',
            sidebarOpen: window.AppController?.sidebarOpen || false,
            lastActive: new Date().toISOString(),
            sessionId: this.generateSessionId()
        };
        
        this.save('appState', appState);
        
        console.log('🧹 Cleanup realizado');
    }

    /**
     * ===== EVENT HANDLERS =====
     */

    handleTaskEvent(action, detail) {
        // Auto-guardar cuando hay cambios en tareas
        if (window.agenda && window.agenda.tasks) {
            this.save('tasks', window.agenda.tasks);
        }
    }

    /**
     * Disparar evento personalizado
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`storage${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
            detail: {
                storage: 'localStorage',
                timestamp: new Date().toISOString(),
                ...detail
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * ===== MÉTODOS DE IMPORTACIÓN/EXPORTACIÓN =====
     */

    /**
     * Exportar datos específicos de un módulo
     */
    exportModule(module, format = 'json') {
        const data = this.load(module);
        const exportData = {
            module,
            version: this.dataSchemas[module]?.version || '1.0.0',
            timestamp: new Date().toISOString(),
            data
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${module}-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        console.log(`📤 Módulo ${module} exportado`);
    }

    /**
     * Importar datos de un módulo desde archivo
     */
    async importModule(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (importData.module && this.dataSchemas[importData.module]) {
                const success = this.save(importData.module, importData.data);
                if (success) {
                    console.log(`📥 Módulo ${importData.module} importado`);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error importando módulo:', error);
            return false;
        }
    }

    /**
     * Reset completo de todos los datos
     */
    resetAllData() {
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            Object.keys(this.dataSchemas).forEach(module => {
                this.remove(module);
            });
            
            console.log('🔥 Todos los datos han sido eliminados');
            
            // Trigger event
            this.dispatchEvent('allDataReset');
            
            // Recargar página para reiniciar estado
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
}

// Crear instancia global del Storage Manager
window.StorageManager = new StorageManager();

// Debugging helpers (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugStorage = () => {
        console.log('🔍 Storage Info:', window.StorageManager.getStorageInfo());
    };
    
    window.downloadBackup = () => {
        window.StorageManager.downloadBackup();
    };
    
    window.resetStorage = () => {
        window.StorageManager.resetAllData();
    };
    
    console.log('🛠️ Debug mode: Usa debugStorage(), downloadBackup(), resetStorage()');
}

console.log('💾 Storage Manager cargado correctamente');