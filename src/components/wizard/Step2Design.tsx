import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";
import { useState } from "react";

interface Step2DesignProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step2Design = ({ data, onUpdate }: Step2DesignProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const suggestedColors = [
    { primary: "#2B7A78", secondary: "#17252A", accent: "#3AAFA9" },
    { primary: "#005BBB", secondary: "#A7B1BC", accent: "#FFD500" },
    { primary: "#1B4965", secondary: "#62B6CB", accent: "#BEE9E8" },
  ];

  return (
    <div className="space-y-8">
      {/* Logo Upload */}
      <div>
        <Label className="mb-3 block text-lg font-semibold">
          2.1 Logo-Upload
        </Label>
        <p className="mb-4 text-muted-foreground">
          Bevorzugt: SVG, EPS, PDF oder AI. Alternativ: PNG oder JPG (mind. 1000px Kantenlänge)
        </p>

        <Card className="border-2 border-dashed p-8">
          {!data.logoUrl ? (
            <div className="text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                Ziehen Sie Ihr Logo hierher oder klicken Sie zum Auswählen
              </p>
              <Button>Logo hochladen</Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded bg-muted"></div>
              <div className="flex-1">
                <p className="font-medium">Logo erfolgreich hochgeladen</p>
                <p className="text-sm text-muted-foreground">logo.svg • 2400x1200px</p>
              </div>
              <Check className="h-6 w-6 text-primary" />
            </div>
          )}
        </Card>
      </div>

      {/* Colors */}
      <div>
        <Label className="mb-3 block text-lg font-semibold">
          2.2 Markenfarben
        </Label>
        <p className="mb-4 text-muted-foreground">
          Basierend auf Ihrem Logo schlagen wir diese Farben vor:
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {suggestedColors.map((colorSet, idx) => (
            <Card
              key={idx}
              className="cursor-pointer border-2 p-4 transition-all hover:shadow-lg hover:border-primary/50"
              onClick={() =>
                onUpdate({
                  primaryColor: colorSet.primary,
                  secondaryColor: colorSet.secondary,
                  accentColor: colorSet.accent,
                })
              }
            >
              <div className="mb-3 flex gap-2">
                <div
                  className="h-12 flex-1 rounded"
                  style={{ backgroundColor: colorSet.primary }}
                ></div>
                <div
                  className="h-12 flex-1 rounded"
                  style={{ backgroundColor: colorSet.secondary }}
                ></div>
                <div
                  className="h-12 flex-1 rounded"
                  style={{ backgroundColor: colorSet.accent }}
                ></div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Farbschema {idx + 1}
              </p>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setShowColorPicker(!showColorPicker)}
        >
          Farben manuell definieren
        </Button>
      </div>
    </div>
  );
};

export default Step2Design;
