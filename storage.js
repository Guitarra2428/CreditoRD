/**
 * tuCreditoRD — Persistencia con LocalStorage
 */
const STORAGE_KEY = 'tuCreditoRD_data';

const Storage = {
    save(data) {
        try {
            const payload = { ...data, savedAt: new Date().toISOString() };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            return true;
        } catch (e) {
            console.warn('Error al guardar:', e);
            return false;
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('Error al cargar:', e);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    },

    hasSaved() {
        return !!localStorage.getItem(STORAGE_KEY);
    },

    getSavedDate() {
        const data = this.load();
        if (!data?.savedAt) return null;
        return new Date(data.savedAt).toLocaleDateString('es-DO', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    },
};

window.Storage = Storage;
