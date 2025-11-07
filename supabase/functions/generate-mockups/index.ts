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
  const baseUrl = 'https://api.langdock.com/v1';
  
  try {
    console.log('Starting Langdock image generation...');
    
    // 1. Create a thread
    const threadResponse = await fetch(`${baseUrl}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('Thread creation failed:', threadResponse.status, errorText);
      throw new Error(`Failed to create thread: ${threadResponse.status}`);
    }

    const thread = await threadResponse.json();
    const threadId = thread.id;
    console.log('Thread created:', threadId);

    // 2. Build message content with logo if provided
    let messageContent = prompt;
    const attachments = [];

    if (logoUrl) {
      messageContent = `${prompt}\n\nIMPORTANT: Use the attached logo image in the mockup design.`;
      // Note: Langdock attachments would need to be uploaded separately
      // For now, we'll include the logo URL in the prompt
      messageContent = `${prompt}\n\nLogo URL: ${logoUrl}`;
    }

    // 3. Add message to thread
    const messageResponse = await fetch(`${baseUrl}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content: messageContent,
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Message creation failed:', messageResponse.status, errorText);
      throw new Error(`Failed to create message: ${messageResponse.status}`);
    }

    console.log('Message added to thread');

    // 4. Create and run the assistant
    const runResponse = await fetch(`${baseUrl}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Run creation failed:', runResponse.status, errorText);
      throw new Error(`Failed to create run: ${runResponse.status}`);
    }

    const run = await runResponse.json();
    const runId = run.id;
    console.log('Run created:', runId);

    // 5. Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes timeout (2 seconds * 60)

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`${baseUrl}/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
      
      console.log(`Run status: ${runStatus} (attempt ${attempts}/${maxAttempts})`);
    }

    if (runStatus !== 'completed') {
      throw new Error(`Run did not complete. Final status: ${runStatus}`);
    }

    // 6. Retrieve messages to get the generated image
    const messagesResponse = await fetch(`${baseUrl}/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!messagesResponse.ok) {
      throw new Error(`Failed to retrieve messages: ${messagesResponse.status}`);
    }

    const messagesData = await messagesResponse.json();
    console.log('Messages retrieved:', JSON.stringify(messagesData, null, 2));

    // Find the assistant's response with image
    const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant response found');
    }

    // Look for image in content or attachments
    const lastMessage = assistantMessages[0];
    
    // Check for image in content array
    if (Array.isArray(lastMessage.content)) {
      for (const item of lastMessage.content) {
        if (item.type === 'image_url' && item.image_url?.url) {
          console.log('Image URL found in content');
          return item.image_url.url;
        }
        if (item.type === 'image_file' && item.image_file?.file_id) {
          // Download file from Langdock
          const fileId = item.image_file.file_id;
          const fileUrl = `${baseUrl}/files/${fileId}/content`;
          console.log('Image file ID found:', fileId);
          return fileUrl; // This would need additional auth handling
        }
      }
    }

    // Check for attachments
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      const imageAttachment = lastMessage.attachments.find((att: any) => 
        att.type === 'image' || att.content_type?.startsWith('image/')
      );
      
      if (imageAttachment?.url) {
        console.log('Image URL found in attachments');
        return imageAttachment.url;
      }
    }

    // If content is a string, check if it contains a base64 image
    if (typeof lastMessage.content === 'string') {
      if (lastMessage.content.includes('data:image')) {
        const base64Match = lastMessage.content.match(/data:image\/[^;]+;base64,[^\s"]+/);
        if (base64Match) {
          console.log('Base64 image found in text content');
          return base64Match[0];
        }
      }
    }

    console.error('No image found in response. Last message:', JSON.stringify(lastMessage, null, 2));
    throw new Error('No image URL found in assistant response');

  } catch (error) {
    console.error('Langdock generation error:', error);
    throw error;
  }
}
