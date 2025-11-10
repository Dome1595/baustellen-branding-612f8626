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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { projectId, requestedTypes } = await req.json();

    if (!projectId || !requestedTypes || !Array.isArray(requestedTypes)) {
      throw new Error("Missing required parameters");
    }

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    // 1. Projekt-Daten laden
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;

    // 2. Langdock API aufrufen
    const langdockApiKey = Deno.env.get("LANGDOCK_API_KEY");
    if (!langdockApiKey) {
      throw new Error("LANGDOCK_API_KEY not configured");
    }

    const assistantResponse = await fetch("https://api.langdock.com/v1/assistants/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${langdockApiKey}`,
      },
      body: JSON.stringify({
        assistant_id: Deno.env.get("LANGDOCK_ASSISTANT_ID"),
        message: `Erstelle Mockups fÃ¼r folgende Typen: ${requestedTypes.join(", ")}. 
Projektdaten: ${JSON.stringify(project)}`,
        stream: false,
      }),
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      throw new Error(`Langdock API error: ${errorText}`);
    }

    const assistantData = await assistantResponse.json();
    console.log("Received response from Langdock:", JSON.stringify(assistantData));

    // 3. KORREKTES Parsen der Response
    const mockups: MockupItem[] = [];

    if (assistantData.result && Array.isArray(assistantData.result)) {
      for (const resultItem of assistantData.result) {
        console.log("Processing result item, role:", resultItem.role);

        if (resultItem.role === "assistant" && resultItem.content) {
          // Content kann JSON-Code-Block enthalten
          let content = resultItem.content;

          // Entferne Markdown Code-Blocks
          const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
          if (jsonMatch) {
            content = jsonMatch[1];
          }

          try {
            const parsed = JSON.parse(content);
            console.log("Parsed content:", JSON.stringify(parsed));

            // PrÃ¼fe ob mockups Array vorhanden ist
            if (parsed.mockups && Array.isArray(parsed.mockups)) {
              for (const mockup of parsed.mockups) {
                // âœ… WICHTIG: Stelle sicher, dass type vorhanden ist
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

        // PrÃ¼fe auch attachments
        if (resultItem.attachments && Array.isArray(resultItem.attachments)) {
          for (const attachment of resultItem.attachments) {
            console.log("Processing attachment:", JSON.stringify(attachment));

            // âœ… WICHTIG: Extrahiere type korrekt
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

    // PrÃ¼fe auch top-level attachments
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

    // 4. In Datenbank speichern
    const { data: savedResult, error: saveError } = await supabaseClient
      .from("mockup_results")
      .insert({
        project_id: projectId,
        mockups: mockups,
        status: "completed",
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify({ success: true, mockups }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-mockups function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
