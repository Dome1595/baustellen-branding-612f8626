import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

interface Step1aContactProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step1aContact = ({ data, onUpdate }: Step1aContactProps) => {
  return (
    <div>
      <p className="mb-6 text-lg text-muted-foreground">
        Diese Informationen platzieren wir gut lesbar und technisch sicher auf Ihren Werbemitteln.
      </p>

      <Card className="mb-6 border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <InfoIcon className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Der Firmenname ist Pflichtangabe. Website, Telefon und Adresse sind optional,
            erhöhen aber die Kontaktmöglichkeiten für potenzielle Kunden.
          </p>
        </div>
      </Card>

      <div className="space-y-6">
        <div>
          <Label htmlFor="companyName" className="text-base">
            Firmenname <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            placeholder="z.B. Maler Mustermann GmbH"
            value={data.companyName}
            onChange={(e) => onUpdate({ companyName: e.target.value })}
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="website" className="text-base">
            Website (optional)
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="z.B. www.mustermann-maler.de"
            value={data.website}
            onChange={(e) => onUpdate({ website: e.target.value })}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-base">
            Telefon (optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="z.B. 0123 456789"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-base">
            Adresse (optional)
          </Label>
          <Input
            id="address"
            placeholder="z.B. Musterstraße 1, 12345 Musterstadt"
            value={data.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1aContact;
