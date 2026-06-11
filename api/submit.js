const crypto = require('crypto');

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body || {};
        const query = req.query || {};

        if (!body.name || !body.phone) {
            const referer = req.headers.referer || '/';
            return res.redirect(302, referer);
        }

        const apiKey = 'c66289394c2a6e8515c8e8b382fba719';
        const offerId = '14368';
        const userId = '75329';
        const apiDomain = 'https://t-api.org';

        // Prepare parameters similar to the PHP version
        const params = {
            name: (body.name || '').trim(),
            phone: (body.phone || '').trim(),
            offer_id: offerId,
            country: 'SI', // Default country from api.php line 21
            stream_id: '',
            tz: '',
            address: body.address || null,
            region: body.region || null,
            city: body.city || null,
            zip: body.zip || null,
            count: body.count || null,
            email: body.email || null,
            user_comment: body.user_comment || null,
            referer: query.referer || req.headers.referer || null,
            utm_source: query.utm_source || null,
            utm_medium: query.utm_medium || null,
            utm_campaign: query.utm_campaign || null,
            utm_term: query.utm_term || null,
            utm_content: query.utm_content || null,
            sub_id: query.sub_id || null,
            sub_id_1: query.sub_id_1 || null,
            sub_id_2: query.sub_id_2 || null,
            sub_id_3: query.sub_id_3 || null,
            sub_id_4: query.sub_id_4 || null,
            user_agent: req.headers['user-agent'] || null,
            ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || null
        };

        // Filter parameters matching $not_require_params in api.php
        const notRequireParams = [
            'tz', 'address', 'region', 'city', 'zip', 'stream_id', 'count', 'email', 'user_comment',
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'sub_id', 'sub_id_1', 'sub_id_2', 'sub_id_3', 'sub_id_4',
            'referer', 'user_agent', 'ip'
        ];

        const dataPayload = {
            name: params.name,
            phone: params.phone,
            offer_id: offerId,
            country: params.country
        };

        for (const key of notRequireParams) {
            if (params[key] !== undefined && params[key] !== null) {
                dataPayload[key] = params[key];
            }
        }

        const requestData = {
            user_id: userId,
            data: dataPayload
        };

        const jsonData = JSON.stringify(requestData);

        // Calculate checksum: sha1(json_data + api_key)
        const checkSum = crypto.createHash('sha1').update(jsonData + apiKey).digest('hex');

        const apiUrl = `${apiDomain}/api/lead/create?check_sum=${checkSum}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const responseData = await response.json();

        if (responseData.status === 'ok') {
            const leadId = responseData.data.id;
            return res.redirect(302, `/success.html?id=${leadId}`);
        } else if (responseData.status === 'error') {
            throw new Error(responseData.error || 'Unknown API error');
        } else {
            throw new Error('Unknown response status from lead API');
        }

    } catch (error) {
        console.error('API submission error:', error);
        return res.status(500).send(`Error: ${error.message}`);
    }
};
