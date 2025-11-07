import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, projectData, mockups } = await req.json();
    
    console.log('Generating PDF for project:', projectId);

    // For now, we'll create a simple data URL that triggers a download
    // In production, you would use a PDF generation library
    const pdfContent = generateSimplePDF(projectData, mockups);
    
    // Convert to base64
    const base64 = btoa(pdfContent);
    const pdfUrl = `data:application/pdf;base64,${base64}`;

    return new Response(JSON.stringify({ pdfUrl, success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-pdf:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSimplePDF(projectData: any, mockups: any[]): string {
  // This is a placeholder that creates a simple text representation
  // In production, use a proper PDF library like jsPDF or pdfmake
  const content = `
BAUSTELLEN-BRANDING PAKET
========================

Unternehmen: ${projectData?.companyName || 'N/A'}
Slogan: "${projectData?.selectedSlogan || 'N/A'}"

MARKENFARBEN
------------
Primärfarbe: ${projectData?.primaryColor || 'N/A'}
Sekundärfarbe: ${projectData?.secondaryColor || 'N/A'}
Akzentfarbe: ${projectData?.accentColor || 'N/A'}

WERBETRÄGER
-----------
${projectData?.vehicleEnabled ? '✓ Fahrzeugbeschriftung' : ''}
${projectData?.scaffoldEnabled ? '✓ Gerüstplane' : ''}
${projectData?.fenceEnabled ? '✓ Bauzaunbanner' : ''}

GENERIERTE MOCKUPS
------------------
${mockups?.length || 0} Mockup(s) wurden erstellt.

Hinweis: Dies ist ein vereinfachtes PDF. Für die vollständige Produktion
kontaktieren Sie bitte einen Druckdienstleister mit den oben genannten
Spezifikationen.
  `;
  
  return content;
}
