import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Check } from "lucide-react";

interface Step5StyleProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step5Style = ({ data, onUpdate }: Step5StyleProps) => {
  const creativityLevels = [
    {
      level: 1,
      name: "Konservativ",
      description: "Klassisch und seriös mit klaren Schriften und zurückhaltenden Formen",
    },
    {
      level: 2,
      name: "Modern & Dynamisch",
      description: "Zeitgemäße Typografie mit ausgewogenen grafischen Elementen",
    },
    {
      level: 3,
      name: "Kreativ mit KI-Visuals",
      description: "Innovative Gestaltung mit generativen, markentypischen Bildwelten",
    },
  ];

  return (
    <div>
      <p className="mb-6 text-lg text-muted-foreground">
        Wählen Sie das Design-Level für Ihr Baustellen-Branding.
      </p>

      <div className="mb-8">
        <Label className="mb-4 block text-lg font-semibold">Kreativitäts-Level</Label>
        <Slider
          value={[data.creativityLevel]}
          onValueChange={(value) => onUpdate({ creativityLevel: value[0] })}
          min={1}
          max={3}
          step={1}
          className="mb-4"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Konservativ</span>
          <span>Modern</span>
          <span>Kreativ</span>
        </div>
      </div>

      <div className="space-y-4">
        {creativityLevels.map((item) => {
          const isSelected = data.creativityLevel === item.level;
          
          return (
            <Card
              key={item.level}
              className={`cursor-pointer border-2 p-6 transition-all hover:shadow-lg ${
                isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => onUpdate({ creativityLevel: item.level })}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {isSelected ? <Check className="h-5 w-5" /> : item.level}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold">{item.name}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {data.creativityLevel === 3 && (
        <Card className="mt-6 border-primary/20 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>Hinweis:</strong> Bei diesem Level wird die KI einzigartige visuelle Elemente
            in Ihren Markenfarben generieren, die Ihr Branding unverwechselbar machen.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Step5Style;
