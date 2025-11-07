import { Card } from "@/components/ui/card";
import { Paintbrush, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step1TradeProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step1Trade = ({ data, onUpdate }: Step1TradeProps) => {
  const trades = [
    {
      id: "MALER",
      name: "Maler und Lackierer",
      icon: Paintbrush,
      description: "Raumgestaltung, Fassaden, WDVS",
    },
    {
      id: "SHK",
      name: "Sanitär, Heizung, Klima",
      icon: Droplet,
      description: "Bäder, Heizungsanlagen, Klimatechnik",
    },
  ];

  return (
    <div>
      <p className="mb-6 text-lg text-muted-foreground">
        Wählen Sie Ihr Gewerk aus, um maßgeschneiderte Branding-Vorschläge zu erhalten.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {trades.map((trade) => {
          const Icon = trade.icon;
          const isSelected = data.trade === trade.id;

          return (
            <Card
              key={trade.id}
              className={cn(
                "group cursor-pointer border-2 p-6 transition-all hover:shadow-lg",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onUpdate({ trade: trade.id })}
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{trade.name}</h3>
              <p className="text-muted-foreground">{trade.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Step1Trade;
