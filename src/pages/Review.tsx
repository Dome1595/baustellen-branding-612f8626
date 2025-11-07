import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Review = () => {
  const navigate = useNavigate();

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
                  <p className="text-lg">Maler und Lackierer</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Firmenname</p>
                  <p className="text-lg">Muster GmbH</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Botschaft</p>
                  <p className="text-lg">Recruiting - Azubi</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slogan</p>
                  <p className="text-lg italic">„Farbe im Blut? Starte bei uns."</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Werbeträger</p>
                <div className="flex gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">Fahrzeugbeschriftung</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">Gerüstplane</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">Bauzaunbanner</span>
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
              onClick={() => navigate('/export')}
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
