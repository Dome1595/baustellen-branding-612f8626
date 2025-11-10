import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VEREINFACHTER System-Prompt mit klarer JSON-Anforderung
const SYSTEM_PROMPT = `You are a Mockup Design Agent for construction site branding.

CRITICAL REQUIREMENT: You MUST respond with ONLY a valid JSON object in this exact format:

{
  "mockups": [
    {
      "type": "vehicle",
      "url": "data:image/png;base64,[BASE64_STRING]",
      "title": "Fahrzeugbeschriftung"
    }
  ]
}

Valid types: "vehicle", "scaffold", "fence"
Valid titles: "Fahrzeugbeschriftung", "Gerüstplane", "Bauzaunbanner"

IMPORTANT:
- URLs must be Base64 Data-URLs starting with "data:image/png;base64,"
- Do NOT use attachment IDs, regular URLs, or placeholders
- Generate one mockup for each requested type
- Return ONLY the JSON object, no additional text or explanations`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData } = await req.json();
    const LANGDOCK_API_KEY = Deno.env.get("LANGDOCK_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

    if (!LANGDOCK_API_KEY) {
      throw new Error("LANGDOCK_API_KEY not configured");
    }

    if (!SUPABASE_URL) {
      throw new Error("SUPABASE_URL not configured");
    }

    console.log("=== MOCKUP GENERATION START ===");
    console.log("Company:", projectData.company_name || projectData.companyName);

    // Step 1: Upload logo
    let logoAttachmentId: string | undefined;
    const logoUrl = projectData.logo_url || projectData.logoUrl;

    if (logoUrl) {
      const fullLogoUrl = logoUrl.startsWith("http") ? logoUrl : `${SUPABASE_URL}/storage/v1/object/public/${logoUrl}`;
      console.log("Uploading logo:", fullLogoUrl);

      try {
        const logoResponse = await fetch(fullLogoUrl);
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const logoFormData = new FormData();
          logoFormData.append("file", logoBlob, "logo.png");

          const uploadResponse = await fetch("https://api.langdock.com/attachment/v1/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${LANGDOCK_API_KEY}` },
            body: logoFormData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            logoAttachmentId = uploadData.attachmentId;
            console.log("✓ Logo uploaded, ID:", logoAttachmentId);
          } else {
            console.error("✗ Logo upload failed:", await uploadResponse.text());
          }
        }
      } catch (error) {
        console.error("✗ Logo upload error:", error);
      }
    }

    // Step 2: Upload mockup templates
    const templateAttachments: Record<string, string> = {};
    const baseStorageUrl = `${SUPABASE_URL.replace("/v1", "")}/storage/v1/object/public/assets/mockup-templates`;

    const templates = {
      "mercedes-sprinter": `${baseStorageUrl}/mercedes-sprinter.png`,
      geruestplane: `${baseStorageUrl}/geruestplane.png`,
      bauzaunbanner: `${baseStorageUrl}/bauzaunbanner.png`,
    };

    console.log("Uploading templates...");
    for (const [name, url] of Object.entries(templates)) {
      try {
        const templateResponse = await fetch(url);
        if (templateResponse.ok) {
          const templateBlob = await templateResponse.blob();
          const formData = new FormData();
          formData.append("file", templateBlob, `${name}.png`);

          const uploadResponse = await fetch("https://api.langdock.com/attachment/v1/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${LANGDOCK_API_KEY}` },
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            templateAttachments[name] = uploadData.attachmentId;
            console.log(`✓ Template ${name} uploaded, ID:`, uploadData.attachmentId);
          }
        }
      } catch (error) {
        console.error(`✗ Template ${name} upload error:`, error);
      }
    }

    // Step 3: Build user prompt
    const contactInfo = [];
    if (projectData.phone) contactInfo.push(`Phone: ${projectData.phone}`);
    if (projectData.website) contactInfo.push(`Website: ${projectData.website}`);

    const requestedTypes = [];
    if (projectData.vehicle_enabled || projectData.vehicleEnabled) requestedTypes.push("vehicle");
    if (projectData.scaffold_enabled || projectData.scaffoldEnabled) requestedTypes.push("scaffold");
    if (projectData.fence_enabled || projectData.fenceEnabled) requestedTypes.push("fence");

    const userPrompt = `Generate ${requestedTypes.length} mockup(s) for:

Company: ${projectData.company_name || projectData.companyName}
Slogan: "${projectData.slogan_selected || projectData.selectedSlogan}"
Contact: ${contactInfo.join(" | ")}
Colors: ${projectData.primary_color || projectData.primaryColor}, ${projectData.secondary_color || projectData.secondaryColor}

Requested types: ${requestedTypes.join(", ")}

Generate mockups using the provided logo and templates. Return ONLY valid JSON with Base64 image data.`;

    // Step 4: Call Langdock API
    console.log("Calling Langdock API...");

    const attachmentIds = [];
    if (logoAttachmentId) attachmentIds.push(logoAttachmentId);
    Object.values(templateAttachments).forEach((id) => attachmentIds.push(id));

    const assistantResponse = await fetch("https://api.langdock.com/assistant/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LANGDOCK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant: {
          name: "Mockup Design Agent",
          instructions: SYSTEM_PROMPT,
          model: "gemini-2.5-flash",
          attachmentIds: attachmentIds,
        },
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      console.error("✗ Langdock API error:", assistantResponse.status, errorText);
      throw new Error(`Langdock API error: ${assistantResponse.status}`);
    }

    const assistantData = await assistantResponse.json();
    console.log("✓ Langdock response received");
    console.log("Raw response structure:", JSON.stringify(assistantData, null, 2).substring(0, 1000));

    // Step 5: KORRIGIERTE PARSING-LOGIK
    let mockups: Array<{ type: string; url: string; title: string }> = [];

    const result = assistantData.result || [];
    console.log(`Processing ${result.length} result items...`);

    // Durchsuche alle Content-Items nach JSON oder Bildern
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      if (!item.content) continue;

      for (let j = 0; j < item.content.length; j++) {
        const contentItem = item.content[j];

        // Fall 1: JSON-Text mit Mockup-Daten
        if (contentItem.type === "text" && contentItem.text) {
          try {
            // Suche nach JSON-Block
            const jsonMatch = contentItem.text.match(/\{[\s\S]*?"mockups"[\s\S]*?\}/);
            if (jsonMatch) {
              console.log("Found JSON in text, parsing...");
              const parsed = JSON.parse(jsonMatch[0]);

              if (parsed.mockups && Array.isArray(parsed.mockups)) {
                console.log(`Found ${parsed.mockups.length} mockups in JSON`);

                // Konvertiere URLs die keine Base64 sind
                for (const mockup of parsed.mockups) {
                  if (mockup.url && !mockup.url.startsWith("data:")) {
                    console.log(`Converting URL to Base64 for ${mockup.type}...`);
                    try {
                      const imgResponse = await fetch(mockup.url);
                      if (imgResponse.ok) {
                        const blob = await imgResponse.blob();
                        const arrayBuffer = await blob.arrayBuffer();
                        const base64 = btoa(
                          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
                        );
                        mockup.url = `data:image/png;base64,${base64}`;
                        console.log(`✓ Converted ${mockup.type} to Base64`);
                      }
                    } catch (convError) {
                      console.error(`✗ Failed to convert ${mockup.type}:`, convError);
                    }
                  }
                }

                mockups = parsed.mockups;
                console.log("✓ Successfully parsed mockups from JSON");
                break; // JSON gefunden, fertig
              }
            }
          } catch (parseError) {
            console.error("✗ JSON parse error:", parseError);
          }
        }

        // Fall 2: Bild als Attachment (nur wenn noch keine JSON-Mockups gefunden)
        if (mockups.length === 0 && contentItem.type === "image" && contentItem.image) {
          console.log(`Processing image attachment ${j}...`);
          const imageData = contentItem.image;
          let imageUrl: string | null = null;
          let mockupType = "vehicle"; // Default
          let mockupTitle = "Fahrzeugbeschriftung";

          // Bestimme Typ aus Index (sehr einfache Logik - verbessern wenn nötig)
          const mockupIndex = mockups.length;
          if (mockupIndex === 0 && requestedTypes.includes("vehicle")) {
            mockupType = "vehicle";
            mockupTitle = "Fahrzeugbeschriftung";
          } else if (mockupIndex === 1 && requestedTypes.includes("scaffold")) {
            mockupType = "scaffold";
            mockupTitle = "Gerüstplane";
          } else if (mockupIndex === 2 && requestedTypes.includes("fence")) {
            mockupType = "fence";
            mockupTitle = "Bauzaunbanner";
          }

          // Download attachment
          if (imageData.attachmentId) {
            try {
              const attachmentResponse = await fetch(
                `https://api.langdock.com/attachment/v1/${imageData.attachmentId}`,
                { headers: { Authorization: `Bearer ${LANGDOCK_API_KEY}` } },
              );

              if (attachmentResponse.ok) {
                const blob = await attachmentResponse.blob();
                const arrayBuffer = await blob.arrayBuffer();
                const base64 = btoa(
                  new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
                );
                imageUrl = `data:image/png;base64,${base64}`;
                console.log(`✓ Converted attachment to Base64 (${mockupType})`);
              }
            } catch (attachError) {
              console.error("✗ Attachment download error:", attachError);
            }
          } else if (typeof imageData === "string" && imageData.startsWith("data:")) {
            imageUrl = imageData;
            console.log(`✓ Image already in Base64 format (${mockupType})`);
          }

          if (imageUrl) {
            mockups.push({ type: mockupType, url: imageUrl, title: mockupTitle });
          }
        }
      }

      // Wenn JSON-Mockups gefunden wurden, keine weiteren Items verarbeiten
      if (mockups.length > 0 && result[i].content.some((c) => c.type === "text")) {
        break;
      }
    }

    // VALIDIERUNG
    console.log("=== FINAL VALIDATION ===");
    console.log("Total mockups generated:", mockups.length);

    if (mockups.length === 0) {
      console.error("✗ NO MOCKUPS GENERATED!");
      console.error("Full Langdock response:", JSON.stringify(assistantData, null, 2));

      // Fallback: Leere Mockups zurückgeben statt Error
      return new Response(
        JSON.stringify({
          mockups: [],
          error: "No mockups were generated. Please check the logs.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    mockups.forEach((mockup, index) => {
      console.log(`Mockup ${index + 1}:`, {
        type: mockup.type,
        title: mockup.title,
        urlLength: mockup.url?.length || 0,
        urlValid: mockup.url?.startsWith("data:image/") || false,
      });
    });

    console.log("=== MOCKUP GENERATION COMPLETE ===");

    return new Response(JSON.stringify({ mockups }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("=== FATAL ERROR ===");
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        mockups: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
