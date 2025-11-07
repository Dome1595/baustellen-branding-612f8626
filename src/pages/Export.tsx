import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Export = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pdfUrl, projectData } = location.state || {};

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Ihr Baustellen-Branding-Paket ist fertig!
            </h1>
            <p className="text-lg text-muted-foreground">
              Laden Sie jetzt Ihr komplettes Branding-Paket als PDF herunter
            </p>
          </div>

          <Card className="p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex-1">
                <h2 className="mb-1 text-xl font-semibold">Baustellen-Branding-Paket.pdf</h2>
                <p className="text-sm text-muted-foreground">
                  Enthält alle Mockups, Spezifikationen und Druckdaten
                </p>
              </div>
              <Button 
                size="lg" 
                className="group"
                onClick={() => {
                  if (pdfUrl) {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `${projectData?.companyName || 'Baustellen-Branding'}-Paket.pdf`;
                    link.click();
                  }
                }}
                disabled={!pdfUrl}
              >
                <Download className="mr-2 h-5 w-5" />
                PDF herunterladen
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="mb-3 font-semibold">Ihr Paket enthält:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Titelseite mit Projektübersicht
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Fahrzeugbeschriftung mit Spezifikationen
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Gerüstplane mit Maßangaben
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Bauzaunbanner mit Layout-Details
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Farbspezifikationen und Kontrasthinweise
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Produktionshinweise und Druckdaten
                </li>
              </ul>
            </div>
          </Card>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
            >
              Neues Projekt starten
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;
