import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LANGDOCK_API_KEY = Deno.env.get("LANGDOCK_API_KEY")!;

// ============================================
// HELPER: Attachment Download mit Retry-Logik
// ============================================
async function downloadAttachment(attachmentId: string, apiKey: string, maxRetries = 3): Promise<string> {
  const downloadUrl = `https://api.langdock.com/v1/attachment/${attachmentId}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`  📥 Downloading attachment ${attachmentId} (attempt ${attempt + 1}/${maxRetries})`);

      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // Content-Type ermitteln
        const contentType = response.headers.get("Content-Type") || "image/png";
        const dataUrl = `data:${contentType};base64,${base64}`;

        console.log(`  ✅ Downloaded ${attachmentId} (${(blob.size / 1024).toFixed(1)} KB)`);
        return dataUrl;
      } else if (response.status === 404) {
        throw new Error(`Attachment ${attachmentId} not found (404)`);
      } else if (response.status === 429) {
        // Rate Limit - exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`  ⚠️ Rate limit hit, waiting ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error(`  ❌ Download attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Warte vor erneutem Versuch
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw new Error(`Failed to download attachment ${attachmentId} after ${maxRetries} attempts`);
}

// ============================================
// HELPER: Mockup-Titel generieren
// ============================================
function getMockupTitle(type: string): string {
  const titles: Record<string, string> = {
    vehicle: "Fahrzeugbeschriftung",
    scaffold: "Gerüstplane",
    fence: "Bauzaunbanner",
  };
  return titles[type] || type;
}

// ============================================
// HELPER: Upload zu Langdock
// ============================================
async function uploadToLangdock(fileUrl: string, filename: string, apiKey: string): Promise<string> {
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  const formData = new FormData();
  formData.append("file", blob, filename);

  const uploadResponse = await fetch("https://api.langdock.com/attachment/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${await uploadResponse.text()}`);
  }

  const data = await uploadResponse.json();
  console.log(`  ✅ Uploaded ${filename}: ${data.id}`);
  return data.id;
}

