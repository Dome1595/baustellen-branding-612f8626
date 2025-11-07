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
    const LANGDOCK_API_KEY = Deno.env.get('LANGDOCK_API_KEY');
    const LANGDOCK_ASSISTANT_ID = Deno.env.get('LANGDOCK_ASSISTANT_ID_MOCKUPS');

    if (!LANGDOCK_API_KEY) {
      throw new Error('LANGDOCK_API_KEY not configured');
    }

    if (!LANGDOCK_ASSISTANT_ID) {
      throw new Error('LANGDOCK_ASSISTANT_ID_MOCKUPS not configured');
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

      // STEP 1: Generate clean base mockup with Langdock FLUX
      const vehiclePrompt = `Create a highly realistic photographic mockup of a white commercial van (Mercedes Sprinter style).

Requirements:
- Professional side view showing the entire van
- White, clean vehicle surface
- Realistic lighting and shadows
- Construction or urban work environment background
- Large, smooth side panel area perfect for branding
- High resolution, photorealistic quality
- No text, logos, or graphics on the van - completely clean white surface

CRITICAL: This must be a clean, realistic photograph of a white commercial van with a blank side panel, ready for branding to be added later.`;

      console.log('STEP 1: Generating clean base vehicle mockup with FLUX...');
      const baseVehicleUrl = await generateImageWithLangdock(vehiclePrompt, LANGDOCK_API_KEY, LANGDOCK_ASSISTANT_ID);
      
      // STEP 2: Add logo and text with Lovable AI
      console.log('STEP 2: Adding logo and branding with Lovable AI...');
      const vehicleResponse = await editMockupWithLogo(
        baseVehicleUrl,
        logoUrl,
        {
          companyName: projectData.company_name || projectData.companyName,
          slogan: projectData.slogan_selected || projectData.selectedSlogan,
          contact: contactInfo.join(' | '),
          primaryColor: projectData.primary_color || projectData.primaryColor,
          secondaryColor: projectData.secondary_color || projectData.secondaryColor,
          creativityLevel: projectData.creativity_level || projectData.creativityLevel
        }
      );
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

      // STEP 1: Generate clean base scaffolding mockup
      const scaffoldPrompt = `Create a highly realistic photographic mockup of construction scaffolding with a large blank banner/mesh.

Requirements:
- Professional construction site with scaffolding on building facade
- Large white/neutral colored banner covering significant portion of scaffolding
- Banner should be clean, smooth, and ready for graphics
- Realistic lighting and urban construction environment
- Street-level perspective showing entire banner clearly
- High resolution, photorealistic quality
- No text, logos, or graphics on the banner - completely blank surface

CRITICAL: This must be a realistic photograph of construction scaffolding with a blank banner, ready for branding to be added later.`;

      console.log('STEP 1: Generating clean base scaffold mockup with FLUX...');
      const baseScaffoldUrl = await generateImageWithLangdock(scaffoldPrompt, LANGDOCK_API_KEY, LANGDOCK_ASSISTANT_ID);
      
      // STEP 2: Add logo and text with Lovable AI
      console.log('STEP 2: Adding logo and branding to scaffold with Lovable AI...');
      const scaffoldResponse = await editMockupWithLogo(
        baseScaffoldUrl,
        logoUrl,
        {
          companyName: projectData.company_name || projectData.companyName,
          slogan: projectData.slogan_selected || projectData.selectedSlogan,
          contact: contactInfo.join(', '),
          primaryColor: projectData.primary_color || projectData.primaryColor,
          secondaryColor: projectData.secondary_color || projectData.secondaryColor,
          creativityLevel: projectData.creativity_level || projectData.creativityLevel
        }
      );
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

      // STEP 1: Generate clean base fence mockup
      const fencePrompt = `Create a highly realistic photographic mockup of construction site fence with blank banners.

Requirements:
- Multiple connected banner panels (${projectData.fence_fields || projectData.fenceFields || 3} panels) on orange/yellow construction fence
- Banners should be white/neutral and completely blank
- Professional construction site environment
- Realistic lighting and urban setting
- Banners stretched taut across fence panels
- High resolution, photorealistic quality
- No text, logos, or graphics on the banners - completely clean surface

CRITICAL: This must be a realistic photograph of construction site fence with blank banners, ready for branding to be added later.`;

      console.log('STEP 1: Generating clean base fence mockup with FLUX...');
      const baseFenceUrl = await generateImageWithLangdock(fencePrompt, LANGDOCK_API_KEY, LANGDOCK_ASSISTANT_ID);
      
      // STEP 2: Add logo and text with Lovable AI
      console.log('STEP 2: Adding logo and branding to fence with Lovable AI...');
      const fenceResponse = await editMockupWithLogo(
        baseFenceUrl,
        logoUrl,
        {
          companyName: projectData.company_name || projectData.companyName,
          slogan: projectData.slogan_selected || projectData.selectedSlogan,
          contact: contactInfo.join(', '),
          primaryColor: projectData.primary_color || projectData.primaryColor,
          secondaryColor: projectData.secondary_color || projectData.secondaryColor,
          creativityLevel: projectData.creativity_level || projectData.creativityLevel
        }
      );
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

// STEP 2: Edit mockup with logo and text using Lovable AI
async function editMockupWithLogo(
  baseMockupUrl: string,
  logoUrl: string | undefined,
  brandData: {
    companyName: string;
    slogan: string;
    contact: string;
    primaryColor: string;
    secondaryColor: string;
    creativityLevel?: number;
  }
): Promise<string> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Editing mockup with Lovable AI. Base mockup:', baseMockupUrl);
    
    // Build optimized editing prompt for maximum quality
    const styleDescription = brandData.creativityLevel === 3 
      ? 'modern, creative, and dynamic style' 
      : brandData.creativityLevel === 2 
      ? 'contemporary and professional style' 
      : 'traditional and conservative style';
    
    const editPrompt = logoUrl 
      ? `PROFESSIONAL VEHICLE/CONSTRUCTION BRANDING - HIGH QUALITY MOCKUP EDITING

**CRITICAL QUALITY REQUIREMENTS:**
- Output must be ULTRA HIGH RESOLUTION with razor-sharp clarity
- ALL text must be CRYSTAL CLEAR, perfectly sharp, and 100% readable
- Logo must maintain perfect quality and clarity
- Colors must be vibrant, accurate, and professionally rendered
- Final result must look like premium professional vinyl graphics/wrapping

**STEP-BY-STEP BRANDING INSTRUCTIONS:**

1. LOGO INTEGRATION:
   - Fetch the company logo from: ${logoUrl}
   - Maintain ORIGINAL logo quality - no degradation or blur
   - Place logo prominently on the vehicle/surface (upper left or center area)
   - Size: Logo should be clearly visible but proportional (15-20% of branding area)
   - Ensure logo has perfect clarity and sharp edges

2. COMPANY NAME:
   - Text: "${brandData.companyName}"
   - Font: BOLD, EXTRA LARGE, ultra-professional sans-serif typeface
   - Color: EXACT color ${brandData.primaryColor} (apply precisely)
   - Position: Next to or below logo as main focal point
   - Size: 2-3x larger than slogan - this is the PRIMARY element
   - Quality: Text must be RAZOR SHARP with perfect anti-aliasing

3. SLOGAN:
   - Text: "${brandData.slogan}"
   - Font: Professional complementary font, medium weight
   - Color: ${brandData.secondaryColor} or subtle variant of primary
   - Position: Directly below company name with proper spacing
   - Size: Medium - clearly readable from distance
   - Quality: SHARP and perfectly legible

4. CONTACT INFORMATION:
   - Text: ${brandData.contact}
   - Font: Clean, professional, highly readable
   - Color: ${brandData.primaryColor} or contrasting color for visibility
   - Position: Lower area or bottom right of branding space
   - Size: Smaller but still easily readable
   - Quality: Sharp and clear

5. DESIGN STYLE:
   - Overall aesthetic: ${styleDescription}
   - Layout: Professional, balanced, with proper white space
   - Hierarchy: Logo + Company Name (primary) → Slogan (secondary) → Contact (tertiary)
   - Colors: Use ${brandData.primaryColor} and ${brandData.secondaryColor} strategically
   - Integration: Make branding look like real vinyl wrap/decals with subtle shadows and reflections matching the vehicle surface

6. QUALITY ASSURANCE:
   - Text rendering: ULTRA SHARP - no blur, no pixelation
   - Logo quality: PRISTINE - maintain original resolution and clarity
   - Color accuracy: EXACT match to specified hex colors
   - Professional finish: Must look like $5000+ professional vehicle wrap job
   - Realism: Subtle reflections, proper shadows, vinyl texture where appropriate

FINAL OUTPUT: Ultra high-resolution mockup with professional-grade branding that looks indistinguishable from real commercial vehicle graphics. Every element must be sharp, clear, and professionally executed.`
      : `PROFESSIONAL VEHICLE/CONSTRUCTION BRANDING - HIGH QUALITY MOCKUP EDITING

**CRITICAL QUALITY REQUIREMENTS:**
- Output must be ULTRA HIGH RESOLUTION with razor-sharp clarity
- ALL text must be CRYSTAL CLEAR, perfectly sharp, and 100% readable
- Colors must be vibrant, accurate, and professionally rendered
- Final result must look like premium professional vinyl graphics/wrapping

**STEP-BY-STEP BRANDING INSTRUCTIONS:**

1. LOGO CREATION:
   - Create a simple, professional logo icon/symbol representing construction/trades
   - Style: Clean, modern, and memorable
   - Color: Use ${brandData.primaryColor}
   - Position: Upper left or center area of branding space
   - Size: Prominent but proportional (15-20% of branding area)
   - Quality: SHARP vector-style clarity

2. COMPANY NAME:
   - Text: "${brandData.companyName}"
   - Font: BOLD, EXTRA LARGE, ultra-professional sans-serif typeface
   - Color: EXACT color ${brandData.primaryColor} (apply precisely)
   - Position: Next to or below logo as main focal point
   - Size: 2-3x larger than slogan - this is the PRIMARY element
   - Quality: Text must be RAZOR SHARP with perfect anti-aliasing

3. SLOGAN:
   - Text: "${brandData.slogan}"
   - Font: Professional complementary font, medium weight
   - Color: ${brandData.secondaryColor} or subtle variant of primary
   - Position: Directly below company name with proper spacing
   - Size: Medium - clearly readable from distance
   - Quality: SHARP and perfectly legible

4. CONTACT INFORMATION:
   - Text: ${brandData.contact}
   - Font: Clean, professional, highly readable
   - Color: ${brandData.primaryColor} or contrasting color for visibility
   - Position: Lower area or bottom right of branding space
   - Size: Smaller but still easily readable
   - Quality: Sharp and clear

5. DESIGN STYLE:
   - Overall aesthetic: ${styleDescription}
   - Layout: Professional, balanced, with proper white space
   - Hierarchy: Logo + Company Name (primary) → Slogan (secondary) → Contact (tertiary)
   - Colors: Use ${brandData.primaryColor} and ${brandData.secondaryColor} strategically
   - Integration: Make branding look like real vinyl wrap/decals with subtle shadows and reflections

6. QUALITY ASSURANCE:
   - Text rendering: ULTRA SHARP - no blur, no pixelation
   - Color accuracy: EXACT match to specified hex colors
   - Professional finish: Must look like $5000+ professional vehicle wrap job
   - Realism: Subtle reflections, proper shadows, vinyl texture where appropriate

FINAL OUTPUT: Ultra high-resolution mockup with professional-grade branding that looks indistinguishable from real commercial vehicle graphics. Every element must be sharp, clear, and professionally executed.`;

    // Call Lovable AI Gateway with image editing
    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: editPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: baseMockupUrl
            }
          }
        ]
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: messages,
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');

    // Extract the edited image
    const editedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!editedImageUrl) {
      console.error('No edited image in Lovable AI response');
      throw new Error('No edited image returned from Lovable AI');
    }

    // If it's a base64 data URL, upload to Supabase Storage
    if (editedImageUrl.startsWith('data:image')) {
      console.log('Uploading edited image to Supabase Storage...');
      
      const base64Data = editedImageUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const fileName = `edited-mockup-${Date.now()}.png`;
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/mockups/${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'image/png',
          'x-upsert': 'true',
        },
        body: bytes,
      });
      
      if (uploadResponse.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/mockups/${fileName}`;
        console.log('Edited image uploaded to Storage:', publicUrl);
        return publicUrl;
      } else {
        const errorText = await uploadResponse.text();
        console.error('Failed to upload edited image:', uploadResponse.status, errorText);
        return editedImageUrl; // Fallback to data URL
      }
    }

    return editedImageUrl;
  } catch (error) {
    console.error('Error editing mockup with Lovable AI:', error);
    throw error;
  }
}

// STEP 1: Generate clean base mockup with Langdock FLUX
async function generateImageWithLangdock(
  prompt: string, 
  apiKey: string, 
  assistantId: string
): Promise<string> {
  try {
    console.log('Generating clean base mockup with Langdock FLUX');
    
    // Call Langdock Assistant API for clean base mockup (no logo needed)
    const response = await fetch('https://api.langdock.com/assistant/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: assistantId,
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Langdock API error:', response.status, errorText);
      throw new Error(`Langdock API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Langdock response structure:', JSON.stringify({
      hasResult: !!data.result,
      hasOutput: !!data.output,
      resultLength: data.result?.length,
      fullResponse: data
    }, null, 2));

    // Extract image URL or Base64 from response
    // Check result array for tool results with generated images
    if (data.result && Array.isArray(data.result)) {
      for (const item of data.result) {
        // Check tool results for image generation output
        if (item.role === 'tool' && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (contentItem.toolName === 'image_generation' && contentItem.result) {
              // Check for images array with base64 or url
              if (contentItem.result.images && Array.isArray(contentItem.result.images)) {
                const firstImage = contentItem.result.images[0];
                
                // Check for base64 data
                if (firstImage?.base64) {
                  console.log('Found base64 image, uploading to Supabase Storage');
                  const base64Data = firstImage.base64;
                  
                  // Convert base64 to binary
                  const binaryString = atob(base64Data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  
                  // Upload to Supabase Storage
                  const fileName = `mockup-${Date.now()}.png`;
                  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
                  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
                  
                  try {
                    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/mockups/${fileName}`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'Content-Type': 'image/png',
                        'x-upsert': 'true',
                      },
                      body: bytes,
                    });
                    
                    if (uploadResponse.ok) {
                      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/mockups/${fileName}`;
                      console.log('Image uploaded to Storage:', publicUrl);
                      return publicUrl;
                    } else {
                      const errorText = await uploadResponse.text();
                      console.error('Failed to upload to Storage:', uploadResponse.status, errorText);
                      
                      // Fallback: return as data URL
                      console.log('Falling back to data URL');
                      return `data:image/png;base64,${base64Data}`;
                    }
                  } catch (uploadError) {
                    console.error('Upload error:', uploadError);
                    // Fallback: return as data URL
                    return `data:image/png;base64,${base64Data}`;
                  }
                }
                
                // Check for URL (not "N/A")
                if (firstImage?.url && firstImage.url !== 'N/A') {
                  console.log('Found image URL in images array');
                  return firstImage.url;
                }
                
                // Check for string image
                if (typeof firstImage === 'string' && firstImage !== 'N/A') {
                  console.log('Found image in images array');
                  return firstImage;
                }
              }
              
              // Check for output field with image URL
              if (contentItem.result.output && contentItem.result.output !== 'N/A') {
                console.log('Found image in tool result output');
                return contentItem.result.output;
              }
              
              // Check for imageUrl field
              if (contentItem.result.imageUrl && contentItem.result.imageUrl !== 'N/A') {
                console.log('Found imageUrl in tool result');
                return contentItem.result.imageUrl;
              }
              
              // Check for url field
              if (contentItem.result.url && contentItem.result.url !== 'N/A') {
                console.log('Found url in tool result');
                return contentItem.result.url;
              }
              
              // Log if there was an error
              if (contentItem.result.error) {
                console.error('Image generation error:', contentItem.result.error);
              }
            }
          }
        }
        
        // Check for assistant role with string content (direct image URL)
        if (item.role === 'assistant' && typeof item.content === 'string') {
          // Check if it's an image URL or base64
          if (item.content.startsWith('http') || item.content.startsWith('data:image')) {
            console.log('Found image URL in assistant string content');
            return item.content;
          }
        }
        
        // Check for assistant role with array content
        if (item.role === 'assistant' && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            // Look for image_url type
            if (contentItem.type === 'image_url' && contentItem.image_url?.url) {
              console.log('Found image URL in assistant array content');
              return contentItem.image_url.url;
            }
            // Look for image_file type
            if (contentItem.type === 'image_file' && contentItem.image_file?.url) {
              console.log('Found image file URL in assistant array content');
              return contentItem.image_file.url;
            }
          }
        }
      }
    }

    // Check output object for image
    if (data.output) {
      if (data.output.imageUrl) {
        console.log('Found image URL in output');
        return data.output.imageUrl;
      }
      if (data.output.url) {
        console.log('Found URL in output');
        return data.output.url;
      }
      // Check if output is a string with base64 or URL
      if (typeof data.output === 'string') {
        if (data.output.startsWith('http') || data.output.startsWith('data:image')) {
          console.log('Found image in output string');
          return data.output;
        }
      }
    }

    console.error('No image found in Langdock response. Full response:', JSON.stringify(data, null, 2));
    throw new Error('No image URL found in assistant response. Please ensure the assistant is configured with image generation capability.');

  } catch (error) {
    console.error('Langdock generation error:', error);
    throw error;
  }
}
