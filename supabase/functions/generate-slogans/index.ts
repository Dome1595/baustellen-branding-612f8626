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

    // Create thread
    const threadResponse = await fetch('https://api.langdock.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('Langdock thread creation error:', threadResponse.status, errorText);
      throw new Error(`Failed to create thread: ${threadResponse.status}`);
    }

    const threadData = await threadResponse.json();
    const threadId = threadData.id;
    console.log('Created thread:', threadId);

    // Add message to thread
    const messageResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content: prompt,
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Langdock message error:', messageResponse.status, errorText);
      throw new Error(`Failed to add message: ${messageResponse.status}`);
    }

    // Run assistant
    const runResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Langdock run error:', runResponse.status, errorText);
      throw new Error(`Failed to run assistant: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log('Started run:', runId);

    // Poll for completion
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 30;

    while (runStatus !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log('Run status:', runStatus);
      }
      
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error('Assistant run timeout');
    }

    // Get messages
    const messagesResponse = await fetch(`https://api.langdock.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${LANGDOCK_API_KEY}`,
      },
    });

    if (!messagesResponse.ok) {
      throw new Error('Failed to get messages');
    }

    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');
    const content = assistantMessage?.content[0]?.text?.value || '';
    const slogans = content.split('\n').filter((line: string) => line.trim().length > 0);

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
