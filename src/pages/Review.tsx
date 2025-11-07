import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Import templates
import fordTemplate from "@/assets/templates/ford-transporter.png";
import vwTemplate from "@/assets/templates/vw-transporter.png";
import mercedesSprinterTemplate from "@/assets/templates/mercedes-sprinter.png";
import mercedesTransporterTemplate from "@/assets/templates/mercedes-transporter.png";
import scaffoldTemplate from "@/assets/templates/scaffold-banner.png";
import fenceTemplate from "@/assets/templates/fence-banner.png";

const TEMPLATES = [
  { url: fordTemplate, name: "ford-transporter.png" },
  { url: vwTemplate, name: "vw-transporter.png" },
  { url: mercedesSprinterTemplate, name: "mercedes-sprinter.png" },
  { url: mercedesTransporterTemplate, name: "mercedes-transporter.png" },
  { url: scaffoldTemplate, name: "scaffold-banner.png" },
  { url: fenceTemplate, name: "fence-banner.png" },
];

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectData = location.state?.projectData;
  const [mockups, setMockups] = useState<any[]>([]);
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isUploadingTemplates, setIsUploadingTemplates] = useState(false);

  useEffect(() => {
    if (!projectData) {
      toast.error('Keine Projektdaten gefunden');
      navigate('/');
      return;
    }

    // Ensure templates are uploaded, then generate mockups
    ensureTemplatesAndGenerateMockups();
  }, [projectData, navigate]);

  const uploadTemplates = async () => {
    setIsUploadingTemplates(true);
    console.log("Checking and uploading templates...");

    try {
      // Check if templates already exist
      const { data: existingFiles } = await supabase.storage
        .from("mockup-templates")
        .list();

      if (existingFiles && existingFiles.length >= 6) {
        console.log("Templates already exist, skipping upload");
        return true;
      }

      // Upload all templates
      let successCount = 0;
      for (const template of TEMPLATES) {
        try {
          const response = await fetch(template.url);
          const blob = await response.blob();

          const { error } = await supabase.storage
            .from("mockup-templates")
            .upload(template.name, blob, {
              contentType: "image/png",
              upsert: true,
            });

          if (!error) {
            successCount++;
            console.log(`Uploaded ${template.name}`);
          } else {
            console.error(`Failed to upload ${template.name}:`, error);
          }
        } catch (err) {
          console.error(`Error uploading ${template.name}:`, err);
        }
      }

      if (successCount === TEMPLATES.length) {
        console.log("All templates uploaded successfully");
        return true;
      } else {
        console.warn(`Only ${successCount}/${TEMPLATES.length} templates uploaded`);
        return successCount > 0;
      }
    } catch (error) {
      console.error("Error checking/uploading templates:", error);
      return false;
    } finally {
      setIsUploadingTemplates(false);
    }
  };

  const ensureTemplatesAndGenerateMockups = async () => {
    const templatesReady = await uploadTemplates();
    if (templatesReady) {
      await generateMockups();
    } else {
      toast.error("Fehler beim Upload der Templates. Bitte versuchen Sie es erneut.");
    }
  };

  const generateMockups = async () => {
    setIsGeneratingMockups(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-mockups', {
        body: { projectData }
      });

      if (error) throw error;

      if (data?.mockups) {
        setMockups(data.mockups);
        toast.success('Mockups erfolgreich generiert');
      }
    } catch (error) {
      console.error('Error generating mockups:', error);
      toast.error('Fehler beim Generieren der Mockups');
    } finally {
      setIsGeneratingMockups(false);
    }
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { 
          projectId: location.state?.projectId,
          projectData,
          mockups
        }
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        toast.success('PDF erfolgreich generiert');
        navigate('/export', { state: { pdfUrl: data.pdfUrl, projectData, mockups } });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Fehler beim Generieren des PDFs');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!projectData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>

          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Ihr Baustellen-Branding
            </h1>
            <p className="text-lg text-muted-foreground">
              Überprüfen Sie die Vorschau und laden Sie das fertige Paket herunter
            </p>
          </div>

          <Card className="mb-8 p-6">
            <h2 className="mb-4 text-2xl font-semibold">Projektdetails</h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Unternehmen</p>
                  <p className="font-medium">{projectData.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slogan</p>
                  <p className="font-medium italic">"{projectData.selectedSlogan}"</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Markenfarben</p>
                <div className="flex gap-2">
                  {projectData.primaryColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded border" 
                        style={{ backgroundColor: projectData.primaryColor }}
                      />
                      <span className="text-xs">{projectData.primaryColor}</span>
                    </div>
                  )}
                  {projectData.secondaryColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded border" 
                        style={{ backgroundColor: projectData.secondaryColor }}
                      />
                      <span className="text-xs">{projectData.secondaryColor}</span>
                    </div>
                  )}
                  {projectData.accentColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded border" 
                        style={{ backgroundColor: projectData.accentColor }}
                      />
                      <span className="text-xs">{projectData.accentColor}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Werbeträger</p>
                <div className="flex flex-wrap gap-2">
                  {projectData.vehicleEnabled && (
                    <Badge>Fahrzeugbeschriftung</Badge>
                  )}
                  {projectData.scaffoldEnabled && (
                    <Badge>Gerüstplane</Badge>
                  )}
                  {projectData.fenceEnabled && (
                    <Badge>Bauzaunbanner</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="mb-8 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Mockup-Vorschau</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Änderungen vornehmen
              </Button>
            </div>

            {isUploadingTemplates ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Templates werden vorbereitet...</p>
              </div>
            ) : isGeneratingMockups ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Mockups werden generiert...</p>
              </div>
            ) : mockups.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3">
                {mockups.map((mockup, index) => (
                  <Card key={index} className="overflow-hidden">
                    {mockup.url ? (
                      <img
                        src={mockup.url}
                        alt={mockup.title}
                        className="h-48 w-full object-cover"
                        onError={(e) => {
                          console.error('Error loading mockup image:', mockup.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-48 w-full bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">Mockup wird generiert...</p>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold">{mockup.title}</h3>
                      <p className="text-sm text-muted-foreground">KI-generiert</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Keine Mockups verfügbar. Bitte wählen Sie mindestens einen Werbeträger.
              </div>
            )}
          </Card>

          <div className="flex justify-center gap-4">
            <Button 
              size="lg" 
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf || isGeneratingMockups || isUploadingTemplates}
            >
              <Download className="mr-2 h-5 w-5" />
              {isGeneratingPdf ? 'PDF wird generiert...' : 'PDF jetzt generieren'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
