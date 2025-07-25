
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  deadline DATE,
  reward DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project participants table
CREATE TABLE public.project_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'admin', 'observer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);

-- Create project attachments table
CREATE TABLE public.project_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project invitations table
CREATE TABLE public.project_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects they participate in" 
  ON public.projects FOR SELECT 
  USING (
    id IN (
      SELECT project_id FROM public.project_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project creators can manage their projects" 
  ON public.projects FOR ALL 
  USING (created_by = auth.uid());

-- RLS Policies for project participants
CREATE POLICY "Users can view participants of their projects" 
  ON public.project_participants FOR SELECT 
  USING (
    project_id IN (
      SELECT project_id FROM public.project_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can manage participants" 
  ON public.project_participants FOR ALL 
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p 
      WHERE p.created_by = auth.uid()
    )
  );

-- RLS Policies for project attachments
CREATE POLICY "Users can view attachments of their projects" 
  ON public.project_attachments FOR SELECT 
  USING (
    project_id IN (
      SELECT project_id FROM public.project_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project participants can manage attachments" 
  ON public.project_attachments FOR ALL 
  USING (
    project_id IN (
      SELECT project_id FROM public.project_participants 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for project invitations
CREATE POLICY "Users can view invitations for their projects" 
  ON public.project_invitations FOR SELECT 
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p 
      WHERE p.created_by = auth.uid()
    ) OR email = auth.email()
  );

CREATE POLICY "Project creators can manage invitations" 
  ON public.project_invitations FOR ALL 
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p 
      WHERE p.created_by = auth.uid()
    )
  );

-- Create updated_at trigger for projects
CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at_trigger
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_projects_updated_at();

-- Insert sample data for the AI Product Testing Mission project
INSERT INTO public.projects (
  id,
  title,
  description,
  instructions,
  deadline,
  reward,
  status,
  progress
) VALUES (
  '1',
  'AI Product Testing Mission',
  'Test and provide feedback on cutting-edge AI tools to help shape the future of artificial intelligence',
  '# Welcome to the AI Product Testing Mission

## Overview
You have been selected to participate in an exclusive AI product testing program. Your feedback will directly influence the development of next-generation AI tools.

## Objectives
1. **Evaluate Core Features**: Test all primary functionalities
2. **User Experience Assessment**: Document your interaction experience
3. **Performance Analysis**: Monitor speed and responsiveness
4. **Bug Identification**: Report any issues encountered

## Testing Guidelines
- Test each feature thoroughly
- Document both positive and negative feedback
- Include screenshots when reporting issues
- Complete all assigned surveys

## Timeline
- **Week 1**: Initial setup and basic testing
- **Week 2**: Advanced feature evaluation
- **Week 3**: Final assessment and reporting

Remember: Your insights are valuable and will shape the future of AI technology!',
  '2025-08-15',
  15.00,
  'active',
  75
);

-- Insert sample attachments for the project
INSERT INTO public.project_attachments (project_id, name, file_path, file_size, file_type) VALUES
('1', 'Testing Checklist.pdf', '/attachments/testing-checklist.pdf', 2516582, 'pdf'),
('1', 'Setup Guide.docx', '/attachments/setup-guide.docx', 1887437, 'docx');
