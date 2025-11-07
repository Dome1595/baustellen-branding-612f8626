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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Extracting colors from logo:', logoUrl);

    const prompt = `Analysiere dieses Logo und extrahiere die 3 Hauptfarben als HEX-Codes.

Antworte AUSSCHLIESSLICH in diesem exakten Format (keine zusätzlichen Erklärungen):
PRIMARY: #HEXCODE
SECONDARY: #HEXCODE
ACCENT: #HEXCODE

Wähle:
- PRIMARY: Die dominanteste/wichtigste Markenfarbe im Logo
- SECONDARY: Die zweithäufigste oder komplementäre Farbe
- ACCENT: Eine Akzentfarbe für Highlights

Falls das Logo hauptsächlich schwarz/weiß ist, wähle passende professionelle Farben für ein Handwerksunternehmen (z.B. Blautöne, Grüntöne).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: logoUrl } }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`Color extraction failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', content);
    
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
