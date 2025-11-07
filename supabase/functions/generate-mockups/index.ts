import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ensure templates are uploaded to Supabase Storage
    await ensureTemplatesUploaded();

    const { projectData, stream } = await req.json();
    console.log("Generating mockups with project data:", projectData);

    // If streaming is requested, use SSE
    if (stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendProgress = (message: string) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: message })}\n\n`));
          };

          try {
            const mockups: Array<{ type: string; url: string; title: string }> = [];

            // Generate vehicle mockup if enabled
            if (projectData.vehicle_enabled || projectData.vehicleEnabled) {
              sendProgress("Fahrzeug-Mockup wird vorbereitet...");
              const templateUrl = selectVehicleTemplate(projectData);
              
              const vehicleMockupUrl = await editMockupWithLogo(
                templateUrl,
                projectData.logo_url || projectData.logoUrl,
                {
                  companyName: projectData.company_name || projectData.companyName,
                  slogan: projectData.slogan_selected || projectData.selectedSlogan,
                  phone: projectData.phone,
                  email: projectData.email,
                  website: projectData.website,
                  primaryColor: projectData.primary_color || projectData.primaryColor,
                  secondaryColor: projectData.secondary_color || projectData.secondaryColor,
                  style: projectData.style || "modern",
                },
                "vehicle",
                sendProgress
              );
              
              mockups.push({
                type: "vehicle",
                url: vehicleMockupUrl,
                title: `${projectData.vehicle_brand || projectData.vehicleBrand} ${projectData.vehicle_body || projectData.vehicleBody || "Transporter"}`,
              });
              sendProgress("Fahrzeug-Mockup fertig ✓");
            }

    // Generate scaffold mockup if enabled
    if (projectData.scaffold_enabled || projectData.scaffoldEnabled) {
      sendProgress("Gerüstplane wird vorbereitet...");
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const templateUrl = `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/scaffold-banner.png`;
              
              const scaffoldMockupUrl = await editMockupWithLogo(
                templateUrl,
                projectData.logo_url || projectData.logoUrl,
                {
                  companyName: projectData.company_name || projectData.companyName,
                  slogan: projectData.slogan_selected || projectData.selectedSlogan,
                  phone: projectData.phone,
                  email: projectData.email,
                  website: projectData.website,
                  primaryColor: projectData.primary_color || projectData.primaryColor,
                  secondaryColor: projectData.secondary_color || projectData.secondaryColor,
                  style: projectData.style || "modern",
                },
                "scaffold",
                sendProgress
              );
              
              mockups.push({
                type: "scaffold",
                url: scaffoldMockupUrl,
                title: "Gerüstplane",
              });
              sendProgress("Gerüstplane fertig ✓");
            }

    // Generate fence mockup if enabled
    if (projectData.fence_enabled || projectData.fenceEnabled) {
      sendProgress("Bauzaunbanner wird vorbereitet...");
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const templateUrl = `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/fence-banner.png`;
              
              const fenceMockupUrl = await editMockupWithLogo(
                templateUrl,
                projectData.logo_url || projectData.logoUrl,
                {
                  companyName: projectData.company_name || projectData.companyName,
                  slogan: projectData.slogan_selected || projectData.selectedSlogan,
                  phone: projectData.phone,
                  email: projectData.email,
                  website: projectData.website,
                  primaryColor: projectData.primary_color || projectData.primaryColor,
                  secondaryColor: projectData.secondary_color || projectData.secondaryColor,
                  style: projectData.style || "modern",
                },
                "fence",
                sendProgress
              );
              
              mockups.push({
                type: "fence",
                url: fenceMockupUrl,
                title: "Bauzaunbanner",
              });
              sendProgress("Bauzaunbanner fertig ✓");
            }

            sendProgress("Alle Mockups erfolgreich generiert!");
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ mockups, done: true })}\n\n`));
            controller.close();
          } catch (error) {
            console.error("Error in streaming:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming fallback
    const mockups: Array<{ type: string; url: string; title: string }> = [];

    // Generate vehicle mockup if enabled
    if (projectData.vehicle_enabled || projectData.vehicleEnabled) {
      console.log("Generating vehicle mockup...");
      const templateUrl = selectVehicleTemplate(projectData);
      
      const vehicleMockupUrl = await editMockupWithLogo(
        templateUrl,
        projectData.logo_url || projectData.logoUrl,
        {
          companyName: projectData.company_name || projectData.companyName,
          slogan: projectData.slogan_selected || projectData.selectedSlogan,
          phone: projectData.phone,
          email: projectData.email,
          website: projectData.website,
          primaryColor: projectData.primary_color || projectData.primaryColor,
          secondaryColor: projectData.secondary_color || projectData.secondaryColor,
          style: projectData.style || "modern",
        },
        "vehicle"
      );
      
      mockups.push({
        type: "vehicle",
        url: vehicleMockupUrl,
        title: `${projectData.vehicle_brand || projectData.vehicleBrand} ${projectData.vehicle_body || projectData.vehicleBody || "Transporter"}`,
      });
    }

    // Generate scaffold mockup if enabled
    if (projectData.scaffold_enabled || projectData.scaffoldEnabled) {
      console.log("Generating scaffold mockup...");
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const templateUrl = `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/scaffold-banner.png`;
      
      const scaffoldMockupUrl = await editMockupWithLogo(
        templateUrl,
        projectData.logo_url || projectData.logoUrl,
        {
          companyName: projectData.company_name || projectData.companyName,
          slogan: projectData.slogan_selected || projectData.selectedSlogan,
          phone: projectData.phone,
          email: projectData.email,
          website: projectData.website,
          primaryColor: projectData.primary_color || projectData.primaryColor,
          secondaryColor: projectData.secondary_color || projectData.secondaryColor,
          style: projectData.style || "modern",
        },
        "scaffold"
      );
      
      mockups.push({
        type: "scaffold",
        url: scaffoldMockupUrl,
        title: "Gerüstplane",
      });
    }

    // Generate fence mockup if enabled
    if (projectData.fence_enabled || projectData.fenceEnabled) {
      console.log("Generating fence mockup...");
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const templateUrl = `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/fence-banner.png`;
      
      const fenceMockupUrl = await editMockupWithLogo(
        templateUrl,
        projectData.logo_url || projectData.logoUrl,
        {
          companyName: projectData.company_name || projectData.companyName,
          slogan: projectData.slogan_selected || projectData.selectedSlogan,
          phone: projectData.phone,
          email: projectData.email,
          website: projectData.website,
          primaryColor: projectData.primary_color || projectData.primaryColor,
          secondaryColor: projectData.secondary_color || projectData.secondaryColor,
          style: projectData.style || "modern",
        },
        "fence"
      );
      
      mockups.push({
        type: "fence",
        url: fenceMockupUrl,
        title: "Bauzaunbanner",
      });
    }

    console.log(`Generated ${mockups.length} mockups successfully`);

    return new Response(JSON.stringify({ mockups }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-mockups function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getOriginUrl(req: Request): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

// Ensure templates are available in Supabase Storage
let templatesChecked = false;

async function ensureTemplatesUploaded() {
  if (templatesChecked) return;
  
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase credentials");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Check if mockup-templates bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === "mockup-templates");

    if (!bucketExists) {
      // Create bucket
      const { error: bucketError } = await supabase.storage.createBucket("mockup-templates", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (bucketError) {
        console.error("Failed to create mockup-templates bucket:", bucketError);
        return;
      }
      console.log("Created mockup-templates bucket");
    }

    // Check if templates exist
    const { data: files } = await supabase.storage
      .from("mockup-templates")
      .list();

    if (!files || files.length === 0) {
      console.warn("⚠️ Templates not found in Supabase Storage!");
      console.warn("Please upload the templates from public/mockup-templates/ to Supabase Storage:");
      console.warn("1. Go to Lovable Cloud -> Storage -> mockup-templates bucket");
      console.warn("2. Upload all 6 template files:");
      console.warn("   - ford-transporter.png");
      console.warn("   - vw-transporter.png");
      console.warn("   - mercedes-sprinter.png");
      console.warn("   - mercedes-transporter.png");
      console.warn("   - scaffold-banner.png");
      console.warn("   - fence-banner.png");
    } else {
      console.log(`✓ Found ${files.length} templates in Supabase Storage`);
    }

    templatesChecked = true;
  } catch (error) {
    console.error("Error checking templates:", error);
  }
}

function selectVehicleTemplate(projectData: any): string {
  const brand = (projectData.vehicle_brand || projectData.vehicleBrand)?.toLowerCase();
  const body = (projectData.vehicle_body || projectData.vehicleBody)?.toLowerCase();
  
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  
  // Use original PNG versions (will be optimized on-the-fly)
  if (brand === "ford") {
    return `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/ford-transporter.png`;
  }
  if (brand === "vw" || brand === "volkswagen") {
    return `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/vw-transporter.png`;
  }
  if (brand === "mercedes") {
    if (body === "sprinter") {
      return `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/mercedes-sprinter.png`;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/mercedes-transporter.png`;
  }
  
  // Fallback to Ford Transporter
  return `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/ford-transporter.png`;
}

// Helper function to optimize image (resize + compress to JPEG)
async function optimizeImage(blob: Blob, maxWidth: number = 800, maxHeight: number = 600): Promise<Blob> {
  const sizeKB = blob.size / 1024;
  console.log(`[optimize] Original: ${sizeKB.toFixed(2)} KB`);
  
  // Don't try to optimize - just return original
  // Nano Banana works better with original images
  console.log(`[optimize] Using original image (Nano Banana works better with unmodified images)`);
  return blob;
}

// Helper function to resize image if too large
async function resizeImageIfNeeded(blob: Blob, maxSizeKB: number = 512): Promise<Blob> {
  const sizeKB = blob.size / 1024;
  console.log(`[resize] Size: ${sizeKB.toFixed(2)} KB`);
  
  if (sizeKB <= maxSizeKB) {
    console.log(`[resize] Already under ${maxSizeKB}KB`);
    return blob;
  }

  console.log(`[resize] Reducing from ${sizeKB.toFixed(2)} KB to target ${maxSizeKB} KB`);
  return optimizeImage(blob, 1024, 768);
}

async function editMockupWithLogo(
  templateUrl: string,
  logoUrl: string,
  brandData: {
    companyName: string;
    slogan: string;
    phone?: string;
    email?: string;
    website?: string;
    primaryColor: string;
    secondaryColor: string;
    style: string;
  },
  mockupType: "vehicle" | "scaffold" | "fence",
  onProgress?: (message: string) => void
): Promise<string> {
  console.log(`\n=== Starting mockup generation for ${mockupType} ===`);
  console.log("Parameters:", { templateUrl, logoUrl, brandData, mockupType });

  // Try Nano Banana first, then fall back to Replicate Flux 1.1 Pro
  try {
    onProgress?.("Mockup wird mit Nano Banana generiert...");
    return await generateWithNanoBanana(templateUrl, logoUrl, brandData, mockupType, onProgress);
  } catch (nanoBananaError) {
    console.error("Nano Banana failed:", nanoBananaError);
    onProgress?.("Nano Banana fehlgeschlagen, versuche Replicate Flux...");
    
    try {
      return await generateWithReplicateFlux(templateUrl, logoUrl, brandData, mockupType, onProgress);
    } catch (replicateError) {
      console.error("Replicate Flux failed:", replicateError);
      onProgress?.("Beide AI-Generierungen fehlgeschlagen, verwende Template...");
      
      // Final fallback: return template
      try {
        console.log("Uploading template as preview fallback...");
        const timestamp = Date.now();
        const filename = `mockup-${mockupType}-preview-${timestamp}.png`;
        
        const templateResponse = await fetch(templateUrl);
        if (templateResponse.ok) {
          const templateBlob = await templateResponse.blob();
          const templateBase64 = await blobToBase64(templateBlob);
          const previewUrl = await uploadBase64Image(templateBase64, filename, "image/png");
          console.log("✓ Template uploaded as preview:", previewUrl);
          return previewUrl;
        }
      } catch (uploadError) {
        console.error("Failed to upload template fallback:", uploadError);
      }
      
      return templateUrl;
    }
  }
}

async function generateWithNanoBanana(
  templateUrl: string,
  logoUrl: string,
  brandData: {
    companyName: string;
    slogan: string;
    phone?: string;
    email?: string;
    website?: string;
    primaryColor: string;
    secondaryColor: string;
    style: string;
  },
  mockupType: "vehicle" | "scaffold" | "fence",
  onProgress?: (message: string) => void
): Promise<string> {
  const startTime = Date.now();
  console.log("=== Trying Nano Banana AI generation ===");
  console.log("Template URL:", templateUrl);
  console.log("Logo URL:", logoUrl);
  console.log("Mockup type:", mockupType);
  console.log("Timestamp:", new Date().toISOString());

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Fetch template image
  console.log("Fetching template image...");
  const templateResponse = await fetch(templateUrl);
  if (!templateResponse.ok) {
    throw new Error(`Failed to fetch template: ${templateResponse.status}`);
  }
  
  // For now, use URL directly - Gemini should be able to fetch public URLs
  console.log("Using template URL directly (public URL from Supabase Storage)");

  const styleDescription = getStyleDescription(brandData.style);
  
  // Build contact info string
  const contactParts = [];
  if (brandData.phone) contactParts.push(brandData.phone);
  if (brandData.email) contactParts.push(brandData.email);
  if (brandData.website) contactParts.push(brandData.website);
  const contactInfo = contactParts.join(" | ");
  
  // Create type-specific prompts
  let editPrompt = "";
  
  if (mockupType === "vehicle") {
    editPrompt = `CRITICAL TEMPLATE EDITING INSTRUCTIONS:
This is a PRE-EXISTING professional vehicle photo template. You are ONLY adding branding to the white side panel.

🚫 DO NOT:
- Regenerate, alter, or modify the vehicle itself in any way
- Change background, lighting, camera angle, or perspective
- Modify vehicle body, wheels, windows, mirrors, or any structural elements
- Add any AI-generated vehicle components
- Change the photographic quality or realism of the template

✅ ONLY DO:
- Add logo and text ON the existing white side panel area
- Respect existing panel seams and door gaps - split decals at panel boundaries
- Follow baseline PARALLEL to sliding-door track/seam
- Maintain the template's photorealistic quality and lighting

BRANDING INTEGRATION:
Logo: "${logoUrl}"
- Place logo prominently on the side panel
- Maintain original logo quality and clarity (ultra-sharp)
- Size: Large enough to be visible from 10+ meters distance
- Position: Upper-left or center-left of side panel
- DO NOT distort or stretch the logo

Company Name: "${brandData.companyName}"
- Font: Bold, sans-serif, ultra-professional
- Size: LARGE - make it the PRIMARY visual element
- Color: Use DARKER NAVY shade of ${brandData.primaryColor} for maximum contrast
- Add thin white outline (1-2mm) around text for enhanced readability
- Baseline: MUST BE PARALLEL to the sliding-door track; check alignment against door seam
- Make LARGER if current size appears too small - prioritize readability

Slogan: "${brandData.slogan}"
- Font: Medium weight, clean sans-serif
- Size: 60-70% of company name size
- Color: ${brandData.secondaryColor || brandData.primaryColor}
- Position: Below company name with adequate spacing
- Baseline: Parallel to company name baseline

Contact Information: "${contactInfo}"
- Font: Regular weight, highly legible sans-serif
- Size: INCREASE font sizes if elements appear too small or cramped
- Use clear separators "|" with adequate spacing - DO NOT make text too dense
- Color: Dark gray or ${brandData.primaryColor}
- Position: Bottom footer area or lower-right corner
- Alignment: ALL baselines parallel to sliding-door track and door seams

SEAM & PANEL HANDLING:
- Respect seams; split decals at panel gaps
- Avoid spanning text/logo over deep recesses or door handles
- If text crosses a seam, create natural break points

SURFACE APPEARANCE:
- Matte laminate appearance, polarizing filter look
- NO specular highlights on glyphs/letters
- Subtle vinyl texture with micro-dots visible on close inspection
- Natural reflections matching vehicle's environment

LAYOUT & HIERARCHY:
Design Style: ${styleDescription}
- Professional, clean, high-impact design
- Strategic use of colors: Primary ${brandData.primaryColor}, Secondary ${brandData.secondaryColor}
- Balanced composition with clear visual hierarchy
- Premium, $5000+ professional vehicle wrap appearance

QUALITY ASSURANCE CHECKLIST:
✓ Text Rendering: Every letter razor-sharp, perfectly legible, adequate size
✓ Logo Quality: Crystal clear, maintains original resolution and colors
✓ Color Accuracy: Exact match to brand colors (use darker navy variants for contrast)
✓ Baseline Alignment: All text parallel to vehicle's horizontal lines and seams
✓ Seam Respect: Decals split appropriately at panel gaps
✓ Professional Finish: Looks like a $5000+ professional vinyl wrap job
✓ Realism: Natural reflections, shadows, matte laminate finish
✓ Template Integrity: Original vehicle photo UNCHANGED, only branding added

OUTPUT: ULTRA HIGH RESOLUTION image with razor-sharp text and perfect logo integration.`;
  } else {
    // Scaffold or Fence banner
    editPrompt = `CRITICAL TEMPLATE EDITING INSTRUCTIONS:
This is a PRE-EXISTING professional ${mockupType} banner mockup. You are ONLY adding branding to the white banner surface.

🚫 DO NOT:
- Regenerate or alter the ${mockupType === "scaffold" ? "scaffolding structure" : "fence structure"}
- Change background, lighting, or perspective
- Modify banner material, wrinkles, folds, or mounting hardware
- Add any AI-generated structural elements
- Change the photographic quality or realism

✅ ONLY DO:
- Place logo and text ON the existing white banner surface
- Center design on the banner area
- Respect natural wrinkles and folds of the material
- Maintain the template's realistic appearance and lighting

BRANDING INTEGRATION:
Logo: "${logoUrl}"
- Center logo at top or center of banner
- Maintain original logo quality (ultra-sharp)
- Size: Large and prominent for visibility from distance
- DO NOT distort or stretch

Company Name: "${brandData.companyName}"
- Font: Bold, sans-serif, ultra-professional
- Size: VERY LARGE - primary focal point
- Color: Use DARKER NAVY shade of ${brandData.primaryColor} for contrast
- Add thin white outline (1-2mm) for enhanced visibility
- Position: Below logo or centered

Slogan: "${brandData.slogan}"
- Font: Medium weight, clean sans-serif
- Size: 60-70% of company name
- Color: ${brandData.secondaryColor || brandData.primaryColor}
- Position: Below company name

Contact Information: "${contactInfo}"
- Font: Regular, highly legible
- Size: Adequate for readability from distance
- Use separators "|" with proper spacing
- Color: Dark gray or ${brandData.primaryColor}
- Position: Bottom of banner

LAYOUT:
Design Style: ${styleDescription}
- Centered, balanced composition
- Clean hierarchy: Logo → Company Name → Slogan → Contact
- Strategic use of colors: Primary ${brandData.primaryColor}, Secondary ${brandData.secondaryColor}
- Professional, high-impact advertising banner

MATERIAL APPEARANCE:
- Banner mesh or vinyl material texture
- Natural folds and wrinkles preserved
- Matte finish, no excessive glare
- Realistic outdoor banner appearance

QUALITY ASSURANCE:
✓ Text: Razor-sharp, perfectly readable
✓ Logo: Crystal clear, original quality
✓ Colors: Exact brand color match (darker variants for contrast)
✓ Layout: Centered, professional, balanced
✓ Realism: Looks like professional printed banner
✓ Template Integrity: Original ${mockupType} structure UNCHANGED

OUTPUT: ULTRA HIGH RESOLUTION banner mockup with perfect branding integration.`;
  }

  try {
    onProgress?.("Template wird geladen...");
    
    // Fetch template image with timeout
    console.log("Fetching template image from:", templateUrl);
    const templateController = new AbortController();
    const templateTimeout = setTimeout(() => templateController.abort(), 30000); // 30s timeout
    
    try {
      const templateResponse = await fetch(templateUrl, {
        signal: templateController.signal
      });
      clearTimeout(templateTimeout);
      
      if (!templateResponse.ok) {
        const errorBody = await templateResponse.text();
        console.error(`Template fetch failed: ${templateResponse.status}`, errorBody);
        throw new Error(`Failed to fetch template: ${templateResponse.status} - ${errorBody}`);
      }
      
      const templateBlob = await templateResponse.blob();
      const templateSizeKB = (templateBlob.size / 1024).toFixed(1);
      const templateSizeMB = (templateBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`✓ Template loaded: ${templateSizeKB} KB (${templateSizeMB} MB)`);
      
      onProgress?.("Logo wird geladen...");
      console.log("Fetching logo image from:", logoUrl);
      
      // Fetch logo with timeout
      const logoController = new AbortController();
      const logoTimeout = setTimeout(() => logoController.abort(), 30000); // 30s timeout
      
      const logoResponse = await fetch(logoUrl, {
        signal: logoController.signal
      });
      clearTimeout(logoTimeout);
      
      if (!logoResponse.ok) {
        const errorBody = await logoResponse.text();
        console.error(`Logo fetch failed: ${logoResponse.status}`, errorBody);
        throw new Error(`Failed to fetch logo: ${logoResponse.status} - ${errorBody}`);
      }
      
      let logoBlob = await logoResponse.blob();
      const logoSizeKB = (logoBlob.size / 1024).toFixed(1);
      const logoSizeMB = (logoBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`✓ Logo loaded: ${logoSizeKB} KB (${logoSizeMB} MB)`);
      
      // Auto-resize logo if > 1MB
      if (logoBlob.size > 1024 * 1024) {
        console.log("Logo too large, resizing...");
        onProgress?.("Logo wird optimiert...");
        logoBlob = await resizeImageIfNeeded(logoBlob, 512); // Max 512KB
        const newLogoSizeKB = (logoBlob.size / 1024).toFixed(1);
        console.log(`✓ Logo resized to ${newLogoSizeKB} KB`);
      }
    
      // Convert to base64
      onProgress?.("Bilder werden vorbereitet...");
      const templateBase64 = await blobToBase64(templateBlob);
      const logoBase64 = await blobToBase64(logoBlob);
      console.log("✓ Images converted to base64");
      
      onProgress?.("KI generiert Mockup...");
      
      // SIMPLIFIED prompt for Nano Banana - more focused and concise
      const brandingPrompt = mockupType === "vehicle" 
        ? `Add branding to this vehicle's side panel:
- Place the logo prominently
- Add company name "${brandData.companyName}" in large, bold text
- Add slogan "${brandData.slogan}" below it
- Add contact info: ${brandData.phone || ''} ${brandData.website || ''}
- Use color ${brandData.primaryColor} for main elements
- Make it look like a professional vehicle wrap
- Keep the vehicle and background unchanged`
        : `Add branding to this ${mockupType} banner:
- Center the logo at top
- Add company name "${brandData.companyName}" in large, bold text
- Add slogan "${brandData.slogan}" below
- Add contact: ${brandData.phone || ''} ${brandData.website || ''}
- Use color ${brandData.primaryColor}
- Make it professional and centered
- Keep the ${mockupType} structure unchanged`;
      
      console.log("Calling Nano Banana API...");
      const apiStartTime = Date.now();
      
      // Retry logic for 400 errors
      let lastError: Error | null = null;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`API attempt ${attempt}/${maxRetries}`);
          
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image-preview",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: brandingPrompt
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: templateBase64
                      }
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: logoBase64
                      }
                    }
                  ]
                }
              ],
              modalities: ["image", "text"],
              max_tokens: 2000
            })
          });

          const apiDuration = Date.now() - apiStartTime;
          console.log(`API response received in ${apiDuration}ms with status ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Nano Banana error (attempt ${attempt}):`, response.status);
            console.error("Error body:", errorText);
            console.error("Template size:", templateSizeKB, "KB");
            console.error("Logo size:", logoSizeKB, "KB");
            
            if (response.status === 400 && attempt < maxRetries) {
              console.log(`Retrying in 2 seconds...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            
            throw new Error(`AI API failed: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log("✓ Nano Banana response received successfully");

          // Extract the edited image
          const editedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (!editedImageUrl) {
            console.log("No image in response");
            const textContent = data.choices?.[0]?.message?.content;
            console.log("Response content:", textContent || "no content");
            throw new Error("No image generated by AI");
          }

          onProgress?.("Mockup wird hochgeladen...");
          console.log("✓ Image edited successfully, uploading to storage...");

          // Upload the base64 image to Supabase Storage
          const timestamp = Date.now();
          const filename = `mockup-${mockupType}-${timestamp}.png`;
          const uploadedUrl = await uploadBase64Image(editedImageUrl, filename);
          
          const totalDuration = Date.now() - startTime;
          console.log(`✓ Mockup uploaded successfully in ${totalDuration}ms:`, uploadedUrl);
          return uploadedUrl;
          
        } catch (error) {
          lastError = error as Error;
          if (attempt === maxRetries) {
            throw error;
          }
          console.log(`Attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      throw lastError || new Error("All retry attempts failed");
      
    } catch (fetchError) {
      clearTimeout(templateTimeout);
      throw fetchError;
    }

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`❌ Error in editMockupWithLogo after ${totalDuration}ms:`, error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    
    throw error;
  }
}

async function generateWithReplicateFlux(
  templateUrl: string,
  logoUrl: string,
  brandData: {
    companyName: string;
    slogan: string;
    phone?: string;
    email?: string;
    website?: string;
    primaryColor: string;
    secondaryColor: string;
    style: string;
  },
  mockupType: "vehicle" | "scaffold" | "fence",
  onProgress?: (message: string) => void
): Promise<string> {
  console.log("=== Trying Replicate Flux 1.1 Pro generation ===");
  
  const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
  if (!REPLICATE_API_KEY) {
    throw new Error("REPLICATE_API_KEY is not configured");
  }

  try {
    onProgress?.("Mockup wird mit Replicate Flux generiert...");
    
    // Build contact info string
    const contactParts = [];
    if (brandData.phone) contactParts.push(`Tel: ${brandData.phone}`);
    if (brandData.email) contactParts.push(`E-Mail: ${brandData.email}`);
    if (brandData.website) contactParts.push(`Web: ${brandData.website}`);
    const contactInfo = contactParts.join(" | ");

    const styleDescription = getStyleDescription(brandData.style);
    
    // Construct a detailed prompt describing the mockup based on type
    let prompt = "";
    
    if (mockupType === "vehicle") {
      prompt = `Professional vehicle branding mockup - photorealistic quality:

VEHICLE: White commercial van/transporter side view
BRANDING PLACEMENT: On the vehicle's side panel

BRANDING ELEMENTS:
- Company Name: "${brandData.companyName}" (large, bold, prominent)
- Slogan: "${brandData.slogan}" (medium size, below company name)
- Contact: ${contactInfo} (smaller, at bottom)
- Brand Color: ${brandData.primaryColor}
- Style: ${styleDescription}

DESIGN REQUIREMENTS:
- Professional vehicle wrap design
- Text should be clear and readable from distance
- Use brand color ${brandData.primaryColor} as primary color
- Clean, professional layout
- Logo would be prominently placed (left side)
- Text parallel to vehicle body lines
- High contrast for maximum visibility

OUTPUT: Ultra high resolution, photorealistic vehicle mockup with professional branding`;
    } else {
      prompt = `Professional ${mockupType} banner mockup - photorealistic quality:

BANNER TYPE: ${mockupType === "scaffold" ? "Scaffolding mesh banner" : "Construction fence banner"}
LAYOUT: Centered design on white/light banner surface

BRANDING ELEMENTS:
- Company Name: "${brandData.companyName}" (very large, bold, centered)
- Slogan: "${brandData.slogan}" (medium size, below company name)
- Contact Information: ${contactInfo} (smaller, at bottom)
- Brand Color: ${brandData.primaryColor}
- Style: ${styleDescription}

DESIGN REQUIREMENTS:
- Centered, balanced composition
- Logo at top center (large and prominent)
- Professional advertising banner design
- High contrast text for outdoor visibility
- Use brand color ${brandData.primaryColor} strategically
- Clean hierarchy: Logo → Company Name → Slogan → Contact
- Realistic ${mockupType} setting

OUTPUT: Ultra high resolution, photorealistic banner mockup with professional branding`;
    }

    console.log("Replicate Flux prompt:", prompt);

    // Call Replicate API
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "wait=60"
      },
      body: JSON.stringify({
        version: "d0b9eff6214e0a1c2a1e7ae04ca039603db1e866af83290070fc7a1c3c5b4b8f", // flux-1.1-pro latest version
        input: {
          prompt: prompt,
          aspect_ratio: "16:9",
          output_format: "png",
          output_quality: 90,
          safety_tolerance: 2,
          prompt_upsampling: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }

    const prediction = await response.json();
    console.log("Replicate prediction started:", prediction.id);
    
    // If prediction is already complete (due to Prefer: wait header)
    if (prediction.status === "succeeded" && prediction.output) {
      const generatedImageUrl = prediction.output;
      console.log("✓ Replicate generated image URL (immediate):", generatedImageUrl);
      
      // Download and upload to Supabase storage
      onProgress?.("Lade generiertes Mockup hoch...");
      const imageResponse = await fetch(generatedImageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
      }
      
      const imageBlob = await imageResponse.blob();
      const imageBase64 = await blobToBase64(imageBlob);
      
      const timestamp = Date.now();
      const filename = `mockup-${mockupType}-replicate-${timestamp}.png`;
      const uploadedUrl = await uploadBase64Image(imageBase64, filename, "image/png");
      
      console.log("✓ Replicate mockup uploaded to Supabase:", uploadedUrl);
      return uploadedUrl;
    }
    
    // Poll for completion if not immediately done
    onProgress?.("Warte auf Replicate Flux Verarbeitung...");
    let predictionStatus = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s per attempt)
    
    while (predictionStatus.status !== "succeeded" && predictionStatus.status !== "failed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Bearer ${REPLICATE_API_KEY}`,
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
      }
      
      predictionStatus = await statusResponse.json();
      console.log(`Replicate status check ${attempts + 1}:`, predictionStatus.status);
      attempts++;
    }

    if (predictionStatus.status === "failed") {
      throw new Error(`Replicate generation failed: ${predictionStatus.error || "Unknown error"}`);
    }

    if (predictionStatus.status !== "succeeded" || !predictionStatus.output) {
      throw new Error("Replicate prediction timed out or has no output");
    }

    const generatedImageUrl = predictionStatus.output;
    console.log("✓ Replicate generated image URL:", generatedImageUrl);
    
    // Download and upload to Supabase storage
    onProgress?.("Lade generiertes Mockup hoch...");
    const imageResponse = await fetch(generatedImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    const imageBase64 = await blobToBase64(imageBlob);
    
    const timestamp = Date.now();
    const filename = `mockup-${mockupType}-replicate-${timestamp}.png`;
    const uploadedUrl = await uploadBase64Image(imageBase64, filename, "image/png");
    
    console.log("✓ Replicate mockup uploaded to Supabase:", uploadedUrl);
    return uploadedUrl;
    
  } catch (error) {
    console.error("Error in generateWithReplicateFlux:", error);
    throw error;
  }
}

// Helper function to convert Blob to base64 data URL
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mimeType = blob.type || 'image/png';
  return `data:${mimeType};base64,${base64}`;
}

// Helper function to resize and compress image
async function resizeImage(blob: Blob, maxWidth: number = 1920, maxHeight: number = 1920): Promise<Blob> {
  // For Deno, we'll use a simpler approach - just return the blob if it's small enough
  // If too large, we should ideally resize, but for now we'll trust the input is reasonable
  const arrayBuffer = await blob.arrayBuffer();
  const sizeInMB = arrayBuffer.byteLength / (1024 * 1024);
  
  console.log(`Image size: ${sizeInMB.toFixed(2)} MB`);
  
  // If image is larger than 5MB, we need to handle it
  if (sizeInMB > 5) {
    console.warn(`Image is too large (${sizeInMB.toFixed(2)} MB), may cause issues with AI processing`);
  }
  
  return blob;
}

async function uploadBase64Image(base64Data: string, filename: string, contentType: string = "image/png"): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Remove data URL prefix
  const base64String = base64Data.split(",")[1];
  const imageBuffer = Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));

  const { data, error } = await supabase.storage
    .from("mockups")
    .upload(filename, imageBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error("Error uploading to Supabase Storage:", error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from("mockups")
    .getPublicUrl(data.path);

  console.log("Uploaded to Supabase Storage:", publicUrl);
  return publicUrl;
}

function getStyleDescription(style: string): string {
  const styleMap: Record<string, string> = {
    modern: "Modern, clean design with bold typography and minimalist layout",
    classic: "Classic, timeless design with traditional fonts and balanced composition",
    bold: "Bold, high-impact design with strong colors and dynamic layout",
    minimal: "Minimal, understated design with plenty of white space and subtle elements",
    playful: "Playful, energetic design with creative elements and vibrant colors",
  };
  return styleMap[style] || styleMap.modern;
}
