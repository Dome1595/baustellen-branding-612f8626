import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { companyData, selectedVehicles } = await req.json();

    console.log("Received data:", { companyData, selectedVehicles });

    const mockups = [];

    // Lade verfügbare Templates aus Storage
    const { data: files, error: listError } = await supabase.storage.from("mockup-templates").list();

    if (listError) {
      console.error("Storage list error:", listError);
      throw listError;
    }

    console.log("Available templates:", files);

    // Für jedes ausgewählte Fahrzeug
    for (const vehicle of selectedVehicles) {
      // Finde passendes Template
      const templateFile = files?.find((f) =>
        f.name.toLowerCase().includes(vehicle.toLowerCase().replace(/\s+/g, "-")),
      );

      if (!templateFile) {
        console.warn(`No template found for ${vehicle}`);
        continue;
      }

      console.log(`Processing ${vehicle} with template ${templateFile.name}`);

      // Hole die öffentliche URL
      const { data: urlData } = supabase.storage.from("mockup-templates").getPublicUrl(templateFile.name);

      if (!urlData?.publicUrl) {
        console.error(`No public URL for ${templateFile.name}`);
        continue;
      }

      // WICHTIG: Erstelle Mockup-Objekt mit korrektem Typ
      const mockup = {
        id: crypto.randomUUID(),
        vehicleType: vehicle,
        imageUrl: urlData.publicUrl,
        templateName: templateFile.name,
        type: "mockup", // EXPLIZITER TYP!
      };

      console.log("Created mockup:", mockup);
      mockups.push(mockup);
    }

    console.log(`Generated ${mockups.length} mockups`);

    // Rückgabe mit korrektem Format
    return new Response(
      JSON.stringify({
        success: true,
        count: mockups.length,
        mockups: mockups,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in generate-mockups:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        mockups: [],
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
});
