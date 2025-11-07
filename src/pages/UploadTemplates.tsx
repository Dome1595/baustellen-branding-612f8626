import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const TEMPLATES = [
  { file: "Ford_Mockup_Sprinter.png", name: "ford-transporter.png" },
  { file: "VW_Sprinter_Mockup.png", name: "vw-transporter.png" },
  { file: "Mercedes_Sprinter_Mockup.png", name: "mercedes-sprinter.png" },
  { file: "Mercedes_Transporter_Mockup.png", name: "mercedes-transporter.png" },
  { file: "Gerüstplanen_Mockup.png", name: "scaffold-banner.png" },
  { file: "Bauzaunbanner_Mockup.png", name: "fence-banner.png" },
];

export default function UploadTemplates() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Record<string, "success" | "error" | "uploading">>({});
  const { toast } = useToast();

  const uploadTemplate = async (file: File, targetName: string) => {
    try {
      setResults(prev => ({ ...prev, [targetName]: "uploading" }));

      const { error } = await supabase.storage
        .from("mockup-templates")
        .upload(targetName, file, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) throw error;

      setResults(prev => ({ ...prev, [targetName]: "success" }));
      return true;
    } catch (error) {
      console.error(`Failed to upload ${targetName}:`, error);
      setResults(prev => ({ ...prev, [targetName]: "error" }));
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const fileArray = Array.from(files);
    
    let successCount = 0;
    for (const file of fileArray) {
      // Match file to template name
      const template = TEMPLATES.find(t => 
        file.name.toLowerCase().includes(t.file.toLowerCase().split('.')[0].toLowerCase())
      );
      
      if (template) {
        const success = await uploadTemplate(file, template.name);
        if (success) successCount++;
      }
    }

    setUploading(false);
    
    if (successCount === fileArray.length) {
      toast({
        title: "Upload erfolgreich!",
        description: `Alle ${successCount} Templates wurden hochgeladen.`,
      });
    } else {
      toast({
        title: "Upload teilweise erfolgreich",
        description: `${successCount} von ${fileArray.length} Templates hochgeladen.`,
        variant: "destructive",
      });
    }
  };

  const checkExistingTemplates = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("mockup-templates")
        .list();

      if (error) throw error;

      const existing: Record<string, "success"> = {};
      data.forEach(file => {
        existing[file.name] = "success";
      });
      
      setResults(existing);
      
      toast({
        title: "Status geprüft",
        description: `${data.length} Templates gefunden.`,
      });
    } catch (error) {
      console.error("Error checking templates:", error);
      toast({
        title: "Fehler",
        description: "Konnte Templates nicht überprüfen.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Template Upload</h1>
          <p className="text-muted-foreground">
            Lade die 6 Mockup-Templates in Supabase Storage hoch
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Benötigte Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map(template => (
                <div
                  key={template.name}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {results[template.name] === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {results[template.name] === "error" && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  {results[template.name] === "uploading" && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {!results[template.name] && (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.file}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={checkExistingTemplates}
                variant="outline"
                className="flex-1"
              >
                Status prüfen
              </Button>
              
              <label className="flex-1">
                <Button
                  disabled={uploading}
                  className="w-full"
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Templates hochladen"}
                  </span>
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Anleitung:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Lade alle 6 Template-Bilder von deinem Computer</li>
                <li>Die Dateien werden automatisch umbenannt und hochgeladen</li>
                <li>Nach dem Upload sind die Mockups funktionsfähig</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
