import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

    // Upload templates first, then generate mockups
    uploadTemplatesViaFunction();
  }, [projectData, navigate]);

  const uploadTemplatesViaFunction = async () => {
    setIsUploadingTemplates(true);
    console.log("Uploading templates via edge function...");

    try {
      const { data, error } = await supabase.functions.invoke('upload-templates');

      if (error) throw error;

      if (data?.success) {
        console.log("Templates uploaded successfully:", data);
        toast.success(`${data.uploaded} Templates hochgeladen`);
        await generateMockups();
      } else {
        console.error("Template upload failed:", data);
        toast.error("Fehler beim Upload der Templates");
      }
    } catch (error) {
      console.error("Error uploading templates:", error);
      toast.error("Fehler beim Upload der Templates");
    } finally {
      setIsUploadingTemplates(false);
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateMockups}
                  disabled={isGeneratingMockups || isUploadingTemplates}
                >
                  <ArrowLeft className="mr-2 h-4 w-4 rotate-180" />
                  Neu generieren
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(-1)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Änderungen vornehmen
                </Button>
              </div>
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
