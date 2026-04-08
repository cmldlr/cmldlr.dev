const PortfolioAuth = (() => {
    const SESSION_KEY = 'portfolio_session';
    const ADMIN_EMAIL = 'me@cmldlr.dev';

    let currentHash = null;
    let expiresAtMs = null;
    let otpExpiry = null;
    const COOLDOWN_MS = 60 * 1000;
    let lastSentAt = 0;

    function getMaskedEmail() {
        const [user, domain] = ADMIN_EMAIL.split('@');
        return user[0] + '•••' + user.slice(-1) + '@' + domain;
    }

    function getCooldownRemaining() {
        const elapsed = Date.now() - lastSentAt;
        if (elapsed >= COOLDOWN_MS) return 0;
        return Math.ceil((COOLDOWN_MS - elapsed) / 1000);
    }

    function isOTPExpired() {
        if (!otpExpiry) return true;
        return Date.now() > otpExpiry;
    }

    function getOTPTimeRemaining() {
        if (!otpExpiry) return 0;
        return Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000));
    }

    async function sendOTP() {
        const cooldown = getCooldownRemaining();
        if (cooldown > 0) {
            throw new Error(`Please wait ${cooldown} seconds.`);
        }

        lastSentAt = Date.now();

        try {
            const response = await fetch('/.netlify/functions/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: ADMIN_EMAIL })
            });

            if (!response.ok) {
                lastSentAt = 0;
                throw new Error('Server error. API returned a failed response.');
            }

            const data = await response.json();
            currentHash = data.hash;
            expiresAtMs = data.expiresAtMs;
            otpExpiry = expiresAtMs;

            return true;
        } catch (err) {
            currentHash = null;
            expiresAtMs = null;
            otpExpiry = null;
            lastSentAt = 0;
            throw new Error('Failed to send code. Please check your connection.');
        }
    }

    async function verifyOTP(code) {
        if (!code) return false;
        if (!currentHash || !expiresAtMs) throw new Error('Session expired, please request a new code.');

        try {
            const response = await fetch('/.netlify/functions/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                return true;
            } else {
                throw new Error(data.error || 'Verification failed.');
            }
        } catch(err) {
            throw err;
        }
    }

    function isAuthenticated() {
        return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
    }

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
