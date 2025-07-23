
import React from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { useProjects, useProjectInvitations } from '@/hooks/useProjects';
import { Briefcase, Users, Trophy, Clock } from 'lucide-react';

const Dashboard = () => {
  const { profileData } = useProfile();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: invitations, isLoading: invitationsLoading } = useProjectInvitations();

  const stats = [
    {
      title: 'Active Projects',
      value: '3',
      description: 'Currently working on',
      icon: Briefcase,
      trend: { value: '2', positive: true },
    },
    {
      title: 'Total Earnings',
      value: '$12,450',
      description: 'This month',
      icon: Trophy,
      trend: { value: '15%', positive: true },
    },
    {
      title: 'Community Rank',
      value: '#247',
      description: 'Out of 2,500 explorers',
      icon: Users,
      trend: { value: '12', positive: true },
    },
    {
      title: 'Completion Rate',
      value: '94%',
      description: 'Project success rate',
      icon: Clock,
      trend: { value: '2%', positive: true },
    },
  ];

  if (projectsLoading || invitationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      
      <div className="flex">
        <DashboardSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {profileData.full_name}! 🚀
              </h1>
              <p className="text-lg text-muted-foreground">
                Ready to explore amazing projects and connect with fellow innovators?
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Projects Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Featured Projects</h2>
                  <button className="text-primary hover:text-primary-end transition-colors">
                    View All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {projects?.slice(0, 4).map((project) => (
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      title={project.title}
                      description={project.description}
                      category={project.category}
                      difficulty={project.difficulty_level}
                      reward={project.reward_amount}
                      deadline={project.deadline}
                      skills={project.required_skills}
                      clientName={project.client_name}
                      clientAvatar={project.client_avatar_url}
                      maxParticipants={project.max_participants}
                      currentParticipants={project.current_participants}
                      featured={Math.random() > 0.5}
                    />
                  ))}
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                <QuickActions />
                <ActivityFeed />
              </div>
            </div>

            {/* Invitations Section */}
            {invitations && invitations.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Project Invitations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {invitations.map((invitation: any) => (
                    <ProjectCard
                      key={invitation.id}
                      id={invitation.projects.id}
                      title={invitation.projects.title}
                      description={invitation.projects.description}
                      category={invitation.projects.category}
                      difficulty={invitation.projects.difficulty_level}
                      reward={invitation.projects.reward_amount}
                      deadline={invitation.expires_at}
                      skills={[]}
                      clientName={invitation.projects.client_name}
                      clientAvatar={invitation.projects.client_avatar_url}
                      maxParticipants={1}
                      currentParticipants={0}
                      featured={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
