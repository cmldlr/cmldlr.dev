/**
 * Portfolio Authentication Module
 * SHA-256 şifre doğrulama — Web Crypto API
 */

const PortfolioAuth = (() => {
    const HASH_KEY = 'portfolio_admin_hash';
    const SESSION_KEY = 'portfolio_session';

    // SHA-256 hash
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + '_portfolio_salt_cd2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // İlk kez şifre var mı?
    function isPasswordSet() {
        return !!localStorage.getItem(HASH_KEY);
    }

    // Şifre oluştur
    async function setPassword(password) {
        if (password.length < 4) {
            throw new Error('Şifre en az 4 karakter olmalıdır');
        }
        const hash = await hashPassword(password);
        localStorage.setItem(HASH_KEY, hash);
        sessionStorage.setItem(SESSION_KEY, 'authenticated');
        return true;
    }

    // Şifre doğrula
    async function verifyPassword(password) {
        const storedHash = localStorage.getItem(HASH_KEY);
        if (!storedHash) return false;
        const hash = await hashPassword(password);
        return hash === storedHash;
    }

    // Giriş yap
    async function login(password) {
        const valid = await verifyPassword(password);
        if (valid) {
            sessionStorage.setItem(SESSION_KEY, 'authenticated');
            return true;
        }
        return false;
    }

    // Oturum kontrolü
    function isAuthenticated() {
        return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
    }

    // Çıkış
    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    // Şifre değiştir
    async function changePassword(currentPassword, newPassword) {
        const valid = await verifyPassword(currentPassword);
        if (!valid) {
            throw new Error('Mevcut şifre yanlış');
        }
        if (newPassword.length < 4) {
            throw new Error('Yeni şifre en az 4 karakter olmalıdır');
        }
        const hash = await hashPassword(newPassword);
        localStorage.setItem(HASH_KEY, hash);
        return true;
    }

    return {
        isPasswordSet,
        setPassword,
        verifyPassword,
        login,
        isAuthenticated,
        logout,
        changePassword
    };
})();
