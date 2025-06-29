// Polygon API Worker 

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json"
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log('Received request for path:', url.pathname);
    
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle AI analysis endpoint
    if (url.pathname === '/api/v1/analyze') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: `${request.method} method is not allowed` }),
         {status: 405, headers: corsHeaders});
      }

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

    // Handle stock data requests (existing functionality)
    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Parse the URL from the incoming request
    // Extract the ticker and dates from the request URL
    const ticker = url.searchParams.get("ticker");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    // Ensure necessary parameters are present
    if (!ticker || !startDate || !endDate) {
      return new Response("Missing required parameters", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Construct the Polygon API URL
    const polygonURL = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}`;
    try {
      const polygonResponse = await fetch(
        `${polygonURL}?apiKey=${env.POLYGON_API_KEY}`
      );
      if (!polygonResponse.ok) {
        throw new Error('Failed to fetch data from Polygon API.');
      }
      // Parse response body as JSON and remove `request_id` for AI Gateway caching
      const data = await polygonResponse.json();
      delete data.request_id;

      return new Response(JSON.stringify(data), { headers: corsHeaders });
    } catch (e) {
      return new Response(e.message, { status: 500, headers: corsHeaders });
    }
  },
};