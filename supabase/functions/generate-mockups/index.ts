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
    const logoUrl = projectData.logo_url || projectData.logoUrl;

    // Generate mockups based on enabled media
    if (projectData.vehicle_enabled || projectData.vehicleEnabled) {
      const contactInfo = [];
      if (projectData.phone) contactInfo.push(`Phone: ${projectData.phone}`);
      if (projectData.website) contactInfo.push(`Website: ${projectData.website}`);
      if (projectData.address) contactInfo.push(`Address: ${projectData.address}`);

      const vehiclePrompt = `Create a highly realistic photographic mockup of a white commercial van with vehicle branding.

Company: ${projectData.company_name || projectData.companyName}
Slogan: "${projectData.slogan_selected || projectData.selectedSlogan}"
Contact: ${contactInfo.join(' | ')}
Brand Colors: ${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor}

Design Requirements:
- Show the company name in LARGE, bold, professional lettering using the primary brand color (${projectData.primary_color || projectData.primaryColor})
- ${logoUrl ? 'Use the EXACT company logo provided in the image above - place it prominently on the van\'s side panel' : 'Display a prominent company logo symbol/icon on the van\'s side panel'}
- Include the slogan "${projectData.slogan_selected || projectData.selectedSlogan}" below the company name in a complementary font
- Add contact information in smaller text: ${contactInfo.join(', ')}
- The design should be ${(projectData.creativity_level || projectData.creativityLevel) === 3 ? 'modern and creative with dynamic elements' : (projectData.creativity_level || projectData.creativityLevel) === 2 ? 'contemporary and professional' : 'traditional and conservative'}
- Use the brand colors (${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor}) throughout the design
- Show a realistic white commercial van (Mercedes Sprinter or similar) in a construction site setting
- The branding should look professionally vinyl-wrapped on the vehicle with visible company logo, name, slogan, and contact details

CRITICAL: This must be a realistic photograph, not an illustration. The van should have clearly visible text with company name, logo, slogan, and contact information.`;

      const vehicleResponse = await generateImage(vehiclePrompt, LOVABLE_API_KEY, logoUrl);
      mockups.push({
        type: 'vehicle',
        url: vehicleResponse,
        title: 'Fahrzeugbeschriftung',
      });
    }

    if (projectData.scaffold_enabled || projectData.scaffoldEnabled) {
      const contactInfo = [];
      if (projectData.phone) contactInfo.push(projectData.phone);
      if (projectData.website) contactInfo.push(projectData.website);

      const scaffoldPrompt = `Create a highly realistic photographic mockup of construction scaffolding with a large branded banner/mesh.

Company: ${projectData.company_name || projectData.companyName}
Slogan: "${projectData.slogan_selected || projectData.selectedSlogan}"
Contact: ${contactInfo.join(' | ')}
Brand Colors: ${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor}

Design Requirements:
- Large-scale banner visible from street level covering significant portion of scaffolding
- ${logoUrl ? 'Use the EXACT company logo provided in the image above - display it prominently at the top of the banner' : 'Company logo symbol prominently displayed at the top'}
- Company name "${projectData.company_name || projectData.companyName}" in HUGE, bold, readable lettering using primary color
- Slogan "${projectData.slogan_selected || projectData.selectedSlogan}" visible and legible from distance
- Contact information (${contactInfo.join(', ')}) clearly displayed
- Professional construction site appearance with realistic scaffolding on a building facade
- Use specified brand colors (${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor})
- Banner should show logo symbol, company name, slogan, and contact details

CRITICAL: This must be a realistic photograph of an actual construction site with the branded banner displaying all text and logo clearly visible.`;

      const scaffoldResponse = await generateImage(scaffoldPrompt, LOVABLE_API_KEY, logoUrl);
      mockups.push({
        type: 'scaffold',
        url: scaffoldResponse,
        title: 'Gerüstplane',
      });
    }

    if (projectData.fence_enabled || projectData.fenceEnabled) {
      const contactInfo = [];
      if (projectData.phone) contactInfo.push(projectData.phone);
      if (projectData.website) contactInfo.push(projectData.website);

      const fencePrompt = `Create a highly realistic photographic mockup of construction site fence banners.

Company: ${projectData.company_name || projectData.companyName}
Slogan: "${projectData.slogan_selected || projectData.selectedSlogan}"
Contact: ${contactInfo.join(' | ')}
Brand Colors: ${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor}
Number of panels: ${projectData.fence_fields || projectData.fenceFields || 3}

Design Requirements:
- Multiple connected banner panels (${projectData.fence_fields || projectData.fenceFields || 3} panels) on construction fencing
- ${logoUrl ? 'Use the EXACT company logo provided in the image above - display it clearly on the banners' : 'Company logo symbol clearly visible on the banners'}
- Company name "${projectData.company_name || projectData.companyName}" in bold lettering using primary color
- Slogan "${projectData.slogan_selected || projectData.selectedSlogan}" prominently displayed
- Contact information displayed: ${contactInfo.join(', ')}
- Professional construction site fence appearance with banners stretched across orange/yellow construction fence panels
- Design should span multiple fence sections seamlessly
- Use specified brand colors (${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor})
- Show logo symbol, company name, slogan, and contact info on the fence banners

CRITICAL: This must be a realistic photograph of actual construction site fence with branded banners clearly showing all text and logo.`;

      const fenceResponse = await generateImage(fencePrompt, LOVABLE_API_KEY, logoUrl);
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

async function generateImage(prompt: string, apiKey: string, logoUrl?: string): Promise<string> {
  // Optimize prompt for image generation
  const imagePrompt = `Generate a realistic mockup image: ${prompt}

IMPORTANT: ${logoUrl ? 'Use the provided company logo image in the mockup. Place it prominently and professionally.' : 'Generate an actual image, not a description.'}`;

  // Build message content - multimodal if logo is provided
  let messageContent: any;
  
  if (logoUrl) {
    // Fetch logo to get as base64 or use URL directly
    messageContent = [
      {
        type: 'text',
        text: imagePrompt
      },
      {
        type: 'image_url',
        image_url: {
          url: logoUrl
        }
      }
    ];
  } else {
    messageContent = imagePrompt;
  }

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
          content: messageContent
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
