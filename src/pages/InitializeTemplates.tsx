import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Import templates as ES6 modules
import fordTemplate from "@/assets/templates/ford-transporter.png";
import vwTemplate from "@/assets/templates/vw-transporter.png";
import mercedesSprinterTemplate from "@/assets/templates/mercedes-sprinter.png";
import mercedesTransporterTemplate from "@/assets/templates/mercedes-transporter.png";
import scaffoldTemplate from "@/assets/templates/scaffold-banner.png";
import fenceTemplate from "@/assets/templates/fence-banner.png";

const TEMPLATES = [
  { url: fordTemplate, name: "ford-transporter.png", label: "Ford Transporter" },
  { url: vwTemplate, name: "vw-transporter.png", label: "VW Transporter" },
  { url: mercedesSprinterTemplate, name: "mercedes-sprinter.png", label: "Mercedes Sprinter" },
  { url: mercedesTransporterTemplate, name: "mercedes-transporter.png", label: "Mercedes Transporter" },
  { url: scaffoldTemplate, name: "scaffold-banner.png", label: "Gerüstplane" },
  { url: fenceTemplate, name: "fence-banner.png", label: "Bauzaunbanner" },
];

export default function InitializeTemplates() {
  const [status, setStatus] = useState<Record<string, "pending" | "uploading" | "success" | "error">>({});
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    uploadAllTemplates();
  }, []);

  const uploadAllTemplates = async () => {
    let successCount = 0;

    for (const template of TEMPLATES) {
      setStatus(prev => ({ ...prev, [template.name]: "uploading" }));

      try {
        // Fetch the image as blob
        const response = await fetch(template.url);
        const blob = await response.blob();

        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from("mockup-templates")
          .upload(template.name, blob, {
            contentType: "image/png",
            upsert: true,
          });

        if (error) throw error;

        setStatus(prev => ({ ...prev, [template.name]: "success" }));
        successCount++;
      } catch (error) {
        console.error(`Failed to upload ${template.name}:`, error);
        setStatus(prev => ({ ...prev, [template.name]: "error" }));
      }
    }

    setIsComplete(true);

    if (successCount === TEMPLATES.length) {
      toast({
        title: "Templates erfolgreich initialisiert!",
        description: "Alle Mockup-Templates wurden hochgeladen.",
      });
    } else {
      toast({
        title: "Fehler beim Upload",
        description: `${successCount} von ${TEMPLATES.length} Templates hochgeladen.`,
        variant: "destructive",
      });
    }
  };

  const allSuccess = Object.values(status).every(s => s === "success");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Template-Initialisierung</h1>
          <p className="text-muted-foreground">
            Mockup-Templates werden in den Storage hochgeladen...
          </p>
        </div>

        <div className="space-y-3">
          {TEMPLATES.map(template => (
            <div
              key={template.name}
              className="flex items-center gap-3 p-4 border rounded-lg bg-card"
            >
              {status[template.name] === "uploading" && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {status[template.name] === "success" && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {status[template.name] === "error" && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {!status[template.name] && (
                <div className="h-5 w-5 rounded-full border-2 border-muted animate-pulse" />
              )}
              <span className="font-medium">{template.label}</span>
            </div>
          ))}
        </div>

        {isComplete && allSuccess && (
          <Button
            onClick={() => navigate("/")}
            className="w-full"
            size="lg"
          >
            Weiter zur App
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {isComplete && !allSuccess && (
          <div className="space-y-3">
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
              Einige Templates konnten nicht hochgeladen werden. Bitte versuche es erneut.
            </div>
            <Button
              onClick={() => {
                setStatus({});
                setIsComplete(false);
                uploadAllTemplates();
              }}
              variant="outline"
              className="w-full"
            >
              Erneut versuchen
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
