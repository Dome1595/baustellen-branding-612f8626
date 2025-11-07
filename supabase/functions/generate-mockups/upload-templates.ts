// One-time script to upload templates to Supabase Storage
// This should be run manually or as part of deployment

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Template files that need to be uploaded
const templates = [
  { name: "ford-transporter.png", path: "../../public/mockup-templates/ford-transporter.png" },
  { name: "vw-transporter.png", path: "../../public/mockup-templates/vw-transporter.png" },
  { name: "mercedes-sprinter.png", path: "../../public/mockup-templates/mercedes-sprinter.png" },
  { name: "mercedes-transporter.png", path: "../../public/mockup-templates/mercedes-transporter.png" },
  { name: "scaffold-banner.png", path: "../../public/mockup-templates/scaffold-banner.png" },
  { name: "fence-banner.png", path: "../../public/mockup-templates/fence-banner.png" },
];

// Create mockup-templates bucket if it doesn't exist
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === "mockup-templates");
  
  if (!bucketExists) {
    await supabase.storage.createBucket("mockup-templates", {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });
    console.log("Created mockup-templates bucket");
  }
}

// Upload templates
async function uploadTemplates() {
  await ensureBucket();
  
  for (const template of templates) {
    try {
      // Read file from public folder
      const file = await Deno.readFile(template.path);
      
      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("mockup-templates")
        .upload(template.name, file, {
          contentType: "image/png",
          upsert: true,
        });
      
      if (error) {
        console.error(`Failed to upload ${template.name}:`, error);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("mockup-templates")
          .getPublicUrl(template.name);
        console.log(`✓ Uploaded ${template.name}: ${publicUrl}`);
      }
    } catch (err) {
      console.error(`Error processing ${template.name}:`, err);
    }
  }
}

uploadTemplates();
