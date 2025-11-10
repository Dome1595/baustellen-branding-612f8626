import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Palette, Image, FileText, Truck, Building2, Fence } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTE4LTE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-10"></div>

        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Ihr individuelles
              <br />
              <span className="text-accent">Baustellen-Branding-Paket</span>
            </h1>
            <p className="mb-8 text-lg text-primary-foreground/90 md:text-xl">
              Professionell, markentreu und startklar in wenigen Sekunden
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="group h-14 px-8 text-lg font-semibold"
              onClick={() => navigate("/wizard")}
            >
              Projekt starten
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Wie funktioniert es?</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            In 5 einfachen Schritten zu Ihrem professionellen Baustellen-Branding
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group relative overflow-hidden border-2 p-6 transition-all hover:shadow-lg hover:border-primary/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">1. Gewerk & Kontakt</h3>
            <p className="text-muted-foreground">
              Wählen Sie Ihr Gewerk (Maler oder SHK) und geben Sie Ihre Kontaktdaten an
            </p>
          </Card>

          <Card className="group relative overflow-hidden border-2 p-6 transition-all hover:shadow-lg hover:border-primary/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">2. Corporate Design</h3>
            <p className="text-muted-foreground">
              Laden Sie Ihr Logo hoch – die KI analysiert automatisch Ihre Markenfarben
            </p>
          </Card>

          <Card className="group relative overflow-hidden border-2 p-6 transition-all hover:shadow-lg hover:border-primary/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">3. Ihre Botschaft</h3>
            <p className="text-muted-foreground">
              Die KI generiert passende Slogans für Recruiting, Leistungen oder Markenbildung
            </p>
          </Card>

          <Card className="group relative overflow-hidden border-2 p-6 transition-all hover:shadow-lg hover:border-primary/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">4. Werbeträger</h3>
            <p className="text-muted-foreground">
              Fahrzeugbeschriftung, Gerüstplane oder Bauzaunbanner – mit Kontrastcheck
            </p>
          </Card>

          <Card className="group relative overflow-hidden border-2 p-6 transition-all hover:shadow-lg hover:border-primary/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Image className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">5. Stil & Kreativität</h3>
            <p className="text-muted-foreground">
              Wählen Sie Ihr Design-Level – von klassisch bis kreativ mit KI-Visuals
            </p>
          </Card>

          <Card className="group relative overflow-hidden border-2 p-6 transition-all hover:shadow-lg hover:border-primary/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Fertig!</h3>
            <p className="text-muted-foreground">
              Erhalten Sie Ihr komplettes Branding-Paket als PDF mit allen Mockups
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Bereit für Ihr Baustellen-Branding?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Starten Sie jetzt und sichern Sie sich professionelle Werbemittel für Ihre Baustellen
          </p>
          <Button size="lg" className="group h-14 px-8 text-lg font-semibold" onClick={() => navigate("/wizard")}>
            Jetzt starten
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>
    </div>
  );
};
export default Index;
