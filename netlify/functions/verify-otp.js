const crypto = require('crypto');

// Common CORS headers
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

    // Only allow POST requests
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

        // Expiration check
        if (Date.now() > expiresAtMs) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'This code has expired.' }) 
            };
        }

        // Hash verification
        const secret = process.env.OTP_SECRET || 'default-secret-do-not-use-in-production';
        const expectedHash = crypto.createHmac('sha256', secret).update(email + code + expiresAtMs).digest('hex');

        if (hash !== expectedHash) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'Invalid verification code.' }) 
            };
        }

        // Successful verification
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Verification successful' 
            })
        };
    } catch (error) {

        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            body: JSON.stringify({ error: 'Internal Server Error' }) 
        };
    }
};
