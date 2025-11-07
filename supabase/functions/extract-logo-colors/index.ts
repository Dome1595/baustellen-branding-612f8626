import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { logoUrl } = await req.json();
    const LANGDOCK_API_KEY = Deno.env.get('LANGDOCK_API_KEY');
    const ASSISTANT_ID = Deno.env.get('LANGDOCK_ASSISTANT_ID_COLORS');

    if (!LANGDOCK_API_KEY || !ASSISTANT_ID) {
      throw new Error('LANGDOCK_API_KEY or ASSISTANT_ID not configured');
    }

    console.log('Extracting colors from logo:', logoUrl);

    const prompt = `Analysiere dieses Logo und extrahiere die 3 Hauptfarben. 
    
Gib die Farben als HEX-Codes zurück im Format:
PRIMARY: #HEXCODE
SECONDARY: #HEXCODE
ACCENT: #HEXCODE

Wähle:
- PRIMARY: Die dominanteste/wichtigste Farbe im Logo
- SECONDARY: Die zweithäufigste oder komplementäre Farbe
- ACCENT: Eine Akzentfarbe für Highlights

Falls das Logo hauptsächlich schwarz/weiß ist, wähle passende professionelle Farben für ein Handwerksunternehmen.

Bild URL: ${logoUrl}`;

    // Create thread
    const threadResponse = await fetch('https://api.langdock.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('Langdock thread creation error:', threadResponse.status, errorText);
      throw new Error(`Failed to create thread: ${threadResponse.status}`);
    }

    const threadData = await threadResponse.json();
    const threadId = threadData.id;

    // Add message with image
    const messageResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: logoUrl } }
        ],
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Langdock message error:', messageResponse.status, errorText);
      throw new Error(`Failed to add message: ${messageResponse.status}`);
    }

    // Run assistant
    const runResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Langdock run error:', runResponse.status, errorText);
      throw new Error(`Failed to run assistant: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // Poll for completion
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 30;

    while (runStatus !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
      }
      
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error('Assistant run timeout');
    }

    // Get messages
    const messagesResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
      },
    });

    if (!messagesResponse.ok) {
      throw new Error('Failed to get messages');
    }

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');
    const content = assistantMessage?.content[0]?.text?.value || '';
    
    // Parse the color codes from the response
    const primaryMatch = content.match(/PRIMARY:\s*(#[0-9A-Fa-f]{6})/);
    const secondaryMatch = content.match(/SECONDARY:\s*(#[0-9A-Fa-f]{6})/);
    const accentMatch = content.match(/ACCENT:\s*(#[0-9A-Fa-f]{6})/);

    const colors = {
      primaryColor: primaryMatch ? primaryMatch[1] : '#1B4965',
      secondaryColor: secondaryMatch ? secondaryMatch[1] : '#62B6CB',
      accentColor: accentMatch ? accentMatch[1] : '#BEE9E8',
    };

    console.log('Extracted colors:', colors);

    return new Response(JSON.stringify(colors), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in extract-logo-colors:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
