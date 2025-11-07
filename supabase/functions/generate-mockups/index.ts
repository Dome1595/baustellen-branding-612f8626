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
    const ASSISTANT_ID = Deno.env.get('LANGDOCK_ASSISTANT_ID_MOCKUPS');

    if (!LANGDOCK_API_KEY || !ASSISTANT_ID) {
      throw new Error('LANGDOCK_API_KEY or ASSISTANT_ID not configured');
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

      const vehicleResponse = await generateImage(vehiclePrompt, LANGDOCK_API_KEY, ASSISTANT_ID);
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

      const scaffoldResponse = await generateImage(scaffoldPrompt, LANGDOCK_API_KEY, ASSISTANT_ID);
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

      const fenceResponse = await generateImage(fencePrompt, LANGDOCK_API_KEY, ASSISTANT_ID);
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

async function generateImage(prompt: string, apiKey: string, assistantId: string): Promise<string> {
  // Create thread
  const threadResponse = await fetch('https://api.langdock.com/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!threadResponse.ok) {
    throw new Error(`Failed to create thread: ${threadResponse.status}`);
  }

  const threadData = await threadResponse.json();
  const threadId = threadData.id;

  // Add message
  const messageResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'user',
      content: prompt,
    }),
  });

  if (!messageResponse.ok) {
    throw new Error(`Failed to add message: ${messageResponse.status}`);
  }

  // Run assistant
  const runResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/runs`, {
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
    throw new Error(`Failed to run assistant: ${runResponse.status}`);
  }

  const runData = await runResponse.json();
  const runId = runData.id;

  // Poll for completion
  let runStatus = 'queued';
  let attempts = 0;
  const maxAttempts = 60; // Longer timeout for image generation

  while (runStatus !== 'completed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
    
    const statusResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      runStatus = statusData.status;
    }
    
    attempts++;
  }

  if (runStatus !== 'completed') {
    throw new Error('Image generation timeout');
  }

  // Get messages
  const messagesResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/messages`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!messagesResponse.ok) {
    throw new Error('Failed to get messages');
  }

  const messagesData = await messagesResponse.json();
  const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');
  return assistantMessage?.content[0]?.text?.value || '';
}
