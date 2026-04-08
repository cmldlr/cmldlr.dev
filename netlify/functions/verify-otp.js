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
        const { email, code, hash, expiresAtMs } = JSON.parse(event.body);

        if (!email || !code || !hash || !expiresAtMs) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'Missing required fields' }) 
            };
        }

        // Süre kontrolü
        if (Date.now() > expiresAtMs) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'Bu kodun süresi dolmuş.' }) 
            };
        }

        // Hash doğrulama
        const secret = process.env.OTP_SECRET || 'default-secret-do-not-use-in-production';
        const expectedHash = crypto.createHmac('sha256', secret).update(email + code + expiresAtMs).digest('hex');

        if (hash !== expectedHash) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'Geçersiz doğrulama kodu.' }) 
            };
        }

        // Başarılı doğrulama
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Doğrulama başarılı' 
            })
        };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            body: JSON.stringify({ error: 'Internal Server Error' }) 
        };
    }
};
