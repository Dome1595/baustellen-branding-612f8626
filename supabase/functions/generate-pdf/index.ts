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

    // Generate HTML content for PDF
    const htmlContent = generatePDFHTML(projectData, mockups);
    
    // Use Puppeteer or similar to convert HTML to PDF would be ideal
    // For now, we'll return HTML content as base64 that can be printed
    const base64 = btoa(unescape(encodeURIComponent(htmlContent)));
    const dataUrl = `data:text/html;base64,${base64}`;

    return new Response(JSON.stringify({ 
      pdfUrl: dataUrl,
      htmlContent: htmlContent,
      success: true 
    }), {
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

function generatePDFHTML(projectData: any, mockups: any[]): string {
  const companyName = projectData?.companyName || projectData?.company_name || 'N/A';
  const slogan = projectData?.selectedSlogan || projectData?.slogan_selected || 'N/A';
  const primaryColor = projectData?.primaryColor || projectData?.primary_color || '#1B4965';
  const secondaryColor = projectData?.secondaryColor || projectData?.secondary_color || '#62B6CB';
  const accentColor = projectData?.accentColor || projectData?.accent_color || '#BEE9E8';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Baustellen-Branding Paket - ${companyName}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    .page {
      page-break-after: always;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${primaryColor};
    }
    h1 {
      color: ${primaryColor};
      font-size: 32px;
      margin-bottom: 10px;
    }
    h2 {
      color: ${primaryColor};
      font-size: 24px;
      margin: 30px 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid ${secondaryColor};
    }
    h3 {
      color: ${secondaryColor};
      font-size: 18px;
      margin: 20px 0 10px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    .info-item {
      padding: 15px;
      background: #f8f9fa;
      border-left: 4px solid ${primaryColor};
    }
    .info-label {
      font-weight: bold;
      color: ${secondaryColor};
      font-size: 14px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 16px;
      color: #333;
    }
    .color-swatches {
      display: flex;
      gap: 20px;
      margin: 20px 0;
    }
    .color-swatch {
      flex: 1;
      text-align: center;
    }
    .color-box {
      height: 80px;
      border-radius: 8px;
      margin-bottom: 10px;
      border: 2px solid #ddd;
    }
    .mockup-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
      margin: 20px 0;
    }
    .mockup-item {
      page-break-inside: avoid;
    }
    .mockup-image {
      width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #ddd;
      margin-bottom: 10px;
    }
    .mockup-title {
      font-weight: bold;
      color: ${primaryColor};
      font-size: 16px;
    }
    .slogan {
      font-style: italic;
      font-size: 18px;
      color: ${secondaryColor};
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid ${accentColor};
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      .page {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Baustellen-Branding Paket</h1>
      <p style="font-size: 18px; color: #666;">Ihr professionelles Branding-Konzept</p>
    </div>

    <h2>Unternehmensdetails</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Unternehmen</div>
        <div class="info-value">${companyName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Branche</div>
        <div class="info-value">${projectData?.trade || 'N/A'}</div>
      </div>
    </div>

    <div class="slogan">"${slogan}"</div>

    <h2>Markenfarben</h2>
    <div class="color-swatches">
      <div class="color-swatch">
        <div class="color-box" style="background-color: ${primaryColor};"></div>
        <div class="info-label">Primärfarbe</div>
        <div class="info-value">${primaryColor}</div>
      </div>
      <div class="color-swatch">
        <div class="color-box" style="background-color: ${secondaryColor};"></div>
        <div class="info-label">Sekundärfarbe</div>
        <div class="info-value">${secondaryColor}</div>
      </div>
      <div class="color-swatch">
        <div class="color-box" style="background-color: ${accentColor};"></div>
        <div class="info-label">Akzentfarbe</div>
        <div class="info-value">${accentColor}</div>
      </div>
    </div>

    <h2>Werbeträger</h2>
    <ul style="list-style: none; padding: 0;">
      ${projectData?.vehicleEnabled || projectData?.vehicle_enabled ? '<li style="padding: 10px; background: #f8f9fa; margin-bottom: 10px; border-left: 4px solid ' + primaryColor + ';">✓ Fahrzeugbeschriftung</li>' : ''}
      ${projectData?.scaffoldEnabled || projectData?.scaffold_enabled ? '<li style="padding: 10px; background: #f8f9fa; margin-bottom: 10px; border-left: 4px solid ' + primaryColor + ';">✓ Gerüstplane</li>' : ''}
      ${projectData?.fenceEnabled || projectData?.fence_enabled ? '<li style="padding: 10px; background: #f8f9fa; margin-bottom: 10px; border-left: 4px solid ' + primaryColor + ';">✓ Bauzaunbanner</li>' : ''}
    </ul>

    <div class="footer">
      <p>Erstellt am ${new Date().toLocaleDateString('de-DE')}</p>
      <p>Baustellen-Branding-Paket Generator</p>
    </div>
  </div>

  ${mockups && mockups.length > 0 ? `
  <div class="page">
    <h2>Mockup-Vorschau</h2>
    <div class="mockup-grid">
      ${mockups.map(mockup => `
        <div class="mockup-item">
          <div class="mockup-title">${mockup.title || 'Mockup'}</div>
          ${mockup.url ? `<img src="${mockup.url}" class="mockup-image" alt="${mockup.title}">` : '<p style="color: #999;">Mockup wird generiert...</p>'}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Mockups generiert mit KI-Unterstützung</p>
    </div>
  </div>
  ` : ''}

  <script>
    // Auto-print when opened
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;
}
