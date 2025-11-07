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

    const { projectData } = await req.json();
    console.log("Generating mockups with project data:", projectData);

    const mockups: Array<{ type: string; url: string; title: string }> = [];

    // Generate vehicle mockup if enabled
    if (projectData.vehicle_enabled || projectData.vehicleEnabled) {
      console.log("Generating vehicle mockup...");
      const templateUrl = selectVehicleTemplate(projectData);
      console.log("Selected vehicle template:", templateUrl);
      
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
      console.log("Selected scaffold template:", templateUrl);
      
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
      console.log("Selected fence template:", templateUrl);
      
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
  
  // Fallback to Mercedes Transporter
  return `${SUPABASE_URL}/storage/v1/object/public/mockup-templates/mercedes-transporter.png`;
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
  mockupType: "vehicle" | "scaffold" | "fence"
): Promise<string> {
  console.log("Starting mockup editing with Nano Banana...");
  console.log("Template URL:", templateUrl);
  console.log("Logo URL:", logoUrl);
  console.log("Mockup type:", mockupType);

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
    console.log("Calling Lovable AI Gateway for text generation...");
    
    // For now, we'll return the template URL directly without AI editing
    // This is a temporary solution until we resolve the image processing issue
    console.log("TEMPORARY: Returning template without AI editing");
    console.log("Template URL:", templateUrl);
    console.log("Logo URL:", logoUrl);
    console.log("Brand data:", brandData);
    
    // Return the template URL directly for now
    // TODO: Implement proper image editing once Gemini can process the images
    return templateUrl;
  } catch (error) {
    console.error("Error in editMockupWithLogo:", error);
    throw error;
  }
}

async function uploadBase64Image(base64Data: string, filename: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Remove data URL prefix
  const base64String = base64Data.split(",")[1];
  const imageBuffer = Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));

  const { data, error } = await supabase.storage
    .from("mockups")
    .upload(filename, imageBuffer, {
      contentType: "image/png",
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
