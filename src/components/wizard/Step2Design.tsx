import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step2DesignProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step2Design = ({ data, onUpdate }: Step2DesignProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Bitte laden Sie ein gültiges Logo-Format hoch (SVG, PNG, JPG oder PDF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Die Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      onUpdate({ logoUrl: publicUrl, logoFileName: file.name });
      toast.success('Logo erfolgreich hochgeladen');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen des Logos');
    } finally {
      setIsUploading(false);
    }
  };

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
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.pdf"
            className="hidden"
            onChange={handleLogoUpload}
          />
          {!data.logoUrl ? (
            <div className="text-center">
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                Ziehen Sie Ihr Logo hierher oder klicken Sie zum Auswählen
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Wird hochgeladen...' : 'Logo hochladen'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded bg-muted flex items-center justify-center overflow-hidden">
                <img src={data.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Logo erfolgreich hochgeladen</p>
                <p className="text-sm text-muted-foreground">{data.logoFileName || 'logo'}</p>
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
