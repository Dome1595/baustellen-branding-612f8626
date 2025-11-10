import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MockupItem {
  type: string;
  url: string;
  title: string;
  status?: string;
}

interface LangdockAttachment {
  type?: string;
  item_type?: string;
  url?: string;
  content?: string;
  title?: string;
  name?: string;
}

interface LangdockResultItem {
  role: string;
  content?: string;
  attachments?: LangdockAttachment[];
}

interface LangdockResponse {
  result?: LangdockResultItem[];
  attachments?: LangdockAttachment[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const projectId = body.projectId;
    const requestedTypes = body.requestedTypes;

    if (!projectId || !requestedTypes || !Array.isArray(requestedTypes)) {
      throw new Error("Missing required parameters: projectId and requestedTypes");
    }

    // Create Supabase client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // 1. Load project data
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      throw new Error(`Failed to load project: ${projectError.message}`);
    }

    // 2. Call Langdock API
    const langdockApiKey = Deno.env.get("LANGDOCK_API_KEY");
    if (!langdockApiKey) {
      throw new Error("LANGDOCK_API_KEY not configured");
    }

    const assistantId = Deno.env.get("LANGDOCK_ASSISTANT_ID");
    if (!assistantId) {
      throw new Error("LANGDOCK_ASSISTANT_ID not configured");
    }

    console.log("Calling Langdock API...");
    const assistantResponse = await fetch("https://api.langdock.com/v1/assistants/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${langdockApiKey}`,
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        message: `Erstelle Mockups für folgende Typen: ${requestedTypes.join(", ")}. 
Projektdaten: ${JSON.stringify(project)}`,
        stream: false,
      }),
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      throw new Error(`Langdock API error: ${errorText}`);
    }

    const assistantData: LangdockResponse = await assistantResponse.json();
    console.log("Received response from Langdock:", JSON.stringify(assistantData));

    // 3. Parse response and extract mockups
    const mockups: MockupItem[] = [];

    // Process result array
    if (assistantData.result && Array.isArray(assistantData.result)) {
      for (const resultItem of assistantData.result) {
        console.log("Processing result item, role:", resultItem.role);

        // Process content (may contain JSON)
        if (resultItem.role === "assistant" && resultItem.content) {
          let content = resultItem.content;

          // Remove markdown code blocks
          const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
          if (jsonMatch) {
            content = jsonMatch[1];
          }

          try {
            const parsed = JSON.parse(content);
            console.log("Parsed content:", JSON.stringify(parsed));

            // Check if mockups array exists
            if (parsed.mockups && Array.isArray(parsed.mockups)) {
              for (const mockup of parsed.mockups) {
                const mockupItem: MockupItem = {
                  type: mockup.type || mockup.item_type || "unknown",
                  url: mockup.url || "",
                  title: mockup.title || "Mockup",
                  status: mockup.status || "generated",
                };

                console.log("Adding mockup item:", JSON.stringify(mockupItem));
                mockups.push(mockupItem);
              }
            }
          } catch (parseError) {
            console.error("Failed to parse content as JSON:", parseError);
            console.log("Content was:", content);
          }
        }

        // Process attachments in result item
        if (resultItem.attachments && Array.isArray(resultItem.attachments)) {
          for (const attachment of resultItem.attachments) {
            console.log("Processing attachment:", JSON.stringify(attachment));

            const mockupItem: MockupItem = {
              type: attachment.type || attachment.item_type || "unknown",
              url: attachment.url || attachment.content || "",
              title: attachment.title || attachment.name || "Mockup",
              status: "generated",
            };

            console.log("Adding attachment as mockup:", JSON.stringify(mockupItem));
            mockups.push(mockupItem);
          }
        }
      }
    }

    // Process top-level attachments
    if (assistantData.attachments && Array.isArray(assistantData.attachments)) {
      for (const attachment of assistantData.attachments) {
        console.log("Processing top-level attachment:", JSON.stringify(attachment));

        const mockupItem: MockupItem = {
          type: attachment.type || attachment.item_type || "unknown",
          url: attachment.url || attachment.content || "",
          title: attachment.title || attachment.name || "Mockup",
          status: "generated",
        };

        mockups.push(mockupItem);
      }
    }

    console.log("Final mockups array:", JSON.stringify(mockups));

    if (mockups.length === 0) {
      throw new Error("No mockups generated from Langdock response");
    }

    // 4. Save to database
    const { data: savedResult, error: saveError } = await supabaseClient
      .from("mockup_results")
      .insert({
        project_id: projectId,
        mockups: mockups,
        status: "completed",
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save mockups: ${saveError.message}`);
    }

    console.log("Successfully saved mockups to database");

    return new Response(
      JSON.stringify({
        success: true,
        mockups: mockups,
        result_id: savedResult.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in generate-mockups function:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
