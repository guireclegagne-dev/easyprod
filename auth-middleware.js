// auth-middleware.js
// À inclure dans toutes les pages protégées

class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.sessionCheckInterval = null;
        
        // Pages publiques qui n'ont pas besoin d'authentification
        this.publicPages = [
            'login.html',
            'index.html'
        ];
        
        this.init();
    }
    
    async init() {
        // Initialiser Supabase
        if (window.supabase) {
            this.supabase = window.supabase.createClient(
                'https://pekndazxlkxdhfgrdtyq.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBla25kYXp4bGt4ZGhmZ3JkdHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODIzMzcsImV4cCI6MjA3MjQ1ODMzN30.McX9eQpaQ3SJfSTErz1dP0ixJl8tyK__aqyFrStnLvo'
            );
        }
        
        // Vérifier l'authentification au chargement
        if (!this.isPublicPage()) {
            await this.checkAuthentication();
            
            // Vérifier périodiquement la session
            this.startSessionCheck();
        }
    }
    
    // Vérifier si la page actuelle est publique
    isPublicPage() {
        const currentPage = window.location.pathname.split('/').pop();
        return this.publicPages.includes(currentPage);
    }
    
    // Vérifier l'authentification
    async checkAuthentication() {
        const session = this.getStoredSession();
        
        if (!session || session.expires_at <= Date.now()) {
            this.redirectToLogin();
            return false;
        }
        
        // Vérifier la validité en base de données
        if (this.supabase) {
            try {
                const { data, error } = await this.supabase
                    .from('user_sessions')
                    .select(`
                        id,
                        expires_at,
                        users (
                            id,
                            email,
                            first_name,
                            last_name,
                            is_admin,
                            is_active
                        )
                    `)
                    .eq('token', session.token)
                    .single();
                
                if (error || !data || !data.users.is_active) {
                    this.clearSession();
                    this.redirectToLogin();
                    return false;
                }
                
                // Session valide
                this.currentUser = data.users;
                this.updateUserInterface();
                return true;
                
            } catch (error) {
                console.error('Erreur vérification session:', error);
                this.clearSession();
                this.redirectToLogin();
                return false;
            }
        }
        
        return true;
    }
    
    // Obtenir la session stockée
    getStoredSession() {
        const sessionData = localStorage.getItem('user_session') || 
                            sessionStorage.getItem('user_session');
        return sessionData ? JSON.parse(sessionData) : null;
    }
    
    // Nettoyer la session
    clearSession() {
        localStorage.removeItem('user_session');
        sessionStorage.removeItem('user_session');
        this.currentUser = null;
    }
    
    // Rediriger vers la page de connexion
    redirectToLogin() {
        window.location.href = 'login.html';
    }
    
    // Déconnexion
    async logout() {
        const session = this.getStoredSession();
        
        if (session && this.supabase) {
            // Supprimer la session de la base
            try {
                await this.supabase
                    .from('user_sessions')
                    .delete()
                    .eq('token', session.token);
            } catch (error) {
                console.error('Erreur suppression session:', error);
            }
        }
        
        // Nettoyer localement
        this.clearSession();
        
        // Arrêter la vérification périodique
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
        
        // Rediriger
        this.redirectToLogin();
    }
    
    // Démarrer la vérification périodique de session
    startSessionCheck() {
        this.sessionCheckInterval = setInterval(async () => {
            await this.checkAuthentication();
        }, 60000); // Vérifier toutes les minutes
    }
    
    // Mettre à jour l'interface utilisateur
    updateUserInterface() {
        if (!this.currentUser) return;
        
        // Mettre à jour les informations utilisateur dans la page
        const userNameElements = document.querySelectorAll('.user-name');
        const userEmailElements = document.querySelectorAll('.user-email');
        const adminElements = document.querySelectorAll('.admin-only');
        
        const displayName = this.getUserDisplayName(this.currentUser);
        
        userNameElements.forEach(el => el.textContent = displayName);
        userEmailElements.forEach(el => el.textContent = this.currentUser.email);
        
        // Afficher/masquer les éléments admin
        adminElements.forEach(el => {
            el.style.display = this.currentUser.is_admin ? 'block' : 'none';
        });
        
        // Ajouter un bouton de déconnexion s'il n'existe pas
        this.addLogoutButton();
    }
    
    // Obtenir le nom d'affichage
    getUserDisplayName(user) {
        if (user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`;
        } else if (user.name) {
            return user.name;
        }
        return user.email;
    }
    
    // Ajouter un bouton de déconnexion
    addLogoutButton() {
        if (document.querySelector('.logout-btn')) return; // Déjà présent
        
        // Chercher une navbar ou un header
        let container = document.querySelector('.navbar') || 
                       document.querySelector('header') || 
                       document.querySelector('body');
        
        if (container) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn btn-outline-danger btn-sm logout-btn ms-2';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i>Déconnexion';
            logoutBtn.onclick = () => this.logout();
            
            container.appendChild(logoutBtn);
        }
    }
    
    // Vérifier les permissions admin
    requireAdmin() {
        if (!this.currentUser || !this.currentUser.is_admin) {
            alert('Accès refusé. Droits administrateur requis.');
            window.location.href = 'interface-utilisateur.html';
            return false;
        }
        return true;
    }
    
    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        return !!this.currentUser;
    }
    
    // Vérifier si l'utilisateur est admin
    isAdmin() {
        return this.currentUser && this.currentUser.is_admin;
    }
}

// Créer une instance globale
window.authManager = new AuthManager();

// Fonction utilitaire pour les autres scripts
function requireAuth() {
    return window.authManager.checkAuthentication();
}

function requireAdmin() {
    return window.authManager.requireAdmin();
}

function logout() {
    return window.authManager.logout();
}

function getCurrentUser() {
    return window.authManager.getCurrentUser();
}