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
    
    // Clean up the response to extract only the slogans
    let slogans: string[] = [];
    
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        slogans = parsed.suggestions;
      }
    } catch {
      // If not JSON, extract lines that look like slogans
      const lines = content.split('\n');
      slogans = lines
        .filter((line: string) => {
          const trimmed = line.trim();
          // Filter out JSON syntax, system messages, and empty lines
          return trimmed.length > 0 && 
                 !trimmed.startsWith('{') && 
                 !trimmed.startsWith('}') && 
                 !trimmed.startsWith('"cluster"') && 
                 !trimmed.startsWith('"variant"') && 
                 !trimmed.startsWith('"suggestions"') && 
                 !trimmed.includes('Ihr Anfrage') &&
                 !trimmed.includes('Die Vorgaben') &&
                 !trimmed.match(/^\d+\.\s/) && // Remove numbered items
                 trimmed !== '[' && 
                 trimmed !== ']';
        })
        .map((line: string) => {
          // Clean up quotes and extra formatting
          return line.trim()
            .replace(/^["']|["']$/g, '') // Remove quotes at start/end
            .replace(/^-\s*/, '') // Remove leading dashes
            .replace(/,\s*$/, ''); // Remove trailing commas
        })
        .filter((line: string) => line.length > 5 && line.length < 100); // Reasonable slogan length
    }
    
    // Take only first 5 slogans
    slogans = slogans.slice(0, 5);

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
