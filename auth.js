/**
 * Portfolio Authentication Module
 * Email OTP doğrulama — Netlify Functions üzerinden
 */

const PortfolioAuth = (() => {
    const SESSION_KEY = 'portfolio_session';
    const ADMIN_EMAIL = 'me@cmldlr.dev';

    // ============ OTP State ============
    let currentHash = null;
    let expiresAtMs = null;
    let otpExpiry = null;
    const COOLDOWN_MS = 60 * 1000;       // 1 dk tekrar gönderim bekleme
    let lastSentAt = 0;

    let backendDemoMode = false; // Backend demo veriyorsa

    // Masked email göster
    function getMaskedEmail() {
        const [user, domain] = ADMIN_EMAIL.split('@');
        return user[0] + '•••' + user.slice(-1) + '@' + domain;
    }

    // Kalan cooldown süresi (saniye)
    function getCooldownRemaining() {
        const elapsed = Date.now() - lastSentAt;
        if (elapsed >= COOLDOWN_MS) return 0;
        return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    }

    // OTP süresi doldu mu?
    function isOTPExpired() {
        if (!otpExpiry) return true;
        return Date.now() > otpExpiry;
    }

    // OTP süresinin kaç saniyesi kaldı
    function getOTPTimeRemaining() {
        if (!otpExpiry) return 0;
        return Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000));
    }

    // Netlify API ile OTP gönder
    async function sendOTP() {
        // Cooldown kontrolü
        const cooldown = getCooldownRemaining();
        if (cooldown > 0) {
            throw new Error(`Lütfen ${cooldown} saniye bekleyin.`);
        }

        lastSentAt = Date.now();

        try {
            const response = await fetch('/.netlify/functions/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: ADMIN_EMAIL
                })
            });

            if (!response.ok) {
                lastSentAt = 0;
                throw new Error('Sunucu hatası. API başarısız yanıt verdi.');
            }
            
            const data = await response.json();
            
            currentHash = data.hash;
            expiresAtMs = data.expiresAtMs;
            otpExpiry = expiresAtMs;

            if (data.isDemo) {
                backendDemoMode = true;
                console.log('💡 Backend Demo modunda: (Bu mesajı görürseniz şifre olarak "000000" geçerlidir).');
            } else {
                backendDemoMode = false;
            }
            
            return true;
        } catch (err) {
            currentHash = null;
            expiresAtMs = null;
            otpExpiry = null;
            lastSentAt = 0;
            console.error('Server OTP error:', err);
            throw new Error('Kod gönderilemedi. Lütfen sunucu bağlantısını kontrol edin.');
        }
    }

    // Netlify API ile OTP doğrula
    async function verifyOTP(code) {
        if (!code) return false;
        if (!currentHash || !expiresAtMs) throw new Error('Oturum zaman aşımına uğradı, tekrar kod isteyin.');

        try {
            const response = await fetch('/.netlify/functions/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: ADMIN_EMAIL,
                    code: code.trim(),
                    hash: currentHash,
                    expiresAtMs: expiresAtMs
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                sessionStorage.setItem(SESSION_KEY, 'authenticated');
                currentHash = null;
                expiresAtMs = null;
                otpExpiry = null;
                backendDemoMode = false;
                return true;
            } else {
                throw new Error(data.error || 'Doğrulama başarısız.');
            }
        } catch(err) {
            console.error('Doğrulama hatası:', err.message);
            throw err;
        }
    }

    // Oturum kontrolü
    function isAuthenticated() {
        return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
    }

    // Çıkış
    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        currentHash = null;
        expiresAtMs = null;
        otpExpiry = null;
    }

    return {
        ADMIN_EMAIL,
        getMaskedEmail,
        sendOTP,
        verifyOTP,
        isOTPExpired,
        getOTPTimeRemaining,
        getCooldownRemaining,
        isAuthenticated,
        logout
    };
})();
