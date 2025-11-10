import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MockupPreviewProps {
  projectId?: string;
  selectedTemplates?: string[];
}

interface Mockup {
  type: string;
  url: string;
  title: string;
}

export function MockupPreview({ projectId, selectedTemplates = [] }: MockupPreviewProps) {
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  // Mockups aus Datenbank laden
  const loadMockups = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      console.log("🔍 Loading mockups for project:", projectId);

      const { data, error } = await supabase
        .from("mockup_results")
        .select("mockups, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Keine Mockups gefunden - das ist OK
          console.log("ℹ️ No mockups found yet");
          setMockups([]);
          return;
        }
        throw error;
      }

      if (data?.mockups) {
        console.log("✅ Mockups loaded:", data.mockups);
        setMockups(data.mockups);
      }
    } catch (error) {
      console.error("❌ Error loading mockups:", error);
      toast({
        title: "Fehler beim Laden",
        description: "Mockups konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mockups generieren
  const generateMockups = async () => {
    if (!projectId) {
      toast({
        title: "Fehler",
        description: "Keine Projekt-ID vorhanden.",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      console.log("🎨 Starting mockup generation...");

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/generate-mockups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({ projectId }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Generation failed: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Mockups generated:", result);

      toast({
        title: "Erfolgreich!",
        description: `${result.mockups?.length || 0} Mockups wurden generiert.`,
      });

      // Mockups neu laden
      await loadMockups();
    } catch (error) {
      console.error("❌ Error generating mockups:", error);
      toast({
        title: "Generierung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Mockups beim Laden der Komponente abrufen
  useEffect(() => {
    loadMockups();
  }, [projectId]);

  // Realtime-Updates abonnieren (optional)
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`mockup-updates-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mockup_results",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log("🔔 New mockup result:", payload);
          loadMockups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mockup-Vorschau</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Mockups werden geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mockup-Vorschau</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMockups}
            disabled={loading || generating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          {mockups.length === 0 && selectedTemplates.length > 0 && (
            <Button
              onClick={generateMockups}
              disabled={generating}
              size="sm"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird generiert...
                </>
              ) : (
                "Mockups generieren"
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {mockups.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">
              Keine Mockups verfügbar. Bitte wählen Sie mindestens einen Werbeträger.
            </p>
            {selectedTemplates.length > 0 && (
              <Button onClick={generateMockups} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mockups werden generiert...
                  </>
                ) : (
                  "Jetzt Mockups generieren"
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockups.map((mockup, index) => (
              <div key={index} className="space-y-3">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                  {mockup.url ? (
                    <img
                      src={mockup.url}
                      alt={mockup.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Image load error:", mockup.url);
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{mockup.title}</h3>
                  {mockup.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = mockup.url;
                        link.download = `${mockup.title}.png`;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
