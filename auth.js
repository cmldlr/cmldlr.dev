/**
 * Portfolio Authentication Module
 * Email OTP doğrulama — EmailJS ile
 */

const PortfolioAuth = (() => {
    const SESSION_KEY = 'portfolio_session';
    const ADMIN_EMAIL = 'me@cmldlr.dev';

    // ============ DEMO MODE ============
    // true = EmailJS olmadan çalışır, kod konsola yazılır, '000000' ile giriş yapılabilir
    // Yayına alırken false yap!
    const DEMO_MODE = false;

    // ============ EmailJS Config ============
    // Artık backend (server.js) üzerinden '.env' dosyasından okunuyor.

    // ============ OTP State ============
    let currentOTP = null;
    let otpExpiry = null;
    const OTP_LENGTH = 6;
    const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika
    const COOLDOWN_MS = 60 * 1000;       // 1 dk tekrar gönderim bekleme
    let lastSentAt = 0;

    // 6 haneli rastgele kod üret
    function generateOTP() {
        const digits = '0123456789';
        let otp = '';
        const arr = new Uint32Array(OTP_LENGTH);
        crypto.getRandomValues(arr);
        for (let i = 0; i < OTP_LENGTH; i++) {
            otp += digits[arr[i] % 10];
        }
        return otp;
    }

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

    // EmailJS ile OTP gönder
    async function sendOTP() {
        // Cooldown kontrolü
        const cooldown = getCooldownRemaining();
        if (cooldown > 0) {
            throw new Error(`Lütfen ${cooldown} saniye bekleyin.`);
        }

        // OTP oluştur
        currentOTP = generateOTP();
        otpExpiry = Date.now() + OTP_EXPIRY_MS;
        lastSentAt = Date.now();

        // Demo mode: EmailJS atla, konsola yaz
        if (DEMO_MODE) {
            console.log(`🔑 DEMO OTP Kodu: ${currentOTP}`);
            console.log(`💡 Veya "000000" girerek giriş yapabilirsiniz.`);
            // return true; (Devre Dışı Bırakıldı - Email yollaması istendi)
        }

        // Sunucu (backend) üzerinden gönder
        try {
            const response = await fetch('http://localhost:3000/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: ADMIN_EMAIL,
                    otp_code: currentOTP
                })
            });

            if (!response.ok) {
                throw new Error('Sunucu hatası. API başarısız yanıt verdi.');
            }
            return true;
        } catch (err) {
            currentOTP = null;
            otpExpiry = null;
            console.error('Server OTP error:', err);
            throw new Error('Kod gönderilemedi. Lütfen arka plan sunucusunun çalıştığından emin olun.');
        }
    }

    // OTP doğrula
    function verifyOTP(code) {
        if (!code) return false;

        // Demo mode: 000000 her zaman geçerli
        if (DEMO_MODE && code.trim() === '000000') {
            sessionStorage.setItem(SESSION_KEY, 'authenticated');
            currentOTP = null;
            otpExpiry = null;
            return true;
        }

        if (!currentOTP) return false;
        if (isOTPExpired()) {
            currentOTP = null;
            otpExpiry = null;
            return false;
        }
        if (code.trim() === currentOTP) {
            sessionStorage.setItem(SESSION_KEY, 'authenticated');
            currentOTP = null;
            otpExpiry = null;
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
        currentOTP = null;
        otpExpiry = null;
    }

    return {
        ADMIN_EMAIL,
        getMaskedEmail,
        generateOTP,
        sendOTP,
        verifyOTP,
        isOTPExpired,
        getOTPTimeRemaining,
        getCooldownRemaining,
        isAuthenticated,
        logout
    };
})();
