-- Create enum types
CREATE TYPE public.trade AS ENUM ('MALER', 'SHK');
CREATE TYPE public.cluster AS ENUM ('RECRUITING', 'KUNDEN_LEISTUNG', 'VERTRAUEN_SERVICE', 'BRANDING');
CREATE TYPE public.project_status AS ENUM ('DRAFT', 'READY', 'SENT');

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Step 1: Trade selection
  trade public.trade,
  
  -- Step 1a: Contact details (CTA)
  company_name TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  address TEXT,
  
  -- Step 2: Corporate Design (CD)
  logo_url TEXT,
  logo_has_alpha BOOLEAN DEFAULT false,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  
  -- Step 3: Message/Botschaft
  cluster public.cluster,
  variant TEXT,
  slogans_ki JSONB,
  slogan_selected TEXT,
  
  -- Step 4: Advertising media/Werbeträger - Vehicle
  vehicle_enabled BOOLEAN DEFAULT true,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_body TEXT,
  vehicle_wheelbase TEXT,
  vehicle_roof TEXT,
  vehicle_color TEXT,
  vehicle_blueprint TEXT,
  
  -- Step 4: Scaffold/Gerüst
  scaffold_enabled BOOLEAN DEFAULT true,
  scaffold_size TEXT,
  scaffold_width_cm INTEGER,
  scaffold_height_cm INTEGER,
  
  -- Step 4: Fence/Bauzaun
  fence_enabled BOOLEAN DEFAULT true,
  fence_fields INTEGER,
  
  -- Step 5: Style/Stil
  creativity_level INTEGER DEFAULT 2 CHECK (creativity_level >= 1 AND creativity_level <= 3),
  
  -- Results/Ergebnisse
  mockups JSONB,
  pdf_url TEXT,
  status public.project_status DEFAULT 'DRAFT'
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (MVP without login)
CREATE POLICY "Anyone can create projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view projects" 
  ON public.projects 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can update projects" 
  ON public.projects 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete projects" 
  ON public.projects 
  FOR DELETE 
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_trade ON public.projects(trade);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);