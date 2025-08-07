// Using native fetch API available in Node.js 18+

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse the request body
        const requestData = JSON.parse(event.body);
        console.log('Received series info request:', requestData);

        // Statistics Canada API endpoint for series info
        const apiUrl = 'https://www150.statcan.gc.ca/t1/wds/rest/getSeriesInfoFromVector';

        // Make the request to Statistics Canada API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            console.error('Statistics Canada Series Info API error:', response.status, response.statusText);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Statistics Canada Series Info API returned ${response.status}: ${response.statusText}` 
                })
            };
        }

        // Get the response data
        const data = await response.json();
        console.log('Statistics Canada Series Info API response received');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error in getSeriesInfo function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};
