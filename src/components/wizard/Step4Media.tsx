import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Building2, Fence } from "lucide-react";

interface Step4MediaProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step4Media = ({ data, onUpdate }: Step4MediaProps) => {
  return (
    <div className="space-y-6">
      <p className="text-lg text-muted-foreground">
        Wählen Sie Ihre Werbeträger und konfigurieren Sie die Details.
      </p>

      {/* Vehicle */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Label className="text-lg font-semibold">Fahrzeugbeschriftung</Label>
              <p className="text-sm text-muted-foreground">Seitenflächen und Heck</p>
            </div>
          </div>
          <Switch
            checked={data.vehicleEnabled}
            onCheckedChange={(checked) => onUpdate({ vehicleEnabled: checked })}
          />
        </div>

        {data.vehicleEnabled && (
          <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
            <div>
              <Label>Marke</Label>
              <Select value={data.vehicleBrand} onValueChange={(value) => onUpdate({ vehicleBrand: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="z.B. Mercedes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mercedes">Mercedes</SelectItem>
                  <SelectItem value="vw">VW</SelectItem>
                  <SelectItem value="ford">Ford</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modell</Label>
              <Select value={data.vehicleModel} onValueChange={(value) => onUpdate({ vehicleModel: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="z.B. Sprinter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sprinter">Sprinter</SelectItem>
                  <SelectItem value="transporter">Transporter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aufbau</Label>
              <Select value={data.vehicleBody} onValueChange={(value) => onUpdate({ vehicleBody: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Kastenwagen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kastenwagen">Kastenwagen</SelectItem>
                  <SelectItem value="pritsche">Pritsche</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fahrzeugfarbe</Label>
              <Select value={data.vehicleColor} onValueChange={(value) => onUpdate({ vehicleColor: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Weiß" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">Weiß</SelectItem>
                  <SelectItem value="black">Schwarz</SelectItem>
                  <SelectItem value="gray">Grau</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Card>

      {/* Scaffold */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Label className="text-lg font-semibold">Gerüstplane</Label>
              <p className="text-sm text-muted-foreground">Großflächige Baustellen-Werbung</p>
            </div>
          </div>
          <Switch
            checked={data.scaffoldEnabled}
            onCheckedChange={(checked) => onUpdate({ scaffoldEnabled: checked })}
          />
        </div>

        {data.scaffoldEnabled && (
          <div className="mt-4 border-t pt-4">
            <Label>Größe</Label>
            <Select value={data.scaffoldSize} onValueChange={(value) => onUpdate({ scaffoldSize: value })} defaultValue="250x205">
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="250x205">250 x 205 cm (Standard)</SelectItem>
                <SelectItem value="200x205">200 x 205 cm</SelectItem>
                <SelectItem value="300x205">300 x 205 cm</SelectItem>
                <SelectItem value="custom">Benutzerdefiniert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

      {/* Fence */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Fence className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Label className="text-lg font-semibold">Bauzaunbanner</Label>
              <p className="text-sm text-muted-foreground">340 x 173 cm pro Feld</p>
            </div>
          </div>
          <Switch
            checked={data.fenceEnabled}
            onCheckedChange={(checked) => onUpdate({ fenceEnabled: checked })}
          />
        </div>

        {data.fenceEnabled && (
          <div className="mt-4 border-t pt-4">
            <Label>Anzahl Felder</Label>
            <Select value={data.fenceFields?.toString()} onValueChange={(value) => onUpdate({ fenceFields: parseInt(value) })} defaultValue="3">
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Feld</SelectItem>
                <SelectItem value="2">2 Felder</SelectItem>
                <SelectItem value="3">3 Felder (empfohlen)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Step4Media;
