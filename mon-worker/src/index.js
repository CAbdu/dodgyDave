const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log('Received request for path:', url.pathname);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: `${request.method} method is not allowed` }),
       {status: 405, headers: corsHeaders});
    }

    // Handle root path
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Stock Analysis API is running',
        endpoints: {
          analyze: '/api/v1/analyze',
          health: '/api/v1/health'
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Handle health check endpoint
    if (url.pathname === '/api/v1/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Handle stock analysis endpoint
    if (url.pathname === '/api/v1/analyze') {
      try {
        // Log the raw request
        console.log('Received analysis request');
        
        // Parse the request body
        let body;
        try {
          body = await request.json();
          console.log('Parsed request body:', JSON.stringify(body));
        } catch (parseError) {
          console.error('Error parsing request body:', parseError);
          return new Response(JSON.stringify({ 
            error: 'Invalid JSON in request body',
            details: parseError.message
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
        
        // Validate messages
        if (!body.messages || !Array.isArray(body.messages)) {
          console.error('Invalid messages format:', body);
          return new Response(JSON.stringify({ 
            error: 'Invalid messages format. Expected an array of messages.',
            received: body
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // Check API key
        if (!env.OPENAI_API_KEY) {
          console.error('OPENAI_API_KEY is not configured');
          return new Response(JSON.stringify({ 
            error: 'Server configuration error: OPENAI_API_KEY is not configured'
          }), {
            status: 500,
            headers: corsHeaders
          });
        }

        // Make request to OpenAI
        console.log('Making request to OpenAI API...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: body.messages,
            temperature: 1.1,
            presence_penalty: 0,
            frequency_penalty: 0
          })
        });

        // Parse OpenAI response
        const data = await response.json();
        console.log('OpenAI API response:', JSON.stringify(data));
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'OpenAI API error');
        }

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from OpenAI API');
        }

        // Return the response
        const responseData = data.choices[0].message;
        return new Response(JSON.stringify(responseData), { 
          status: 200,
          headers: corsHeaders
        });
      } catch(e) {
        console.error('Worker error:', e);
        return new Response(JSON.stringify({ 
          error: e.message,
          details: e.stack
        }), { 
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Handle unknown endpoints
    return new Response(JSON.stringify({ 
      error: 'Endpoint not found',
      available_endpoints: ['/api/v1/analyze', '/api/v1/health']
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
};