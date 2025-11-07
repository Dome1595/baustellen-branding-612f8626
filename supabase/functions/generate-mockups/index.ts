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
    const { projectData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating mockups for project:', projectData.company_name);

    const mockups = [];

    // Generate mockups based on enabled media
    if (projectData.vehicle_enabled) {
      const vehiclePrompt = `Erstelle ein realistisches Mockup einer Fahrzeugbeschriftung für ein ${projectData.trade}-Unternehmen.

Unternehmensname: ${projectData.company_name}
Slogan: ${projectData.slogan_selected}
Markenfarben: ${projectData.primary_color}, ${projectData.secondary_color}, ${projectData.accent_color}
Kreativitäts-Level: ${projectData.creativity_level}/3

Das Design soll ${projectData.creativity_level === 3 ? 'kreativ und modern' : projectData.creativity_level === 2 ? 'modern und dynamisch' : 'konservativ und seriös'} sein.

Zeige das Logo, den Firmennamen, Slogan und Kontaktinformationen auf einem weißen Transporter.`;

      const vehicleResponse = await generateImage(vehiclePrompt, LOVABLE_API_KEY);
      mockups.push({
        type: 'vehicle',
        url: vehicleResponse,
        title: 'Fahrzeugbeschriftung',
      });
    }

    if (projectData.scaffold_enabled) {
      const scaffoldPrompt = `Erstelle ein realistisches Mockup einer Gerüstplane für ein ${projectData.trade}-Unternehmen.

Unternehmensname: ${projectData.company_name}
Slogan: ${projectData.slogan_selected}
Markenfarben: ${projectData.primary_color}, ${projectData.secondary_color}, ${projectData.accent_color}
Größe: ${projectData.scaffold_size || '250 x 205 cm'}

Das Design soll großflächig und aus der Ferne gut sichtbar sein. Zeige die Gerüstplane an einer Baustelle.`;

      const scaffoldResponse = await generateImage(scaffoldPrompt, LOVABLE_API_KEY);
      mockups.push({
        type: 'scaffold',
        url: scaffoldResponse,
        title: 'Gerüstplane',
      });
    }

    if (projectData.fence_enabled) {
      const fencePrompt = `Erstelle ein realistisches Mockup eines Bauzaunbanners für ein ${projectData.trade}-Unternehmen.

Unternehmensname: ${projectData.company_name}
Slogan: ${projectData.slogan_selected}
Markenfarben: ${projectData.primary_color}, ${projectData.secondary_color}, ${projectData.accent_color}
Anzahl Felder: ${projectData.fence_fields || 3}

Das Design soll auf einem Bauzaun an einer Straße zu sehen sein.`;

      const fenceResponse = await generateImage(fencePrompt, LOVABLE_API_KEY);
      mockups.push({
        type: 'fence',
        url: fenceResponse,
        title: 'Bauzaunbanner',
      });
    }

    console.log('Generated mockups:', mockups.length);

    return new Response(JSON.stringify({ mockups }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-mockups:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateImage(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      modalities: ['image', 'text']
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
    
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('Lovable AI response received');
  
  // Extract base64 image from response
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageUrl) {
    console.error('No image in response:', JSON.stringify(data, null, 2));
    throw new Error('No image generated');
  }
  
  return imageUrl;
}
