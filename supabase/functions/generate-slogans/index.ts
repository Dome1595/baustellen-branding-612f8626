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
    const { trade, cluster, variant, primaryColor, secondaryColor, companyName, city } = await req.json();
    const LANGDOCK_API_KEY = Deno.env.get('LANGDOCK_API_KEY');
    const ASSISTANT_ID = Deno.env.get('LANGDOCK_ASSISTANT_ID_SLOGANS');

    if (!LANGDOCK_API_KEY || !ASSISTANT_ID) {
      throw new Error('LANGDOCK_API_KEY or ASSISTANT_ID not configured');
    }

    console.log('Generating slogans for:', { trade, cluster, variant, companyName, city });

    const prompt = `Generiere 5 kurze, prägnante Slogans für ein ${trade}-Unternehmen mit Fokus auf ${cluster} - ${variant}.
    
Unternehmensname: ${companyName}
Stadt/Region: ${city}
Markenfarben: ${primaryColor}, ${secondaryColor}

Die Slogans sollen:
- Maximal 5-7 Worte haben
- Emotional ansprechen
- Zur Zielgruppe passen (${variant})
- Authentisch und glaubwürdig sein
- Für Baustellen-Werbung geeignet sein

Gib nur die 5 Slogans zurück, einen pro Zeile, ohne Nummerierung oder zusätzliche Erklärungen.`;

    const response = await fetch('https://api.langdock.com/assistant/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: ASSISTANT_ID,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Langdock API error:', response.status, errorText);
      throw new Error(`Langdock API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.result[0]?.content || '';
    
    // Try to parse as JSON if the response is structured
    let slogans: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        slogans = parsed.suggestions;
      }
    } catch {
      // If not JSON, split by lines
      slogans = content.split('\n').filter((line: string) => line.trim().length > 0);
    }

    console.log('Generated slogans:', slogans);

    return new Response(JSON.stringify({ slogans }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-slogans:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
