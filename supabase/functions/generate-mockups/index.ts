import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LANGDOCK_API_KEY = Deno.env.get("LANGDOCK_API_KEY")!;

Deno.serve(async (req) => {
  // CORS Headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { projectId } = await req.json();
    console.log("🚀 Starting mockup generation for project:", projectId);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Projekt-Daten laden
    const { data: projectData, error: projectError } = await supabase
      .from("mockup_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;
    console.log("✓ Project data loaded:", projectData.companyName);

    // 2. Logo hochladen
    const logoResponse = await fetch(projectData.logoUrl);
    const logoBlob = await logoResponse.blob();
    const logoFormData = new FormData();
    logoFormData.append("file", logoBlob, "logo.png");

    const logoUpload = await fetch("https://api.langdock.com/attachment/v1", {
      method: "POST",
      headers: { Authorization: `Bearer ${LANGDOCK_API_KEY}` },
      body: logoFormData,
    });

    if (!logoUpload.ok) {
      throw new Error(`Logo upload failed: ${await logoUpload.text()}`);
    }

    const logoData = await logoUpload.json();
    const logoAttachmentId = logoData.id;
    console.log("✓ Logo uploaded:", logoAttachmentId);

    // 3. Mockup-Templates hochladen
    const requestedTypes = projectData.selectedTemplates || ["vehicle", "scaffold", "fence"];
    const templateMap = {
      vehicle: "https://your-supabase-url/storage/v1/object/public/templates/vehicle.png",
      scaffold: "https://your-supabase-url/storage/v1/object/public/templates/scaffold.png",
      fence: "https://your-supabase-url/storage/v1/object/public/templates/fence.png",
    };

    const attachmentIds = [logoAttachmentId];

    for (const type of requestedTypes) {
      const templateUrl = templateMap[type];
      const templateResponse = await fetch(templateUrl);
      const templateBlob = await templateResponse.blob();
      const templateFormData = new FormData();
      templateFormData.append("file", templateBlob, `${type}-template.png`);

      const templateUpload = await fetch("https://api.langdock.com/attachment/v1", {
        method: "POST",
        headers: { Authorization: `Bearer ${LANGDOCK_API_KEY}` },
        body: templateFormData,
      });

      const templateData = await templateUpload.json();
      attachmentIds.push(templateData.id);
      console.log(`✓ Template uploaded (${type}):`, templateData.id);
    }

    // 4. System-Prompt
    const contactInfo = [];
    if (projectData.phone) contactInfo.push(`Tel: ${projectData.phone}`);
    if (projectData.email) contactInfo.push(`E-Mail: ${projectData.email}`);
    if (projectData.website) contactInfo.push(projectData.website);

    const SYSTEM_PROMPT = `You are a professional graphic designer specializing in construction industry branding mockups.

**TASK:** Generate ${requestedTypes.length} realistic mockup images.

**MOCKUP TYPES:**
${requestedTypes.map((type, i) => `${i + 1}. ${type === "vehicle" ? "Commercial vehicle wrap (side view)" : type === "scaffold" ? "Construction scaffold banner" : "Construction fence banner"}`).join("\n")}

**DESIGN SPECIFICATIONS:**
- Company: ${projectData.companyName}
- Slogan: "${projectData.selectedSlogan}"
- Primary Color: ${projectData.primaryColor}
- Secondary Color: ${projectData.secondaryColor}
- Contact: ${contactInfo.join(" | ")}

**REQUIREMENTS:**
- Use the uploaded logo (first attachment) prominently
- Apply designs to the uploaded templates (following attachments)
- Create professional, construction-appropriate designs
- Ensure text is readable and well-placed
- Use realistic lighting and perspective

Generate all ${requestedTypes.length} mockup images now.`;

    const userPrompt = `Create ${requestedTypes.length} professional mockup images using the provided logo and templates. Apply the branding consistently across all mockups.`;

    // 5. Langdock API Call
    console.log("📡 Calling Langdock API...");
    const assistantResponse = await fetch("https://api.langdock.com/assistant/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LANGDOCK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant: {
          name: "Mockup Generator",
          instructions: SYSTEM_PROMPT,
          model: "gemini-2.0-flash-exp-image",
          attachmentIds: attachmentIds,
        },
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      console.error("❌ Langdock API Error:", errorText);
      throw new Error(`Langdock API failed: ${errorText}`);
    }

    const assistantData = await assistantResponse.json();

    // 🔥 KRITISCHES LOGGING
    console.log("=== LANGDOCK RAW RESPONSE ===");
    console.log(JSON.stringify(assistantData, null, 2));

    // 6. Response Parsing - MEHRERE STRATEGIEN
    const mockups = [];

    // STRATEGIE 1: Top-Level Attachments
    if (assistantData.attachments && Array.isArray(assistantData.attachments)) {
      console.log(`📎 Found ${assistantData.attachments.length} top-level attachments`);

      for (let i = 0; i < assistantData.attachments.length; i++) {
        const attachment = assistantData.attachments[i];
        const mockupType = requestedTypes[i] || "vehicle";

        try {
          const imageUrl = await downloadAttachment(attachment.id, LANGDOCK_API_KEY);
          mockups.push({
            type: mockupType,
            url: imageUrl,
            title: getMockupTitle(mockupType),
          });
          console.log(`✓ Processed attachment ${i + 1}: ${mockupType}`);
        } catch (err) {
          console.error(`❌ Failed to process attachment ${i}:`, err);
        }
      }
    }

    // STRATEGIE 2: Attachments in result[].attachments
    if (mockups.length === 0 && assistantData.result && Array.isArray(assistantData.result)) {
      console.log("🔍 Searching for attachments in result array...");

      for (const resultItem of assistantData.result) {
        if (resultItem.attachments && Array.isArray(resultItem.attachments)) {
          console.log(`📎 Found ${resultItem.attachments.length} attachments in result item`);

          for (let i = 0; i < resultItem.attachments.length; i++) {
            const attachment = resultItem.attachments[i];
            const mockupType = requestedTypes[mockups.length] || "vehicle";

            try {
              const imageUrl = await downloadAttachment(attachment.id, LANGDOCK_API_KEY);
              mockups.push({
                type: mockupType,
                url: imageUrl,
                title: getMockupTitle(mockupType),
              });
              console.log(`✓ Processed result attachment ${i + 1}: ${mockupType}`);
            } catch (err) {
              console.error(`❌ Failed to process result attachment ${i}:`, err);
            }
          }
        }
      }
    }

    // STRATEGIE 3: Bilder in content (für andere Modelle)
    if (mockups.length === 0 && assistantData.result) {
      console.log("🔍 Searching for images in content...");

      for (const resultItem of assistantData.result) {
        if (!resultItem.content) continue;

        for (const contentItem of resultItem.content) {
          if (contentItem.type === "image_url" || contentItem.type === "image") {
            const mockupType = requestedTypes[mockups.length] || "vehicle";
            const imageData = contentItem.image_url?.url || contentItem.url || contentItem.image;

            if (imageData && typeof imageData === "string") {
              try {
                let imageUrl;
                if (imageData.startsWith("data:")) {
                  imageUrl = imageData;
                } else {
                  imageUrl = await downloadAttachment(imageData, LANGDOCK_API_KEY);
                }

                mockups.push({
                  type: mockupType,
                  url: imageUrl,
                  title: getMockupTitle(mockupType),
                });
                console.log(`✓ Processed content image: ${mockupType}`);
              } catch (err) {
                console.error(`❌ Failed to process content image:`, err);
              }
            }
          }
        }
      }
    }

    console.log(`✅ Total mockups generated: ${mockups.length}`);

    // 7. In Supabase speichern
    const { error: insertError } = await supabase.from("mockup_results").insert({
      project_id: projectId,
      mockups: mockups,
      raw_response: assistantData, // Für Debugging
    });

    if (insertError) throw insertError;

    // 8. Projekt-Status aktualisieren
    await supabase.from("mockup_projects").update({ status: "completed" }).eq("id", projectId);

    console.log("✅ Mockups saved to database");

    return new Response(
      JSON.stringify({
        success: true,
        mockups,
        debugInfo: {
          attachmentsFound: assistantData.attachments?.length || 0,
          resultItems: assistantData.result?.length || 0,
          mockupsGenerated: mockups.length,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("❌ Edge Function Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});

// HELPER FUNCTIONS

async function downloadAttachment(attachmentId: string, apiKey: string): Promise<string> {
  const response = await fetch(`https://api.langdock.com/attachment/v1/${attachmentId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Attachment download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));

  return `data:${blob.type};base64,${base64}`;
}

function getMockupTitle(type: string): string {
  const titles = {
    vehicle: "Fahrzeugbeschriftung",
    scaffold: "Gerüstplane",
    fence: "Bauzaunbanner",
  };
  return titles[type] || "Mockup";
}
