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

    console.log('Generating mockups for project:', projectData.company_name || projectData.companyName);

    const mockups = [];

    // Generate mockups based on enabled media
    if (projectData.vehicle_enabled || projectData.vehicleEnabled) {
      const vehiclePrompt = `Create a highly realistic photographic mockup of a white commercial van with vehicle branding.

Company: ${projectData.company_name || projectData.companyName}
Slogan: "${projectData.slogan_selected || projectData.selectedSlogan}"
Brand Colors: ${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor}
Logo URL: ${projectData.logo_url || projectData.logoUrl}

Design Requirements:
- Display the company logo prominently on the van's side panel
- Show the company name in large, professional lettering using the primary brand color
- Include the slogan below the company name in a complementary font
- Add contact information (phone, website) in smaller text
- The design should be ${(projectData.creativity_level || projectData.creativityLevel) === 3 ? 'modern and creative with dynamic elements' : (projectData.creativity_level || projectData.creativityLevel) === 2 ? 'contemporary and professional' : 'traditional and conservative'}
- Use the brand colors throughout the design
- Show a realistic white commercial van (Mercedes Sprinter or similar) in a construction site setting
- The branding should look professionally vinyl-wrapped on the vehicle

CRITICAL: This must be a realistic photograph, not an illustration. The van should look like it's actually branded and driving/parked at a construction site.`;

      const vehicleResponse = await generateImage(vehiclePrompt, LOVABLE_API_KEY);
      mockups.push({
        type: 'vehicle',
        url: vehicleResponse,
        title: 'Fahrzeugbeschriftung',
      });
    }

    if (projectData.scaffold_enabled || projectData.scaffoldEnabled) {
      const scaffoldPrompt = `Create a highly realistic photographic mockup of construction scaffolding with a large branded banner/mesh.

Company: ${projectData.company_name || projectData.companyName}
Slogan: "${projectData.slogan_selected || projectData.selectedSlogan}"
Brand Colors: ${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor}
Logo URL: ${projectData.logo_url || projectData.logoUrl}

Design Requirements:
- Large-scale banner visible from street level
- Company logo prominently displayed
- Company name in huge, readable lettering using primary brand color
- Slogan visible and legible from distance
- Website/contact information included
- Professional construction site appearance
- The banner should cover a significant portion of the scaffolding
- Show realistic construction scaffolding on a building facade
- Design should use the specified brand colors

CRITICAL: This must be a realistic photograph of an actual construction site with the branded banner clearly visible.`;

      const scaffoldResponse = await generateImage(scaffoldPrompt, LOVABLE_API_KEY);
      mockups.push({
        type: 'scaffold',
        url: scaffoldResponse,
        title: 'Gerüstplane',
      });
    }

    if (projectData.fence_enabled || projectData.fenceEnabled) {
      const fencePrompt = `Create a highly realistic photographic mockup of construction site fence banners.

Company: ${projectData.company_name || projectData.companyName}
Slogan: "${projectData.slogan_selected || projectData.selectedSlogan}"
Brand Colors: ${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor}
Logo URL: ${projectData.logo_url || projectData.logoUrl}
Number of panels: ${projectData.fence_fields || projectData.fenceFields || 3}

Design Requirements:
- Multiple connected banner panels on construction fencing
- Company logo clearly visible
- Company name in bold lettering using primary brand color
- Slogan prominently displayed
- Contact information (phone/website)
- Professional construction site fence appearance
- Show the banners stretched across orange/yellow construction fence panels
- Design should span multiple fence sections seamlessly
- Use specified brand colors throughout

CRITICAL: This must be a realistic photograph of actual construction site fence with branded banners attached.`;

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
  // Optimize prompt for image generation
  const imagePrompt = `Generate a realistic mockup image: ${prompt}

IMPORTANT: Generate an actual image, not a description.`;

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
          content: imagePrompt
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
  console.log('Response structure:', JSON.stringify({
    model: data.model,
    hasImages: !!data.choices?.[0]?.message?.images,
    messageKeys: Object.keys(data.choices?.[0]?.message || {}),
    fullResponse: data
  }, null, 2));
  
  // Extract base64 image from response - check multiple possible locations
  let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  // Try alternative response structure
  if (!imageUrl && data.choices?.[0]?.message?.images?.[0]) {
    imageUrl = data.choices[0].message.images[0];
  }
  
  if (!imageUrl) {
    console.error('No image in response. Full data:', JSON.stringify(data, null, 2));
    throw new Error('No image generated - model may not support image generation or requires different parameters');
  }
  
  return imageUrl;
}
