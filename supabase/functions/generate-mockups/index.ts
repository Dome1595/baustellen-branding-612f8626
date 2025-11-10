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

    // Step 5: ROBUSTE PARSING-LOGIK mit vollständigem Logging
    let mockups: Array<{ type: string; url: string; title: string }> = [];

    const result = assistantData.result || [];
    console.log("=== RESPONSE ANALYSIS ===");
    console.log("Result array length:", result.length);
    console.log("Full assistantData structure:", JSON.stringify(assistantData, null, 2));

    // Durchsuche alle Content-Items
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      console.log(`\nProcessing result item ${i}:`, JSON.stringify(item, null, 2));

      if (!item.content || !Array.isArray(item.content)) {
        console.log(`Item ${i} has no content array, skipping`);
        continue;
      }

      for (let j = 0; j < item.content.length; j++) {
        const contentItem = item.content[j];
        console.log(`Content item ${j}:`, JSON.stringify(contentItem, null, 2));
        console.log(`Content item type: ${contentItem?.type}`);

        // STRATEGIE 1: Suche nach JSON im gesamten Content-Item
        const contentStr = JSON.stringify(contentItem);
        if (contentStr.includes('"mockups"') || contentStr.includes("mockups")) {
          console.log('Found "mockups" keyword in content item, attempting to extract JSON...');

          try {
            // Versuche verschiedene Wege, JSON zu extrahieren
            let jsonData = null;

            // Weg 1: contentItem ist direkt das JSON
            if (contentItem.mockups && Array.isArray(contentItem.mockups)) {
              jsonData = contentItem;
              console.log("✓ Found mockups directly in contentItem");
            }

            // Weg 2: contentItem.text enthält JSON
            else if (contentItem.text) {
              const jsonMatch = contentItem.text.match(/\{[\s\S]*?"mockups"[\s\S]*?\}/);
              if (jsonMatch) {
                jsonData = JSON.parse(jsonMatch[0]);
                console.log("✓ Found mockups in contentItem.text");
              }
            }

            // Weg 3: contentItem.content ist ein String mit JSON
            else if (typeof contentItem.content === "string") {
              const jsonMatch = contentItem.content.match(/\{[\s\S]*?"mockups"[\s\S]*?\}/);
              if (jsonMatch) {
                jsonData = JSON.parse(jsonMatch[0]);
                console.log("✓ Found mockups in contentItem.content string");
              }
            }

            // Weg 4: Durchsuche alle String-Properties
            else {
              for (const [key, value] of Object.entries(contentItem)) {
                if (typeof value === "string" && value.includes("mockups")) {
                  const jsonMatch = value.match(/\{[\s\S]*?"mockups"[\s\S]*?\}/);
                  if (jsonMatch) {
                    jsonData = JSON.parse(jsonMatch[0]);
                    console.log(`✓ Found mockups in contentItem.${key}`);
                    break;
                  }
                }
              }
            }

            // Verarbeite gefundene Mockups
            if (jsonData?.mockups && Array.isArray(jsonData.mockups)) {
              console.log(`Found ${jsonData.mockups.length} mockups in JSON`);

              for (const mockup of jsonData.mockups) {
                console.log(`Processing mockup: type=${mockup.type}, url length=${mockup.url?.length}`);

                // Konvertiere URLs zu Base64 wenn nötig
                if (mockup.url && !mockup.url.startsWith("data:")) {
                  console.log(`Converting URL to Base64 for ${mockup.type}...`);
                  try {
                    // Prüfe ob es eine Langdock Attachment ID ist
                    if (mockup.url.match(/^[a-f0-9-]{36}$/i)) {
                      // Es ist eine Attachment ID
                      const attachmentResponse = await fetch(`https://api.langdock.com/attachment/v1/${mockup.url}`, {
                        headers: { Authorization: `Bearer ${LANGDOCK_API_KEY}` },
                      });

                      if (attachmentResponse.ok) {
                        const blob = await attachmentResponse.blob();
                        const arrayBuffer = await blob.arrayBuffer();
                        const base64 = btoa(
                          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
                        );
                        mockup.url = `data:image/png;base64,${base64}`;
                        console.log(`✓ Converted attachment ${mockup.type} to Base64`);
                      }
                    } else {
                      // Es ist eine reguläre URL
                      const imgResponse = await fetch(mockup.url);
                      if (imgResponse.ok) {
                        const blob = await imgResponse.blob();
                        const arrayBuffer = await blob.arrayBuffer();
                        const base64 = btoa(
                          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
                        );
                        mockup.url = `data:image/png;base64,${base64}`;
                        console.log(`✓ Converted URL ${mockup.type} to Base64`);
                      }
                    }
                  } catch (convError) {
                    console.error(`✗ Failed to convert ${mockup.type}:`, convError);
                  }
                }
              }

              mockups = jsonData.mockups;
              console.log("✓ Successfully extracted mockups from JSON");
              break; // Mockups gefunden, fertig
            }
          } catch (parseError) {
            console.error("✗ JSON parse error:", parseError);
          }
        }

        // STRATEGIE 2: Suche nach Bildern als Attachments (nur wenn keine JSON-Mockups gefunden)
        if (mockups.length === 0) {
          // Prüfe auf verschiedene Bild-Strukturen
          let imageData = null;

          if (contentItem.image) {
            imageData = contentItem.image;
            console.log("Found image in contentItem.image");
          } else if (contentItem.type === "image_url" && contentItem.image_url) {
            imageData = contentItem.image_url;
            console.log("Found image in contentItem.image_url");
          } else if (contentItem.type === "file" && contentItem.file) {
            imageData = contentItem.file;
            console.log("Found image in contentItem.file");
          }

          if (imageData) {
            console.log("Processing image data:", JSON.stringify(imageData, null, 2));
            let imageUrl: string | null = null;

            // Bestimme Mockup-Typ basierend auf Reihenfolge
            const mockupIndex = mockups.length;
            let mockupType = "vehicle";
            let mockupTitle = "Fahrzeugbeschriftung";

            if (requestedTypes[mockupIndex]) {
              const typeMap: Record<string, { type: string; title: string }> = {
                vehicle: { type: "vehicle", title: "Fahrzeugbeschriftung" },
                scaffold: { type: "scaffold", title: "Gerüstplane" },
                fence: { type: "fence", title: "Bauzaunbanner" },
              };
              const mapped = typeMap[requestedTypes[mockupIndex]];
              if (mapped) {
                mockupType = mapped.type;
                mockupTitle = mapped.title;
              }
            }

            // Extrahiere Bild-URL
            if (typeof imageData === "string") {
              if (imageData.startsWith("data:")) {
                imageUrl = imageData;
                console.log("Image is already Base64");
              } else if (imageData.match(/^[a-f0-9-]{36}$/i)) {
                // Attachment ID
                try {
                  const attachmentResponse = await fetch(`https://api.langdock.com/attachment/v1/${imageData}`, {
                    headers: { Authorization: `Bearer ${LANGDOCK_API_KEY}` },
                  });

                  if (attachmentResponse.ok) {
                    const blob = await attachmentResponse.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const base64 = btoa(
                      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
                    );
                    imageUrl = `data:image/png;base64,${base64}`;
                    console.log("✓ Downloaded attachment as Base64");
                  }
                } catch (err) {
                  console.error("✗ Attachment download failed:", err);
                }
              } else {
                // Regular URL
                try {
                  const imgResponse = await fetch(imageData);
                  if (imgResponse.ok) {
                    const blob = await imgResponse.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const base64 = btoa(
                      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
                    );
                    imageUrl = `data:image/png;base64,${base64}`;
                    console.log("✓ Downloaded URL as Base64");
                  }
                } catch (err) {
                  console.error("✗ URL download failed:", err);
                }
              }
            } else if (imageData.attachmentId) {
              // Attachment ID als Object-Property
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
                  console.log("✓ Downloaded attachment (from attachmentId) as Base64");
                }
              } catch (err) {
                console.error("✗ Attachment download failed:", err);
              }
            } else if (imageData.url) {
              // URL als Object-Property
              if (imageData.url.startsWith("data:")) {
                imageUrl = imageData.url;
              } else {
                try {
                  const imgResponse = await fetch(imageData.url);
                  if (imgResponse.ok) {
                    const blob = await imgResponse.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const base64 = btoa(
                      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
                    );
                    imageUrl = `data:image/png;base64,${base64}`;
                    console.log("✓ Downloaded URL (from url property) as Base64");
                  }
                } catch (err) {
                  console.error("✗ URL download failed:", err);
                }
              }
            }

            if (imageUrl) {
              mockups.push({ type: mockupType, url: imageUrl, title: mockupTitle });
              console.log(`✓ Added ${mockupType} mockup (${mockups.length} total)`);
            }
          }
        }
      }

      // Wenn Mockups gefunden wurden, stoppe die Suche
      if (mockups.length > 0) {
        console.log(`Found ${mockups.length} mockups, stopping search`);
        break;
      }
    }

    // VALIDIERUNG
    console.log("\n=== FINAL VALIDATION ===");
    console.log("Total mockups generated:", mockups.length);

    if (mockups.length === 0) {
      console.error("✗ NO MOCKUPS GENERATED!");
      console.error("This usually means:");
      console.error("1. Langdock did not return images in the expected format");
      console.error("2. The AI model did not generate mockups");
      console.error("3. The response structure is different than expected");
      console.error("\nFull Response:", JSON.stringify(assistantData, null, 2));

      return new Response(
        JSON.stringify({
          mockups: [],
          error: "No mockups were generated. Check Edge Function logs for details.",
          debug: {
            resultLength: result.length,
            rawResponse: assistantData,
          },
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

    console.log("=== MOCKUP GENERATION COMPLETE ===\n");

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
