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

      const vehicleResponse = await generateImageWithLangdock(vehiclePrompt, LANGDOCK_API_KEY, LANGDOCK_ASSISTANT_ID, logoUrl);
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

      const scaffoldResponse = await generateImageWithLangdock(scaffoldPrompt, LANGDOCK_API_KEY, LANGDOCK_ASSISTANT_ID, logoUrl);
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

      const fenceResponse = await generateImageWithLangdock(fencePrompt, LANGDOCK_API_KEY, LANGDOCK_ASSISTANT_ID, logoUrl);
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

async function generateImageWithLangdock(
  prompt: string, 
  apiKey: string, 
  assistantId: string,
  logoUrl?: string
): Promise<string> {
  try {
    console.log('Starting Langdock image generation with assistant:', assistantId);
    
    let attachmentId: string | undefined;
    
    // If logo is provided, upload it to Langdock first
    if (logoUrl) {
      const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `https://${logoUrl}`;
      console.log('Uploading logo to Langdock:', fullLogoUrl);
      
      try {
        // Fetch the logo file
        const logoResponse = await fetch(fullLogoUrl);
        if (!logoResponse.ok) {
          console.error('Failed to fetch logo:', logoResponse.status);
        } else {
          const logoBlob = await logoResponse.blob();
          
          // Upload to Langdock
          const formData = new FormData();
          formData.append('file', logoBlob, 'logo.png');
          
          const uploadResponse = await fetch('https://api.langdock.com/v1/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            attachmentId = uploadData.id;
            console.log('Logo uploaded successfully, attachmentId:', attachmentId);
          } else {
            const errorText = await uploadResponse.text();
            console.error('Failed to upload logo to Langdock:', uploadResponse.status, errorText);
          }
        }
      } catch (uploadError) {
        console.error('Error uploading logo:', uploadError);
      }
    }
    
    // Build message content
    const messageContent: any = {
      role: 'user',
      content: prompt
    };
    
    // Add attachmentId if logo was uploaded
    if (attachmentId) {
      messageContent.attachmentIds = [attachmentId];
      messageContent.content = `${prompt}\n\nIMPORTANT: Use the attached company logo image. Incorporate it prominently in the mockup design.`;
    }

    // Call Langdock Assistant API
    const response = await fetch('https://api.langdock.com/assistant/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: assistantId,
        messages: [messageContent],
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
