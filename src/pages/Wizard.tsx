import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Step1Trade from "@/components/wizard/Step1Trade";
import Step1aContact from "@/components/wizard/Step1aContact";
import Step2Design from "@/components/wizard/Step2Design";
import Step3Message from "@/components/wizard/Step3Message";
import Step4Media from "@/components/wizard/Step4Media";
import Step5Style from "@/components/wizard/Step5Style";

const TOTAL_STEPS = 6;

const Wizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<any>({
    trade: null,
    companyName: "",
    website: "",
    phone: "",
    address: "",
    logoUrl: null,
    primaryColor: null,
    secondaryColor: null,
    accentColor: null,
    cluster: null,
    variant: null,
    selectedSlogan: null,
    vehicleEnabled: true,
    scaffoldEnabled: true,
    fenceEnabled: true,
    creativityLevel: 2,
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return projectData.trade !== null;
      case 2:
        return projectData.companyName.trim().length > 0;
      case 3:
        return projectData.logoUrl !== null && projectData.primaryColor !== null;
      case 4:
        return projectData.cluster !== null && projectData.selectedSlogan !== null;
      case 5:
        return projectData.vehicleEnabled || projectData.scaffoldEnabled || projectData.fenceEnabled;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save project data to database before navigating to review
      try {
        const { data: project, error } = await supabase
          .from('projects')
          .insert([{
            trade: projectData.trade,
            company_name: projectData.companyName,
            website: projectData.website,
            phone: projectData.phone,
            address: projectData.address,
            logo_url: projectData.logoUrl,
            primary_color: projectData.primaryColor,
            secondary_color: projectData.secondaryColor,
            accent_color: projectData.accentColor,
            cluster: projectData.cluster,
            variant: projectData.variant,
            slogan_selected: projectData.selectedSlogan,
            vehicle_enabled: projectData.vehicleEnabled,
            vehicle_brand: projectData.vehicleBrand,
            vehicle_model: projectData.vehicleModel,
            vehicle_body: projectData.vehicleBody,
            vehicle_wheelbase: projectData.vehicleWheelbase,
            vehicle_roof: projectData.vehicleRoof,
            scaffold_enabled: projectData.scaffoldEnabled,
            scaffold_size: projectData.scaffoldSize,
            scaffold_width_cm: projectData.scaffoldWidthCm,
            scaffold_height_cm: projectData.scaffoldHeightCm,
            fence_enabled: projectData.fenceEnabled,
            fence_fields: projectData.fenceFields,
            creativity_level: projectData.creativityLevel,
            status: 'DRAFT'
          }])
          .select()
          .single();

        if (error) throw error;

        navigate('/review', { state: { projectId: project.id, projectData } });
      } catch (error) {
        console.error('Error saving project:', error);
        toast.error('Fehler beim Speichern des Projekts');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const updateProjectData = (data: any) => {
    setProjectData({ ...projectData, ...data });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Trade data={projectData} onUpdate={updateProjectData} />;
      case 2:
        return <Step1aContact data={projectData} onUpdate={updateProjectData} />;
      case 3:
        return <Step2Design data={projectData} onUpdate={updateProjectData} />;
      case 4:
        return <Step3Message data={projectData} onUpdate={updateProjectData} />;
      case 5:
        return <Step4Media data={projectData} onUpdate={updateProjectData} />;
      case 6:
        return <Step5Style data={projectData} onUpdate={updateProjectData} />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Schritt 1: Wer sind Sie?";
      case 2:
        return "Schritt 1a: Ihr Call-to-Action";
      case 3:
        return "Schritt 2: Corporate Design";
      case 4:
        return "Schritt 3: Ihre Botschaft";
      case 5:
        return "Schritt 4: Werbeträger";
      case 6:
        return "Schritt 5: Stil & Kreativität";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Baustellen-Branding-Paket</h1>
            <span className="text-sm text-muted-foreground">
              Schritt {currentStep} von {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-foreground">{getStepTitle()}</h2>
          
          <div className="mb-8">{renderStep()}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t bg-background pt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="group"
            >
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Zurück
            </Button>

            <Button
              size="lg"
              onClick={handleNext}
              disabled={!canProceed()}
              className="group"
            >
              {currentStep === TOTAL_STEPS ? "Zur Zusammenfassung" : "Weiter"}
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wizard;