// ============================================
// MAIN EDGE FUNCTION
// ============================================
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

    // ============================================
    // 1. PROJEKT-DATEN LADEN
    // ============================================
    const { data: projectData, error: projectError } = await supabase
      .from("mockup_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;
    console.log("📋 Project data loaded:", projectData.companyName);

    // ============================================
    // 2. LOGO HOCHLADEN
    // ============================================
    const logoAttachmentId = await uploadToLangdock(projectData.logoUrl, "logo.png", LANGDOCK_API_KEY);

    // ============================================
    // 3. MOCKUP-TEMPLATES HOCHLADEN
    // ============================================
    const requestedTypes = projectData.selectedTemplates || ["vehicle", "scaffold", "fence"];
    const templateMap: Record<string, string> = {
      vehicle: "https://your-supabase-url/storage/v1/object/public/templates/vehicle.png",
      scaffold: "https://your-supabase-url/storage/v1/object/public/templates/scaffold.png",
      fence: "https://your-supabase-url/storage/v1/object/public/templates/fence.png",
    };

    const attachmentIds = [logoAttachmentId];

    for (const type of requestedTypes) {
      const templateUrl = templateMap[type];
      const templateId = await uploadToLangdock(templateUrl, `${type}-template.png`, LANGDOCK_API_KEY);
      attachmentIds.push(templateId);
    }

    console.log(`📎 Total attachments uploaded: ${attachmentIds.length}`);

    // ============================================
    // 4. SYSTEM-PROMPT ERSTELLEN
    // ============================================
    const contactInfo = [];
    if (projectData.phone) contactInfo.push(`Tel: ${projectData.phone}`);
    if (projectData.email) contactInfo.push(`E-Mail: ${projectData.email}`);
    if (projectData.website) contactInfo.push(projectData.website);

    const SYSTEM_PROMPT = `You are a professional graphic designer specializing in construction industry branding mockups.

**TASK:** Generate ${requestedTypes.length} realistic mockup images.

**MOCKUP TYPES:**
${requestedTypes
  .map(
    (type, i) =>
      `${i + 1}. ${
        type === "vehicle"
          ? "Commercial vehicle wrap (side view)"
          : type === "scaffold"
            ? "Construction scaffold banner"
            : "Construction fence banner"
      }`,
  )
  .join("\n")}

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

    // ============================================
    // 5. LANGDOCK API CALL
    // ============================================
    console.log("🤖 Calling Langdock API...");
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

    // Debug-Logging
    console.log("=== LANGDOCK RAW RESPONSE ===");
    console.log(JSON.stringify(assistantData, null, 2));

    // ============================================
    // 6. ATTACHMENT IDs EXTRAHIEREN & DOWNLOADEN
    // ============================================
    const mockups = [];
    let foundAttachmentIds: string[] = [];

    // STRATEGIE 1: Top-Level attachmentIds Array
    if (assistantData.attachmentIds && Array.isArray(assistantData.attachmentIds)) {
      console.log(`📎 Found ${assistantData.attachmentIds.length} attachmentIds in top-level`);
      foundAttachmentIds = assistantData.attachmentIds;
    }

    // STRATEGIE 2: Top-Level attachments Array
    if (foundAttachmentIds.length === 0 && assistantData.attachments && Array.isArray(assistantData.attachments)) {
      console.log(`📎 Found ${assistantData.attachments.length} attachments in top-level`);
      foundAttachmentIds = assistantData.attachments.map((att: any) => att.id || att);
    }

    // STRATEGIE 3: In result[].attachments
    if (foundAttachmentIds.length === 0 && assistantData.result && Array.isArray(assistantData.result)) {
      console.log("🔍 Searching for attachments in result array...");

      for (const resultItem of assistantData.result) {
        if (resultItem.attachmentIds && Array.isArray(resultItem.attachmentIds)) {
          foundAttachmentIds.push(...resultItem.attachmentIds);
        }
        if (resultItem.attachments && Array.isArray(resultItem.attachments)) {
          foundAttachmentIds.push(...resultItem.attachments.map((att: any) => att.id || att));
        }
      }

      console.log(`📎 Found ${foundAttachmentIds.length} attachments in result items`);
    }

    // STRATEGIE 4: In choices[].message.attachments (OpenAI-Format)
    if (foundAttachmentIds.length === 0 && assistantData.choices && Array.isArray(assistantData.choices)) {
      console.log("🔍 Searching in choices[].message.attachments...");

      for (const choice of assistantData.choices) {
        if (choice.message?.attachments && Array.isArray(choice.message.attachments)) {
          foundAttachmentIds.push(...choice.message.attachments.map((att: any) => att.id || att));
        }
      }

      console.log(`📎 Found ${foundAttachmentIds.length} attachments in choices`);
    }

    // ============================================
    // 7. BILDER HERUNTERLADEN
    // ============================================
    console.log(`\n📥 Downloading ${foundAttachmentIds.length} generated images...`);

    for (let i = 0; i < foundAttachmentIds.length; i++) {
      const attachmentId = foundAttachmentIds[i];
      const mockupType = requestedTypes[i] || "vehicle";

      try {
        const imageUrl = await downloadAttachment(attachmentId, LANGDOCK_API_KEY);

        mockups.push({
          type: mockupType,
          url: imageUrl,
          title: getMockupTitle(mockupType),
          attachmentId: attachmentId,
        });

        console.log(`  ✅ Mockup ${i + 1}/${foundAttachmentIds.length}: ${mockupType}`);
      } catch (err) {
        console.error(`  ❌ Failed to download mockup ${i + 1}:`, err);

        // Fallback: Speichere zumindest die attachmentId
        mockups.push({
          type: mockupType,
          url: null,
          title: getMockupTitle(mockupType),
          attachmentId: attachmentId,
          error: String(err),
        });
      }
    }

    console.log(`\n✅ Total mockups processed: ${mockups.length}`);

    // ============================================
    // 8. IN SUPABASE SPEICHERN
    // ============================================
    const { error: insertError } = await supabase.from("mockup_results").insert({
      project_id: projectId,
      mockups: mockups,
      raw_response: assistantData,
      attachment_ids: foundAttachmentIds,
    });

    if (insertError) throw insertError;

    // ============================================
    // 9. PROJEKT-STATUS AKTUALISIEREN
    // ============================================
    await supabase.from("mockup_projects").update({ status: "completed" }).eq("id", projectId);

    console.log("💾 Mockups saved to database");

    // ============================================
    // 10. RESPONSE
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        mockups,
        debugInfo: {
          attachmentIdsFound: foundAttachmentIds.length,
          mockupsDownloaded: mockups.filter((m) => m.url !== null).length,
          mockupsFailed: mockups.filter((m) => m.url === null).length,
          totalAttachmentsUploaded: attachmentIds.length,
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
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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
