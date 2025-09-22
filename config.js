// config.js - Configuration centralisée pour le déploiement
const CONFIG = {
    // Configuration Supabase
    SUPABASE: {
        URL: 'https://pekndazxlkxdhfgrdtyq.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBla25kYXp4bGt4ZGhmZ3JkdHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODIzMzcsImV4cCI6MjA3MjQ1ODMzN30.McX9eQpaQ3SJfSTErz1dP0ixJl8tyK__aqyFrStnLvo'
    },
    
    // Configuration de l'application
    APP: {
        NAME: 'Tertio Recycle',
        VERSION: '1.0.0',
        // Détection automatique de l'environnement
        IS_PRODUCTION: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
        
        // URLs selon l'environnement
        BASE_URL: window.location.hostname === 'localhost' ? 
                  'http://localhost:3000' : 
                  window.location.origin,
    },
    
    // Configuration des sessions
    SESSION: {
        KEY: 'tertio_session',
        LONG_TERM_HOURS: 720, // 30 jours
        SHORT_TERM_HOURS: 24   // 1 jour
    }
};

// Fonction utilitaire pour initialiser Supabase
window.initSupabase = function() {
    if (window.supabase && CONFIG.SUPABASE.URL && CONFIG.SUPABASE.ANON_KEY) {
        return window.supabase.createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
    } else {
        console.error('Supabase non disponible ou configuration manquante');
        return null;
    }
};

// Export de la configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}