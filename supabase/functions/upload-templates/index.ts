import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base64 encoded template URLs from the uploaded files
const TEMPLATE_URLS = {
  "ford-transporter.png": "https://e629d472-520f-41d1-92bb-f569d0264b37.lovableproject.com/mockup-templates/ford-transporter.png",
  "vw-transporter.png": "https://e629d472-520f-41d1-92bb-f569d0264b37.lovableproject.com/mockup-templates/vw-transporter.png",
  "mercedes-sprinter.png": "https://e629d472-520f-41d1-92bb-f569d0264b37.lovableproject.com/mockup-templates/mercedes-sprinter.png",
  "mercedes-transporter.png": "https://e629d472-520f-41d1-92bb-f569d0264b37.lovableproject.com/mockup-templates/mercedes-transporter.png",
  "scaffold-banner.png": "https://e629d472-520f-41d1-92bb-f569d0264b37.lovableproject.com/mockup-templates/scaffold-banner.png",
  "fence-banner.png": "https://e629d472-520f-41d1-92bb-f569d0264b37.lovableproject.com/mockup-templates/fence-banner.png",
};

// Helper function to determine required templates based on project data
function getRequiredTemplates(projectData: any): string[] {
  const required: string[] = [];
  
  // Vehicle template based on brand/model
  if (projectData?.vehicleEnabled) {
    const brand = projectData.vehicleBrand?.toLowerCase();
    const model = projectData.vehicleModel?.toLowerCase();
    
    if (brand === 'ford') {
      required.push('ford-transporter.png');
    } else if (brand === 'vw' || brand === 'volkswagen') {
      required.push('vw-transporter.png');
    } else if (brand === 'mercedes') {
      if (model === 'sprinter') {
        required.push('mercedes-sprinter.png');
      } else {
        required.push('mercedes-transporter.png');
      }
    }
  }
  
  // Scaffold banner
  if (projectData?.scaffoldEnabled) {
    required.push('scaffold-banner.png');
  }
  
  // Fence banner
  if (projectData?.fenceEnabled) {
    required.push('fence-banner.png');
  }
  
  return required;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body to get project data
    const { projectData } = await req.json().catch(() => ({}));

    console.log("Starting template upload...");

    // Determine which templates are needed
    let requiredTemplates = getRequiredTemplates(projectData);
    
    // Fallback: if no templates selected, upload all templates
    if (!projectData || requiredTemplates.length === 0) {
      console.warn("No templates selected, uploading all templates as fallback");
      requiredTemplates = Object.keys(TEMPLATE_URLS);
    } else {
      console.log(`Uploading ${requiredTemplates.length} selected templates:`, requiredTemplates);
    }

    const results: Record<string, string> = {};
    let successCount = 0;
    let errorCount = 0;

    for (const filename of requiredTemplates) {
      const url = TEMPLATE_URLS[filename as keyof typeof TEMPLATE_URLS];
      if (!url) {
        console.warn(`Template ${filename} not found in TEMPLATE_URLS`);
        continue;
      }
      try {
        console.log(`Fetching ${filename} from ${url}...`);
        
        // Fetch the template image
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const originalSize = (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2);
        console.log(`Original size: ${originalSize} MB`);

        // Upload original version
        console.log(`Uploading original ${filename}...`);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const { error: uploadError } = await supabase.storage
          .from("mockup-templates")
          .upload(filename, uint8Array, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get original public URL
        const { data: { publicUrl } } = supabase.storage
          .from("mockup-templates")
          .getPublicUrl(filename);

        results[filename] = publicUrl;
        
        // Create AGGRESSIVELY optimized version for AI processing
        console.log(`Creating optimized version of ${filename}...`);
        
        try {
          // Decode image
          const image = await Image.decode(new Uint8Array(arrayBuffer));
          console.log(`Original dimensions: ${image.width}x${image.height}`);
          
          // AGGRESSIVE compression: max 800x600px for AI processing
          const maxWidth = 800;
          const maxHeight = 600;
          let newWidth = image.width;
          let newHeight = image.height;
          
          // Calculate aspect ratio
          const aspectRatio = image.width / image.height;
          
          if (image.width > maxWidth || image.height > maxHeight) {
            if (aspectRatio > maxWidth / maxHeight) {
              // Width is limiting factor
              newWidth = maxWidth;
              newHeight = Math.round(maxWidth / aspectRatio);
            } else {
              // Height is limiting factor
              newHeight = maxHeight;
              newWidth = Math.round(maxHeight * aspectRatio);
            }
          }
          
          console.log(`Resizing to: ${newWidth}x${newHeight}`);
          
          // Resize image
          const resized = image.resize(newWidth, newHeight);
          
          // Encode to JPEG with 85% quality for smaller file size
          const optimizedBuffer = await resized.encodeJPEG(85);
          const optimizedSizeKB = (optimizedBuffer.byteLength / 1024).toFixed(1);
          const optimizedSizeMB = (optimizedBuffer.byteLength / (1024 * 1024)).toFixed(2);
          console.log(`Optimized size: ${optimizedSizeKB} KB (${optimizedSizeMB} MB) - ${((1 - optimizedBuffer.byteLength / arrayBuffer.byteLength) * 100).toFixed(1)}% smaller`);
          
          // Upload optimized version as JPEG
          const optimizedFilename = filename.replace('.png', '-optimized.jpg');
          console.log(`Uploading optimized ${optimizedFilename}...`);
          
          const { error: optimizedUploadError } = await supabase.storage
            .from("mockup-templates")
            .upload(optimizedFilename, optimizedBuffer, {
              contentType: "image/jpeg",
              upsert: true,
            });

          if (optimizedUploadError) {
            console.warn(`Failed to upload optimized version: ${optimizedUploadError.message}`);
          } else {
            const { data: { publicUrl: optimizedUrl } } = supabase.storage
              .from("mockup-templates")
              .getPublicUrl(optimizedFilename);
            
            results[optimizedFilename] = optimizedUrl;
            console.log(`✓ Optimized ${optimizedFilename} uploaded: ${optimizedUrl} (${optimizedSizeKB} KB)`);
          }
        } catch (optimizeError) {
          console.warn(`Failed to optimize ${filename}:`, optimizeError);
          // Continue with original version
        }

        successCount++;
        console.log(`✓ ${filename} uploaded successfully: ${publicUrl}`);
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        results[filename] = `ERROR: ${errorMessage}`;
        console.error(`✗ Failed to upload ${filename}:`, error);
      }
    }

    console.log(`Upload complete: ${successCount} successful, ${errorCount} failed`);

    return new Response(
      JSON.stringify({
        success: errorCount === 0,
        uploaded: successCount,
        failed: errorCount,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in upload-templates function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
