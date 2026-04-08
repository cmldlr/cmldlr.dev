const crypto = require('crypto');

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };
    }

    try {
        const { image, filename } = JSON.parse(event.body);

        if (!image || !filename) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'image and filename are required' })
            };
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'Supabase configuration missing' })
            };
        }

        // base64 → Buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Content type tespit
        let contentType = 'image/jpeg';
        if (image.startsWith('data:image/png')) contentType = 'image/png';
        else if (image.startsWith('data:image/webp')) contentType = 'image/webp';
        else if (image.startsWith('data:image/gif')) contentType = 'image/gif';

        // Dosya uzantısı
        const ext = contentType.split('/')[1];
        const timestamp = Date.now();
        const safeName = filename.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
        const filePath = `projects/${safeName}-${timestamp}.${ext}`;

        // Supabase Storage'a yükle
        const uploadResp = await fetch(
            `${SUPABASE_URL}/storage/v1/object/images/${filePath}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
                    'Content-Type': contentType,
                    'x-upsert': 'true'
                },
                body: buffer
            }
        );

        if (!uploadResp.ok) {
            const errText = await uploadResp.text();

            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'Image upload failed' })
            };
        }

        // Public URL oluştur
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;



        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            body: JSON.stringify({ success: true, url: publicUrl })
        };
    } catch (error) {

        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
