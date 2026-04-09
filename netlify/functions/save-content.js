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
        const { section, data } = JSON.parse(event.body);

        if (!section || data === undefined) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'section and data are required' })
            };
        }

        // Security: only allow permitted sections
        const ALLOWED_SECTIONS = ['hero', 'about', 'skills', 'projects', 'certificates', 'contact', 'translations'];
        if (!ALLOWED_SECTIONS.includes(section)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'Invalid section: ' + section })
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

        // Upsert: update if exists, create if not
        const resp = await fetch(
            `${SUPABASE_URL}/rest/v1/site_content?id=eq.${section}`,
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
                }
            }
        );

        const existing = await resp.json();

        let saveResp;
        if (existing && existing.length > 0) {
            // UPDATE
            saveResp = await fetch(
                `${SUPABASE_URL}/rest/v1/site_content?id=eq.${section}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ data })
                }
            );
        } else {
            // INSERT
            saveResp = await fetch(
                `${SUPABASE_URL}/rest/v1/site_content`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ id: section, data })
                }
            );
        }

        if (!saveResp.ok) {
            const errText = await saveResp.text();

            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
                body: JSON.stringify({ error: 'Database save failed' })
            };
        }



        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            body: JSON.stringify({ success: true, section })
        };
    } catch (error) {

        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
