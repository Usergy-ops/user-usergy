
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Star, 
  ArrowRight,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

const statsCards = [
  {
    title: "Profile Score",
    value: "95%",
    change: "+12%",
    icon: Target,
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    title: "Project Matches",
    value: "23",
    change: "+5 new",
    icon: Briefcase,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Applications",
    value: "8",
    change: "3 pending",
    icon: Users,
    color: "text-accent-red",
    bgColor: "bg-accent-red/10"
  },
  {
    title: "Success Rate",
    value: "87%",
    change: "+3%",
    icon: Award,
    color: "text-success",
    bgColor: "bg-success/10"
  }
];

const recentProjects = [
  {
    title: "AI Research Assistant",
    company: "TechCorp",
    match: 95,
    deadline: "3 days",
    type: "Full-time",
    skills: ["Python", "Machine Learning", "Research"]
  },
  {
    title: "Mobile App Designer",
    company: "StartupXYZ",
    match: 89,
    deadline: "1 week",
    type: "Contract",
    skills: ["UI/UX", "Figma", "React Native"]
  },
  {
    title: "DevOps Engineer",
    company: "CloudTech",
    match: 78,
    deadline: "2 weeks",
    type: "Full-time",
    skills: ["AWS", "Docker", "Kubernetes"]
  }
];

export const DashboardOverview: React.FC = () => {
  const { profileData } = useProfile();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-start/10 to-primary-end/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome back, {profileData.full_name}! 👋
            </h1>
            <p className="text-muted-foreground">
              You have 5 new project matches and 3 pending applications to review.
            </p>
          </div>
          <Button className="usergy-btn-primary">
            View All Matches
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="usergy-shadow-soft hover:usergy-shadow-medium transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Project Matches */}
        <div className="lg:col-span-2">
          <Card className="usergy-shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Recent Project Matches
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.map((project, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{project.title}</h4>
                      <p className="text-sm text-muted-foreground">{project.company}</p>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                      {project.match}% match
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {project.deadline}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {project.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="outline">
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Profile & Quick Actions */}
        <div className="space-y-6">
          {/* Profile Completion */}
          <Card className="usergy-shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {profileData.completion_percentage}%
                </div>
                <Progress value={profileData.completion_percentage} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Skills Assessment</span>
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Portfolio Links</span>
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recommendations</span>
                  <Star className="w-4 h-4 text-gray-300" />
                </div>
              </div>
              
              <Button className="w-full usergy-btn-secondary">
                Complete Profile
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="usergy-shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Search className="w-4 h-4 mr-2" />
                Browse Projects
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Find Collaborators
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
