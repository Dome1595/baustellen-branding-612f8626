import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    if (location.state?.projectData) {
      setProjectData(location.state.projectData);
    }
  }, [location]);

  if (!projectData) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Keine Projektdaten gefunden</p>
          <Button onClick={() => navigate('/wizard')} className="mt-4">
            Zum Wizard
          </Button>
        </Card>
      </div>
    );
  }

  const getTradeLabel = (trade: string) => {
    return trade === 'MALER' ? 'Maler und Lackierer' : 'Sanitär, Heizung, Klima';
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/wizard')}
            className="mb-6"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zum Wizard
          </Button>

          <h1 className="mb-8 text-4xl font-bold text-foreground">
            Zusammenfassung Ihres Projekts
          </h1>

          <Card className="mb-8 p-8">
            <h2 className="mb-6 text-2xl font-semibold">Projektdetails</h2>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gewerk</p>
                  <p className="text-lg">{getTradeLabel(projectData.trade)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Firmenname</p>
                  <p className="text-lg">{projectData.companyName}</p>
                </div>
              </div>

              {(projectData.website || projectData.phone) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {projectData.website && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Website</p>
                      <p className="text-lg">{projectData.website}</p>
                    </div>
                  )}
                  {projectData.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                      <p className="text-lg">{projectData.phone}</p>
                    </div>
                  )}
                </div>
              )}

              {projectData.cluster && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Botschaft</p>
                    <p className="text-lg">{projectData.cluster} - {projectData.variant}</p>
                  </div>
                  {projectData.selectedSlogan && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Slogan</p>
                      <p className="text-lg italic">„{projectData.selectedSlogan}"</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Werbeträger</p>
                <div className="flex flex-wrap gap-2">
                  {projectData.vehicleEnabled && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      Fahrzeugbeschriftung
                    </span>
                  )}
                  {projectData.scaffoldEnabled && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      Gerüstplane
                    </span>
                  )}
                  {projectData.fenceEnabled && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      Bauzaunbanner
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Farben</p>
                <div className="flex gap-3">
                  {projectData.primaryColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded border" 
                        style={{ backgroundColor: projectData.primaryColor }}
                      />
                      <span className="text-sm">Primär</span>
                    </div>
                  )}
                  {projectData.secondaryColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded border" 
                        style={{ backgroundColor: projectData.secondaryColor }}
                      />
                      <span className="text-sm">Sekundär</span>
                    </div>
                  )}
                  {projectData.accentColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded border" 
                        style={{ backgroundColor: projectData.accentColor }}
                      />
                      <span className="text-sm">Akzent</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="mb-8 p-8">
            <h2 className="mb-6 text-2xl font-semibold">Vorschau Ihrer Mockups</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="aspect-video rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center">
                <p className="text-muted-foreground">Fahrzeug-Mockup</p>
              </div>
              <div className="aspect-video rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center">
                <p className="text-muted-foreground">Gerüst-Mockup</p>
              </div>
              <div className="aspect-video rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center">
                <p className="text-muted-foreground">Bauzaun-Mockup</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => navigate('/export', { state: { projectData, projectId: location.state?.projectId } })}
              className="group"
            >
              <Download className="mr-2 h-5 w-5" />
              PDF generieren
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
