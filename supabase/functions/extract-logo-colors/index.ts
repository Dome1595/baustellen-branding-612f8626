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

    // Step 1: Download the image from URL
    const imageResponse = await fetch(logoUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    const imageBlob = await imageResponse.blob();
    
    // Step 2: Upload to Langdock
    const formData = new FormData();
    formData.append('file', imageBlob, 'logo.png');
    
    const uploadResponse = await fetch('https://api.langdock.com/attachment/v1/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Langdock upload error:', uploadResponse.status, errorText);
      throw new Error(`Failed to upload to Langdock: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    const attachmentId = uploadData.attachmentId;
    
    if (!attachmentId) {
      throw new Error('No attachmentId returned from upload');
    }

    console.log('Image uploaded, attachmentId:', attachmentId);

    // Step 3: Use attachmentId in chat completion
    const prompt = `Analysiere dieses Logo und extrahiere die 3 Hauptfarben. 

Gib die Farben als HEX-Codes zurück im Format:
PRIMARY: #HEXCODE
SECONDARY: #HEXCODE
ACCENT: #HEXCODE

Wähle:
- PRIMARY: Die dominanteste/wichtigste Farbe im Logo
- SECONDARY: Die zweithäufigste oder komplementäre Farbe
- ACCENT: Eine Akzentfarbe für Highlights

Falls das Logo hauptsächlich schwarz/weiß ist, wähle passende professionelle Farben für ein Handwerksunternehmen.`;

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
            content: prompt,
            attachments: [attachmentId]
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
    const content = data.result[0]?.content || '';
    
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
