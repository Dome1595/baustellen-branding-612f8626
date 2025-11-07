import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Palette, Check } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Step2DesignProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step2Design = ({ data, onUpdate }: Step2DesignProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const extractColorsFromImage = async (file: File): Promise<{ primaryColor: string; secondaryColor: string; accentColor: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Resize for performance
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        
        if (!imageData) {
          resolve({ primaryColor: '#1B4965', secondaryColor: '#62B6CB', accentColor: '#BEE9E8' });
          return;
        }

        // Count colors
        const colorMap = new Map<string, number>();
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];

          // Skip transparent and very light/dark colors
          if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) continue;

          const hex = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }

        // Get top 3 colors
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([color]) => color);

        resolve({
          primaryColor: sortedColors[0] || '#1B4965',
          secondaryColor: sortedColors[1] || '#62B6CB',
          accentColor: sortedColors[2] || '#BEE9E8',
        });
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Bitte laden Sie ein PNG, JPG oder SVG Bild hoch');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Die Datei ist zu groß. Maximal 5MB erlaubt.');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      toast.success('Logo erfolgreich hochgeladen');

      // Extract colors from logo using Langdock
      try {
        const { data: colorsData, error: colorsError } = await supabase.functions.invoke('extract-logo-colors', {
          body: { logoUrl: publicUrl }
        });

        if (colorsError) throw colorsError;

        if (colorsData) {
          onUpdate({ 
            logoUrl: publicUrl,
            primaryColor: colorsData.primaryColor,
            secondaryColor: colorsData.secondaryColor,
            accentColor: colorsData.accentColor
          });
          toast.success('Markenfarben automatisch erkannt');
        } else {
          onUpdate({ logoUrl: publicUrl });
        }
      } catch (colorError) {
        console.error('Error extracting colors:', colorError);
        onUpdate({ logoUrl: publicUrl });
        toast.info('Farben manuell auswählen oder Palette wählen');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Fehler beim Hochladen des Logos');
    } finally {
      setIsUploading(false);
    }
  };

  const suggestedPalettes = [
    {
      name: "Blau-Grün",
      primary: "#1B4965",
      secondary: "#62B6CB",
      accent: "#BEE9E8",
    },
    {
      name: "Orange-Grau",
      primary: "#FF6B35",
      secondary: "#F7931E",
      accent: "#C5C6C7",
    },
    {
      name: "Grün-Beige",
      primary: "#2B7A78",
      secondary: "#3AAFA9",
      accent: "#DEF2F1",
    },
  ];

  return (
    <div>
      <p className="mb-6 text-lg text-muted-foreground">
        Laden Sie Ihr Logo hoch und definieren Sie Ihre Markenfarben.
      </p>

      {/* Logo Upload */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold">2.1 Logo hochladen</h3>
        <Card className="border-2 border-dashed p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg"
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Anderes Logo wählen
                </Button>
              </div>
              <Check className="h-6 w-6 text-primary" />
            </div>
          )}
        </Card>
      </div>

      {/* Colors */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold">2.2 Markenfarben</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {data.logoUrl 
            ? "Wählen Sie eine Farbpalette oder passen Sie die erkannten Farben an."
            : "Laden Sie zuerst ein Logo hoch, um Farben zu erkennen."}
        </p>

        {data.logoUrl && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {suggestedPalettes.map((palette, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer border-2 p-4 transition-all hover:shadow-md ${
                    data.primaryColor === palette.primary && data.secondaryColor === palette.secondary
                      ? "border-primary"
                      : "border-border"
                  }`}
                  onClick={() => {
                    onUpdate({
                      primaryColor: palette.primary,
                      secondaryColor: palette.secondary,
                      accentColor: palette.accent,
                    });
                  }}
                >
                  <div className="mb-3 flex gap-2">
                    <div
                      className="h-12 flex-1 rounded"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <div
                      className="h-12 flex-1 rounded"
                      style={{ backgroundColor: palette.secondary }}
                    />
                    <div
                      className="h-12 flex-1 rounded"
                      style={{ backgroundColor: palette.accent }}
                    />
                  </div>
                  <p className="text-center text-sm font-medium">{palette.name}</p>
                </Card>
              ))}
            </div>

            {showColorPicker ? (
              <Card className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Primärfarbe</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={data.primaryColor || '#1B4965'}
                        onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                        className="h-10 w-20"
                      />
                      <Input
                        type="text"
                        value={data.primaryColor || '#1B4965'}
                        onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                        placeholder="#HEXCODE"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Sekundärfarbe</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={data.secondaryColor || '#62B6CB'}
                        onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                        className="h-10 w-20"
                      />
                      <Input
                        type="text"
                        value={data.secondaryColor || '#62B6CB'}
                        onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
                        placeholder="#HEXCODE"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Akzentfarbe</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={data.accentColor || '#BEE9E8'}
                        onChange={(e) => onUpdate({ accentColor: e.target.value })}
                        className="h-10 w-20"
                      />
                      <Input
                        type="text"
                        value={data.accentColor || '#BEE9E8'}
                        onChange={(e) => onUpdate({ accentColor: e.target.value })}
                        placeholder="#HEXCODE"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowColorPicker(false)}
                  >
                    Farbauswahl schließen
                  </Button>
                </div>
              </Card>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowColorPicker(true)}
              >
                <Palette className="mr-2 h-4 w-4" />
                Farben manuell definieren
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Step2Design;
