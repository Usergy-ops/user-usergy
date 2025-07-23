
-- Create enum types for project and invitation management
CREATE TYPE project_status_enum AS ENUM ('active', 'completed', 'cancelled', 'pending');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE project_category_enum AS ENUM ('ai_ml', 'mobile_apps', 'web_platforms', 'blockchain', 'data_science', 'ui_ux', 'other');
CREATE TYPE difficulty_level_enum AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category project_category_enum NOT NULL,
  difficulty_level difficulty_level_enum NOT NULL,
  reward_amount DECIMAL(10,2) NOT NULL,
  deadline DATE,
  required_skills TEXT[] DEFAULT '{}',
  status project_status_enum NOT NULL DEFAULT 'active',
  client_name TEXT NOT NULL,
  client_avatar_url TEXT,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_participants table (for tracking user participation)
CREATE TABLE public.project_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_percentage INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  earned_amount DECIMAL(10,2),
  completed_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  UNIQUE(project_id, user_id)
);

-- Create project_invitations table
CREATE TABLE public.project_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status invitation_status_enum NOT NULL DEFAULT 'pending',
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project_applications table (for public project interest)
CREATE TABLE public.project_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Public projects are viewable by everyone" ON public.projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view projects they participate in" ON public.projects
  FOR SELECT USING (
    id IN (
      SELECT project_id FROM public.project_participants 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for project_participants
CREATE POLICY "Users can view their own participation" ON public.project_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON public.project_participants
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for project_invitations
CREATE POLICY "Users can view their own invitations" ON public.project_invitations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own invitations" ON public.project_invitations
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for project_applications
CREATE POLICY "Users can view their own applications" ON public.project_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own applications" ON public.project_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Add some sample data for development
INSERT INTO public.projects (title, description, category, difficulty_level, reward_amount, deadline, required_skills, client_name, client_avatar_url) VALUES
('AI-Powered Customer Service Bot', 'Develop an intelligent chatbot that can handle complex customer inquiries using natural language processing and machine learning algorithms.', 'ai_ml', 'advanced', 5000.00, '2025-03-15', '{AI, Python, NLP, Machine Learning}', 'TechCorp Solutions', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
('Mobile Trading App Development', 'Create a secure, real-time trading application for iOS and Android with advanced charting capabilities and portfolio management.', 'mobile_apps', 'expert', 7500.00, '2025-02-28', '{React Native, iOS, Android, Trading APIs}', 'FinanceFlow Inc', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
('E-commerce Platform Redesign', 'Modernize an existing e-commerce platform with improved UX, performance optimization, and mobile responsiveness.', 'web_platforms', 'intermediate', 3500.00, '2025-04-10', '{React, Node.js, UX Design, Performance}', 'RetailMaster', 'https://images.unsplash.com/photo-1494790108755-2616b4080e22?w=150&h=150&fit=crop&crop=face'),
('Blockchain Voting System', 'Build a secure, transparent voting system using blockchain technology with smart contracts and decentralized verification.', 'blockchain', 'expert', 8000.00, '2025-05-20', '{Solidity, Blockchain, Smart Contracts, Web3}', 'GovTech Innovations', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face');

-- Insert sample invitations
INSERT INTO public.project_invitations (project_id, user_id, invited_by, message, expires_at) VALUES
((SELECT id FROM public.projects WHERE title = 'AI-Powered Customer Service Bot'), 
 (SELECT user_id FROM public.profiles LIMIT 1), 
 (SELECT user_id FROM public.profiles LIMIT 1), 
 'Your AI expertise makes you perfect for this project. We would love to have you on board!', 
 NOW() + INTERVAL '7 days'),
((SELECT id FROM public.projects WHERE title = 'Mobile Trading App Development'), 
 (SELECT user_id FROM public.profiles LIMIT 1), 
 (SELECT user_id FROM public.profiles LIMIT 1), 
 'Based on your mobile development experience, we think you would be an excellent fit for this challenging project.', 
 NOW() + INTERVAL '5 days');

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_invitations_updated_at
  BEFORE UPDATE ON public.project_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
