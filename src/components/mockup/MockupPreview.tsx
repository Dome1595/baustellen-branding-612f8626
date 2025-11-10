import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface MockupData {
  id: string;
  vehicleType: string;
  imageUrl: string;
  templateName: string;
}

interface MockupPreviewProps {
  mockups: MockupData[];
  isGenerating?: boolean;
}

export function MockupPreview({ mockups, isGenerating = false }: MockupPreviewProps) {
  console.log("MockupPreview - Received mockups:", mockups);
  console.log("MockupPreview - Count:", mockups?.length || 0);

  const handleDownload = (mockup: MockupData) => {
    const link = document.createElement('a');
    link.href = mockup.imageUrl;
    link.download = `${mockup.vehicleType}-${mockup.templateName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    mockups.forEach((mockup, index) => {
      setTimeout(() => handleDownload(mockup), index * 500);
    });
  };

  if (isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mockup-Vorschau</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Mockups werden generiert...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Dies kann bis zu 2 Minuten dauern
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!mockups || mockups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mockup-Vorschau</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            Keine Mockups verfügbar. Bitte wählen Sie mindestens einen Werbeträger.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mockup-Vorschau ({mockups.length})</CardTitle>
        {mockups.length > 1 && (
          <Button onClick={handleDownloadAll} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Alle herunterladen
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockups.map((mockup) => (
            <div key={mockup.id} className="group relative">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={mockup.imageUrl}
                  alt={`${mockup.vehicleType} Mockup`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Image load error:", mockup.imageUrl);
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EBild fehlt%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{mockup.vehicleType}</p>
                  <p className="text-xs text-muted-foreground">{mockup.templateName}</p>
                </div>
                <Button
                  onClick={() => handleDownload(mockup)}
                  variant="ghost"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
