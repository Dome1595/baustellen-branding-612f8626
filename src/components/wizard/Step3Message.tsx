import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

interface Step3MessageProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step3Message = ({ data, onUpdate }: Step3MessageProps) => {
  const [generatedSlogans, setGeneratedSlogans] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const clusters = {
    RECRUITING: {
      name: "Recruiting",
      variants: data.trade === "MALER" 
        ? ["Azubi", "Fachkraft", "Allgemein"]
        : ["Azubi", "Fachkraft", "Allgemein"],
    },
    KUNDEN_LEISTUNG: {
      name: "Kundenleistung",
      variants: data.trade === "MALER"
        ? ["Raumgestaltung/Interieur", "Fassade/WDVS", "Allgemein"]
        : ["Bad", "Heizung", "Allgemein"],
    },
    VERTRAUEN_SERVICE: {
      name: "Vertrauen & Service",
      variants: data.trade === "MALER"
        ? ["Sauberkeit", "Regionalität"]
        : ["Notdienst", "Regionalität"],
    },
    BRANDING: {
      name: "Branding",
      variants: ["Minimal (Logo+Slogan)", "Kontakt (Logo+Website/Telefon)"],
    },
  };

  const handleGenerateSlogans = (cluster: string, variant: string) => {
    setIsGenerating(true);
    onUpdate({ cluster, variant });
    
    // Simulate AI generation
    setTimeout(() => {
      const mockSlogans = [
        "Farbe im Blut? Starte bei uns.",
        "Deine Zukunft im Handwerk.",
        "Profis an den Pinsel!",
        "Azubi mit Perspektive gesucht.",
        "Gemeinsam farbenfroh.",
      ];
      setGeneratedSlogans(mockSlogans);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div>
      <p className="mb-6 text-lg text-muted-foreground">
        Wählen Sie Ihre Botschaft – die KI generiert passende Slogans für Sie.
      </p>

      <Accordion type="single" collapsible className="mb-8">
        {Object.entries(clusters).map(([key, cluster]) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger className="text-lg font-semibold">
              {cluster.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 pt-2 md:grid-cols-3">
                {cluster.variants.map((variant) => (
                  <Button
                    key={variant}
                    variant={data.cluster === key && data.variant === variant ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => handleGenerateSlogans(key, variant)}
                  >
                    {variant}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {generatedSlogans.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">KI-generierte Slogans</h3>
          </div>

          <div className="space-y-2">
            {generatedSlogans.map((slogan, idx) => (
              <Card
                key={idx}
                className={`cursor-pointer border-2 p-4 transition-all hover:shadow-md ${
                  data.selectedSlogan === slogan ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => onUpdate({ selectedSlogan: slogan })}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg">{slogan}</p>
                  {data.selectedSlogan === slogan && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {isGenerating && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default Step3Message;
