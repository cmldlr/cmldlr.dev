const emailjs = require('@emailjs/nodejs');
const crypto = require('crypto');

// Ortak CORS header'ları
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event, context) => {
    // OPTIONS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    // Sadece POST isteklerine izin ver
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };
    }

    try {
        const { email } = JSON.parse(event.body);
        if (!email) {
            return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Email is required' }) };
        }

        // 6 haneli rastgele kod üret (Node.js uyumlu)
        let otp_code = '';
        for (let i = 0; i < 6; i++) {
            otp_code += crypto.randomInt(0, 10).toString();
        }

        console.log(`[Backend API] Yeni OTP Oluşturuldu.`); // Bilinçli olarak loga şifreyi basmıyoruz.

        const DEMO_MODE = process.env.DEMO_MODE === 'true'; 

        if (DEMO_MODE) {
            console.log(`[DEMO_MODE AKTIF] E-posta gönderilmedi. Test şifresi: 000000 olarak sabitlendi.`);
            otp_code = "000000";
        } else {
            // EmailJS yapılandırması
            emailjs.init({
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY || undefined,
            });

            // Gerçek email gönderimi
            await emailjs.send(
                process.env.EMAILJS_SERVICE_ID,
                process.env.EMAILJS_TEMPLATE_ID,
                {
                    to_email: email,
                    otp_code: otp_code,
                    expiry_minutes: '5'
                }
            );
        }

        // Güvenlik Hash'inin oluşturulması
        // Şifreyi açıkça browser'a dönmeyiz. HMAC hash ile geri göndeririz.
        const expiresAtMs = Date.now() + (5 * 60 * 1000); // 5 dakika geçerlilik
        const secret = process.env.OTP_SECRET || 'default-secret-do-not-use-in-production';
        const hash = crypto.createHmac('sha256', secret).update(email + otp_code + expiresAtMs).digest('hex');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'OTP sent successfully',
                hash: hash,
                expiresAtMs: expiresAtMs,
                isDemo: DEMO_MODE
            })
        };
    } catch (error) {
        console.error('Error sending OTP:', error);
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            body: JSON.stringify({ error: 'Internal Server Error' }) 
        };
    }
};
